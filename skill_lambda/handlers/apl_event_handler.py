import logging

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_request_type

from handlers.clear_context_intent_handler import ClearContextIntentHandler
from handlers.help_intent_handler import HelpIntentHandler
from handlers.launch_request_handler import LaunchRequestHandler
from handlers.question_intent_handler import QuestionIntentHandler

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class APLUserEventHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_request_type("Alexa.Presentation.APL.UserEvent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("APLUserEventHandler Handling Request")

        event_type = handler_input.request_envelope.request.arguments[0]
        if event_type == 'REDIRECT_LAUNCH_REQUEST':
            return LaunchRequestHandler().handle(handler_input)
        elif event_type == 'REDIRECT_HELP_INTENT':
            return HelpIntentHandler().handle(handler_input)
        elif event_type == 'REDIRECT_QUESTION_INTENT_FROM_HELP':
            return QuestionIntentHandler().handle_customized_intent(handler_input, "Why sky is blue")
        elif event_type == 'REDIRECT_CLEAR_CONTEXT_INTENT':
            return ClearContextIntentHandler().handle(handler_input)

        return LaunchRequestHandler().handle(handler_input)

