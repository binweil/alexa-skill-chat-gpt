import logging
import prompts

from apl_constants import HomeScreenAPL

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_request_type, get_supported_interfaces
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model.interfaces.alexa.presentation.apl import RenderDocumentDirective

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


# Built-in Intent Handlers
class LaunchRequestHandler(AbstractRequestHandler):
    """Handler for Skill Launch and LaunchRequest Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_request_type("LaunchRequest")(handler_input)

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
            logger.error(exception.with_traceback())
        handler_input.response_builder.speak(speech)
        return handler_input.response_builder.response

    def launch_screen(self, handler_input):
        # Only add APL directive if User's device supports APL
        apl = HomeScreenAPL()
        if self.supports_apl(handler_input):
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

    def supports_apl(self, handler_input):
        # Checks whether APL is supported by the User's device
        supported_interfaces = get_supported_interfaces(
            handler_input)
        return supported_interfaces.alexa_presentation_apl != None

