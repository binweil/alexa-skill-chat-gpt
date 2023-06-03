# -*- coding: utf-8 -*-
"""Voice GPT Alexa skill"""

import json
import logging

from ask_sdk_core.dispatch_components import (
    AbstractRequestHandler, AbstractExceptionHandler,
    AbstractRequestInterceptor, AbstractResponseInterceptor)
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk.standard import StandardSkillBuilder
from ask_sdk_core.utils import is_intent_name
from ask_sdk_model import Response, Slot, Intent
from ask_sdk_model.dialog import ElicitSlotDirective

from constants import prompts
from constants.intent_constants import QUESTION_INTENT_QUESTION_SLOT_NAME, QUESTION_INTENT_NAME
from handlers.apl_event_handler import APLUserEventHandler
from handlers.buy_subs_intent_handler import BuyResponseHandler, BuySubsIntentHandler
from handlers.cancel_subs_handler import CancelSubsIntentHandler, CancelResponseHandler
from handlers.clear_context_intent_handler import ClearContextIntentHandler
from handlers.help_intent_handler import HelpIntentHandler
from handlers.launch_request_handler import LaunchRequestHandler
from handlers.more_intent_handler import MoreIntentHandler
from handlers.question_intent_handler import QuestionIntentHandler
from handlers.search_image_intent_handler import SearchImageIntentHandler
from handlers.session_ended_request_handler import SessionEndedRequestHandler

sb = StandardSkillBuilder()
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class CancelOrStopIntentHandler(AbstractRequestHandler):
    """Single handler for Cancel and Stop Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return (is_intent_name("AMAZON.CancelIntent")(handler_input) or
                is_intent_name("AMAZON.StopIntent")(handler_input))

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("In CancelstopOrStopIntentHandler")

        # get localization data
        data = handler_input.attributes_manager.request_attributes["_"]

        speech = data[prompts.STOP_MESSAGE]
        handler_input.response_builder.speak(speech)
        return handler_input.response_builder.set_should_end_session(should_end_session=True).response


class FallbackIntentHandler(AbstractRequestHandler):
    """Handler for Fallback Intent.

    AMAZON.FallbackIntent is only available in en-US locale.
    This handler will not be triggered except in that locale,
    so it is safe to deploy on any locale.
    """

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("AMAZON.FallbackIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("In FallbackIntentHandler")

        # get localization data
        data = handler_input.attributes_manager.request_attributes["_"]

        speech = data[prompts.FALLBACK_MESSAGE]
        reprompt = data[prompts.FALLBACK_REPROMPT]
        handler_input.response_builder.speak(speech).ask(
            reprompt)
        return handler_input.response_builder.add_directive(ElicitSlotDirective(
                        updated_intent=Intent(
                            name=QUESTION_INTENT_NAME,
                            slots={
                                "question": Slot(
                                    name=QUESTION_INTENT_QUESTION_SLOT_NAME,
                                    value=("{" + QUESTION_INTENT_QUESTION_SLOT_NAME + "}")
                                )}
                        ),
                        slot_to_elicit=QUESTION_INTENT_QUESTION_SLOT_NAME))\
            .set_should_end_session(should_end_session=False)\
            .response


class LocalizationInterceptor(AbstractRequestInterceptor):
    """
    Add function to request attributes, that can load locale specific data.
    """

    def process(self, handler_input):
        locale = handler_input.request_envelope.request.locale
        logger.info("Locale is {}".format(locale))

        # localized strings stored in language_strings.json
        with open("language_strings.json") as language_prompts:
            language_data = json.load(language_prompts)
        # set default translation data to broader translation
        if locale[:2] in language_data:
            data = language_data[locale[:2]]
            # if a more specialized translation exists, then select it instead
            # example: "fr-CA" will pick "fr" translations first, but if "fr-CA" translation exists,
            # then pick that instead
            if locale in language_data:
                data.update(language_data[locale])
        else:
            data = language_data[locale]
        handler_input.attributes_manager.request_attributes["_"] = data


# Exception Handler
class CatchAllExceptionHandler(AbstractExceptionHandler):
    """Catch all exception handler, log exception and
    respond with custom message.
    """

    def can_handle(self, handler_input, exception):
        # type: (HandlerInput, Exception) -> bool
        return True

    def handle(self, handler_input, exception):
        # type: (HandlerInput, Exception) -> Response
        logger.info("In CatchAllExceptionHandler")
        logger.error(exception, exc_info=True)
        data = handler_input.attributes_manager.request_attributes["_"]
        speech = data[prompts.ERROR_MESSAGE]
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


# Request and Response loggers
class RequestLogger(AbstractRequestInterceptor):
    """Log the alexa requests."""

    def process(self, handler_input):
        # type: (HandlerInput) -> None
        logger.debug("Alexa Request: {}".format(
            handler_input.request_envelope.request))


class ResponseLogger(AbstractResponseInterceptor):
    """Log the alexa responses."""

    def process(self, handler_input, response):
        # type: (HandlerInput, Response) -> None
        logger.debug("Alexa Response: {}".format(response))


# Register intent handlers
sb.add_request_handler(LaunchRequestHandler())
sb.add_request_handler(QuestionIntentHandler())
sb.add_request_handler(SearchImageIntentHandler())
sb.add_request_handler(MoreIntentHandler())
sb.add_request_handler(ClearContextIntentHandler())
sb.add_request_handler(HelpIntentHandler())
sb.add_request_handler(CancelOrStopIntentHandler())
sb.add_request_handler(BuySubsIntentHandler())
sb.add_request_handler(BuyResponseHandler())
sb.add_request_handler(CancelSubsIntentHandler())
sb.add_request_handler(CancelResponseHandler())
sb.add_request_handler(FallbackIntentHandler())
# Register APL event handlers
sb.add_request_handler(APLUserEventHandler())
# Register exception handlers
sb.add_exception_handler(CatchAllExceptionHandler())
sb.add_request_handler(SessionEndedRequestHandler())
# Register request and response interceptors
sb.add_global_request_interceptor(LocalizationInterceptor())
sb.add_global_request_interceptor(RequestLogger())
sb.add_global_response_interceptor(ResponseLogger())

# Handler name that is used on AWS skill_lambda
lambda_handler = sb.lambda_handler()
