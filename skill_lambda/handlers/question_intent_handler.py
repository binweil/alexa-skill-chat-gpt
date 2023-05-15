import json
import logging
import time
import traceback
from concurrent.futures import ThreadPoolExecutor

import boto3
import requests
from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_core.utils import is_request_type, is_intent_name
from ask_sdk_model import Intent, Slot
from ask_sdk_model.dialog import ElicitSlotDirective
from ask_sdk_model.interfaces.alexa.presentation.apl import RenderDocumentDirective
from botocore.exceptions import ClientError

from constants import prompts
from constants.apl_constants import VisualizeResponseTextAPL
from constants.intent_constants import QUESTION_INTENT_NAME, RequestType, QUESTION_INTENT_QUESTION_SLOT_NAME, \
    QUESTION_INTENT_MAX_FREE_INTERACTION_COUNT
from constants.prompts import SUBSCRIPTION_UPSELL
from directive.progressive_directive import call_directive_service
from handlers.buy_subs_intent_handler import BuySubsIntentHandler
from handlers.cancel_subs_handler import CancelSubsIntentHandler
from handlers.help_intent_handler import HelpIntentHandler
from utils.intent_dispatch_utils import is_clear_context_request, is_stop_session_request, is_buy_subs_request, \
    is_cancel_subs_request, supports_apl, is_help_request
from utils.isp_utils import is_entitled

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class QuestionIntentHandler(AbstractRequestHandler):
    """Handler for Skill Launch and GetNewFact Intent."""

    def __init__(self):
        self.api_key = ""
        self.context = []
        self.data = None
        self.interaction_count = 0
        self.redirected_search_query = ""
        self.search_query = ""
        self.gpt_response = ""
        self.finish_reason = ""
        self.gpt_image_response = ""
        self.MAX_CHAT_CONTEXT = 6

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return (is_request_type(RequestType.INTENT_REQUEST.value)(handler_input) and
                is_intent_name(QUESTION_INTENT_NAME)(handler_input))

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("QuestionIntentHandler Handling Request")
        # Get Localization Data
        self.data = handler_input.attributes_manager.request_attributes["_"]

        try:
            # Check if user want to special intent
            if is_help_request(handler_input):
                help_handler = HelpIntentHandler()
                slots = handler_input.request_envelope.request.intent.slots
                return help_handler.handle(handler_input)

            if is_stop_session_request(handler_input):
                speech = self.data[prompts.STOP_MESSAGE]
                handler_input.response_builder.speak(speech)
                # return handler_input.response_builder.set_should_end_session(should_end_session=True).response
                return handler_input.response_builder \
                    .set_should_end_session(should_end_session=True) \
                    .response

            if is_clear_context_request(handler_input):
                # reset chat_context session attributes
                handler_input.attributes_manager.session_attributes["chat_context"] = []
                # build response
                speech = self.data[prompts.CONTEXT_CLEAR_RESPONSE]
                handler_input.response_builder.speak(speech)
                handler_input.response_builder \
                    .add_directive(ElicitSlotDirective(
                        updated_intent=Intent(
                            name=QUESTION_INTENT_NAME,
                            slots={
                                "question": Slot(
                                    name=QUESTION_INTENT_QUESTION_SLOT_NAME,
                                    value=("{" + QUESTION_INTENT_QUESTION_SLOT_NAME + "}")
                                )}
                        ),
                        slot_to_elicit=QUESTION_INTENT_QUESTION_SLOT_NAME))
                return handler_input.response_builder.set_should_end_session(should_end_session=False).response

            if is_buy_subs_request(handler_input):
                buy_subs_handler = BuySubsIntentHandler()
                slots = handler_input.request_envelope.request.intent.slots
                utterance_text = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value
                return buy_subs_handler.handle_text_request(handler_input, utterance_text)

            if is_cancel_subs_request(handler_input):
                cancel_subs_handler = CancelSubsIntentHandler()
                slots = handler_input.request_envelope.request.intent.slots
                utterance_text = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value
                return cancel_subs_handler.handle_text_request(handler_input, utterance_text)

            self.process_chat_context(handler_input)
            if (self.interaction_count > QUESTION_INTENT_MAX_FREE_INTERACTION_COUNT) \
                    and (not is_entitled(handler_input)):
                return handler_input.response_builder \
                    .speak(self.data[SUBSCRIPTION_UPSELL]) \
                    .add_directive(ElicitSlotDirective(
                        updated_intent=Intent(
                            name=QUESTION_INTENT_NAME,
                            slots={
                                "question": Slot(
                                    name=QUESTION_INTENT_QUESTION_SLOT_NAME,
                                    value=("{" + QUESTION_INTENT_QUESTION_SLOT_NAME + "}")
                                )}
                        ),
                        slot_to_elicit=QUESTION_INTENT_QUESTION_SLOT_NAME)) \
                    .set_should_end_session(should_end_session=False) \
                    .response

            # call_directive_service(handler_input)
            self.get_api_key()
            self.get_gpt_response()
            logger.info("Successfully get the OpenAI response: " + self.gpt_response)

            if self.finish_reason == "length":
                speech = self.data[prompts.QUESTION_UNFINISHED_RESPONSE].format(self.gpt_response)
            else:
                speech = self.data[prompts.QUESTION_RESPONSE].format(self.gpt_response)

            # Render APL Card
            try:
                self.launch_screen(handler_input)
            except Exception as e:
                logger.error("Failed to render QuestionIntent APL card")
                traceback.print_tb(e.__traceback__)

            # No elicit slot when the request is redirected
            if len(self.redirected_search_query) > 0:
                self.redirected_search_query = ""
                return handler_input.response_builder.set_should_end_session(should_end_session=False).response

            return handler_input.response_builder \
                .speak(speech) \
                .add_directive(ElicitSlotDirective(
                    updated_intent=Intent(
                        name=QUESTION_INTENT_NAME,
                        slots={
                            "question": Slot(
                                name=QUESTION_INTENT_QUESTION_SLOT_NAME,
                                value=("{" + QUESTION_INTENT_QUESTION_SLOT_NAME + "}")
                            )}
                    ),
                    slot_to_elicit=QUESTION_INTENT_QUESTION_SLOT_NAME)) \
                .set_should_end_session(should_end_session=False) \
                .response

        except BaseException as e:
            logger.error("Failed to handle QuestionIntent")
            traceback.print_tb(e.__traceback__)
            speech = self.data[prompts.QUESTION_INTENT_OPENAI_ERROR_MESSAGE]
            handler_input.response_builder.speak(speech)
            return handler_input.response_builder \
                .set_should_end_session(should_end_session=True) \
                .add_directive(ElicitSlotDirective(
                    updated_intent=Intent(
                        name=QUESTION_INTENT_NAME,
                        slots={
                            "question": Slot(
                                name=QUESTION_INTENT_QUESTION_SLOT_NAME,
                                value=("{" + QUESTION_INTENT_QUESTION_SLOT_NAME + "}")
                            )}
                    ),
                    slot_to_elicit=QUESTION_INTENT_QUESTION_SLOT_NAME)) \
                .response

    def handle_more_intent(self, handler_input):
        # type: (HandlerInput) -> Response
        self.redirected_search_query = "more"
        return self.handle(handler_input)

    def handle_customized_intent(self, handler_input, search_query):
        # type: (HandlerInput) -> Response
        self.redirected_search_query = search_query
        return self.handle(handler_input)

    def process_chat_context(self, handler_input):
        # type: (HandlerInput) -> None
        if self.redirected_search_query:
            self.search_query = self.redirected_search_query
        else:
            slots = handler_input.request_envelope.request.intent.slots
            self.search_query = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value

        chat_context = handler_input.attributes_manager.session_attributes["chat_context"]
        self.interaction_count = handler_input.attributes_manager.session_attributes["interaction_count"]

        if not chat_context:
            handler_input.attributes_manager.session_attributes["chat_context"] = []
            chat_context = []

        chat_context.append({"role": "user", "content": self.search_query})
        if len(chat_context) > self.MAX_CHAT_CONTEXT:
            chat_context = chat_context[2:]
        self.interaction_count += 1

        self.context = chat_context
        handler_input.attributes_manager.session_attributes["chat_context"] = chat_context
        handler_input.attributes_manager.session_attributes["interaction_count"] = self.interaction_count

    def get_api_key(self):
        secret_name = "voice-gpt"
        region_name = "us-east-1"

        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=region_name,
        )
        try:
            get_secret_value_response = client.get_secret_value(
                SecretId=secret_name
            )
        except ClientError as exception:
            logger.error(exception)

        secret_string = get_secret_value_response['SecretString']
        secret = json.loads(secret_string)
        self.api_key = secret['0']

        return secret['0']

    def get_gpt_response(self):
        try:
            start_time = time.time()
            raw_responses = self.by_request_threadpool()
            text_response = raw_responses["text_response"]
            # image_response = raw_responses["image_response"]
            logger.info("--- It took %s seconds for calling OpenAI ---" % (time.time() - start_time))

            logger.info("Raw response: " + json.dumps(text_response))
            # Replace special characters
            content = text_response["choices"][0]["message"]["content"]
            content = content.replace("&", "&amp;")
            content = content.replace('"', "&quot;")
            content = content.replace("'", "&apos;")
            content = content.replace('<', "&lt;")
            content = content.replace('>', "&gt;")

            # Store text response content
            self.gpt_response = content
            self.context.append({"role": "assistant", "content": content})
            self.finish_reason = text_response["choices"][0]["finish_reason"]

            # Store image response url
            # if image_response["data"][0]["url"]:
            #     self.gpt_image_response = image_response["data"][0]["url"]
        except requests.exceptions.Timeout as exception:
            logger.error(exception)
            self.gpt_response = "The OpenAI server is overloaded now. Please wait a few seconds, and try again."
            self.finish_reason = "timeout"
        except Exception as exception:
            logger.error(exception)
            raise Exception("Failed to call OpenAI: ", exception)

    def by_request_threadpool(self):
        def _request_text():
            headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + self.api_key
            }
            body = {
                "model": "gpt-3.5-turbo",
                "messages": self.context,
                "max_tokens": 100
            }
            text_raw_response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=body,
                                              timeout=10)
            return text_raw_response.json()

        def _request_image():
            headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + self.api_key
            }
            body = {
                "prompt": self.context[-1]["content"],
                "size": "512x512",
                "n": 1,
            }
            image_raw_response = requests.post("https://api.openai.com/v1/images/generations", headers=headers,
                                               json=body,
                                               timeout=5)
            return image_raw_response.json()

        with ThreadPoolExecutor(max_workers=4) as executor:
            text_future = executor.submit(_request_text)
            # image_future = executor.submit(_request_image)
            # res = {"text_response": text_future.result(), "image_response": image_future.result()}
            res = {"text_response": text_future.result()}
            return res

    def launch_screen(self, handler_input):
        # Only add APL directive if User's device supports APL
        apl = VisualizeResponseTextAPL()
        if supports_apl(handler_input):
            apl.set_title_text(self.search_query)
            apl.set_primary_text(self.gpt_response)
            apl.set_random_background_image()

            # Build APL card
            handler_input.response_builder.add_directive(
                RenderDocumentDirective(
                    token=apl.get_document_token(),
                    document={
                        "type": "Link",
                        "src": f"doc://alexa/apl/documents/{apl.get_document_id()}"
                    },
                    datasources=apl.get_data_source()
                )
            )
