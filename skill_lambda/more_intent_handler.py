import logging
import prompts

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_request_type, is_intent_name
from ask_sdk_core.handler_input import HandlerInput

from question_intent_handler import QuestionIntentHandler

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class MoreIntentHandler(AbstractRequestHandler):
    """Handler for Skill Launch and GetNewFact Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        logger.info("IntentRequest?")
        logger.info(is_request_type("IntentRequest")(handler_input))
        logger.info("GPT_MoreIntent?")
        logger.info(is_intent_name("GPT_MoreIntent")(handler_input))
        logger.info(is_request_type("IntentRequest")(handler_input) and
                    is_intent_name("GPT_MoreIntent")(handler_input))

        return (is_request_type("IntentRequest")(handler_input) and
                is_intent_name("GPT_MoreIntent")(handler_input))

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("MoreIntentHandler Handling Request")

        question_intent_handler = QuestionIntentHandler()
        return question_intent_handler.handle_more_intent(handler_input)
