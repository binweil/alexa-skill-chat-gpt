import json
import logging

import boto3
import requests
from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_request_type, is_intent_name
from ask_sdk_model import Intent, Slot
from ask_sdk_model.dialog import ElicitSlotDirective
from ask_sdk_model.interfaces.alexa.presentation.apl import RenderDocumentDirective
from ask_sdk_core.handler_input import HandlerInput
from botocore.exceptions import ClientError

from constants.apl_constants import SearchImageAPL
from constants.intent_constants import RequestType, SEARCH_IMAGE_INTENT, QUESTION_INTENT_QUESTION_SLOT_NAME, \
    QUESTION_INTENT_NAME
from constants.prompts import SEARCH_IMAGE_RESPONSE, SEARCH_IMAGE_INCAPABLE_DEVICE
from utils.intent_dispatch_utils import supports_apl

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class SearchImageIntentHandler(AbstractRequestHandler):
    def __init__(self):
        self.image_url = None
        self.api_key = None

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return (is_request_type(RequestType.INTENT_REQUEST.value)(handler_input) and
                is_intent_name(SEARCH_IMAGE_INTENT)(handler_input))

    def handle_with_text(self, handler_input, utterance):
        # type: (HandlerInput) -> Response
        logger.info("SearchImageIntentHandler Handling Request")
        data = handler_input.attributes_manager.request_attributes["_"]

        # Check device capability
        if not supports_apl(handler_input):
            speech = data[SEARCH_IMAGE_INCAPABLE_DEVICE]
            return handler_input.response_builder.speak(speech).response

        self.get_api_key()
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + self.api_key
        }
        body = {
            "prompt": utterance,
            "size": "512x512",
            "n": 1,
        }
        image_raw_response = requests.post("https://api.openai.com/v1/images/generations", headers=headers,
                                           json=body,
                                           timeout=10)
        image_response = image_raw_response.json()
        if image_response["data"] and (len(image_response["data"]) > 0):
            self.image_url = image_response["data"][0]["url"]
        apl = SearchImageAPL()
        apl.set_image_source(self.image_url)

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
        speech = data[SEARCH_IMAGE_RESPONSE]
        return handler_input.response_builder.speak(speech).response

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("SearchImageIntentHandler Handling Request")
        data = handler_input.attributes_manager.request_attributes["_"]

        # Check device capability
        if not supports_apl(handler_input):
            speech = data[SEARCH_IMAGE_INCAPABLE_DEVICE]
            return handler_input.response_builder.speak(speech)\
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
                .set_should_end_session(should_end_session=False)\
                .response

        self.get_api_key()
        slots = handler_input.request_envelope.request.intent.slots
        utterance_text = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + self.api_key
        }
        body = {
            "prompt": utterance_text,
            "size": "512x512",
            "n": 1,
        }
        image_raw_response = requests.post("https://api.openai.com/v1/images/generations", headers=headers,
                                           json=body,
                                           timeout=10)
        image_response = image_raw_response.json()
        if image_response["data"] and (len(image_response["data"]) > 0):
            self.image_url = image_response["data"][0]["url"]
        apl = SearchImageAPL()
        apl.set_image_source(self.image_url)

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
        speech = data[SEARCH_IMAGE_RESPONSE]
        return handler_input.response_builder.speak(speech)\
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
            .set_should_end_session(should_end_session=False)\
            .response

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
            logger.exception("Failed to fetch OpenAI API key")
            raise exception

        secret_string = get_secret_value_response['SecretString']
        secret = json.loads(secret_string)
        self.api_key = secret['0']

        return secret['0']

