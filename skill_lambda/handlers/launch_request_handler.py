import logging
import traceback

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_core.utils import is_request_type, get_supported_interfaces
from ask_sdk_model import Intent, Slot
from ask_sdk_model.dialog import ElicitSlotDirective
from ask_sdk_model.interfaces.alexa.presentation.apl import RenderDocumentDirective

from constants import prompts
from constants.apl_constants import HomeScreenAPL
from constants.intent_constants import QUESTION_INTENT_NAME, QUESTION_INTENT_QUESTION_SLOT_NAME, RequestType
from utils.intent_dispatch_utils import supports_apl

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


# Built-in Intent Handlers
class LaunchRequestHandler(AbstractRequestHandler):
    """Handler for Skill Launch and LaunchRequest Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_request_type(RequestType.LAUNCH_REQUEST.value)(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("LaunchRequestHandler Handling Request")
        # Initialize session attributes
        handler_input.attributes_manager.session_attributes["interaction_count"] = 0
        handler_input.attributes_manager.session_attributes["chat_context"] = []

        # get localization data
        data = handler_input.attributes_manager.request_attributes["_"]

        speech = data[prompts.LAUNCH_MESSAGE]
        try:
            self.launch_screen(handler_input)
        except Exception as exception:
            logger.error("Failed to render LaunchRequest APL card")
            traceback.print_tb(exception.__traceback__)

        handler_input.response_builder.speak(speech)

        return handler_input.response_builder\
            .set_should_end_session(should_end_session=False) \
            .add_directive(ElicitSlotDirective(
                updated_intent=Intent(
                    name=QUESTION_INTENT_NAME,
                    slots={
                        "question": Slot(
                            name=QUESTION_INTENT_QUESTION_SLOT_NAME,
                            value=("{" + QUESTION_INTENT_QUESTION_SLOT_NAME + "}")
                        )}
                ),
                slot_to_elicit=QUESTION_INTENT_QUESTION_SLOT_NAME))\
            .response


    def launch_screen(self, handler_input):
        # Only add APL directive if User's device supports APL
        apl = HomeScreenAPL()
        if supports_apl(handler_input):
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

