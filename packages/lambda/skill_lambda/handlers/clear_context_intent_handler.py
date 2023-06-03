import logging

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_intent_name

from constants import prompts

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class ClearContextIntentHandler(AbstractRequestHandler):
    """Handler for Help Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("GPT_ClearContextIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("ClearContextIntent Handling Request")

        handler_input.attributes_manager.session_attributes["chat_context"] = []
        # get localization data
        data = handler_input.attributes_manager.request_attributes["_"]
        speech = data[prompts.CONTEXT_CLEAR_RESPONSE]

        handler_input.response_builder.speak(speech)
        return handler_input.response_builder.set_should_end_session(should_end_session=False).response
