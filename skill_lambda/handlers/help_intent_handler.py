import logging

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_intent_name, get_supported_interfaces
from ask_sdk_model import Slot, Intent
from ask_sdk_model.dialog import ElicitSlotDirective
from ask_sdk_model.interfaces.alexa.presentation.apl import RenderDocumentDirective

from constants import prompts
from constants.apl_constants import HelpListScreenAPL
from constants.intent_constants import QUESTION_INTENT_QUESTION_SLOT_NAME, QUESTION_INTENT_NAME
from utils.intent_dispatch_utils import supports_apl

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class HelpIntentHandler(AbstractRequestHandler):
    """Handler for Help Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name("AMAZON.HelpIntent")(handler_input)

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("HelpIntentHandler Handling Request")

        # get localization data
        data = handler_input.attributes_manager.request_attributes["_"]

        speech = data[prompts.HELP_MESSAGE]
        reprompt = data[prompts.HELP_REPROMPT]

        # Render APL card
        try:
            self.launch_screen(handler_input)
        except Exception as e:
            logger.error("Failed to render HelpIntent APL card")
            logger.error(e)

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

    def launch_screen(self, handler_input):
        # Only add APL directive if User's device supports APL
        apl = HelpListScreenAPL()
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

