import logging
import traceback

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_intent_name, is_request_type
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model.interfaces.connections import SendRequestDirective
from ask_sdk_model.interfaces.monetization.v1 import PurchaseResult

from constants.in_skill_product_constants import MONTHLY_SUBSCRIPTION_PRODUCT_ID, YEARLY_SUBSCRIPTION_PRODUCT_ID
from constants.intent_constants import CANCEL_SUBS_INTENT
from constants.prompts import ISP_CANCEL_ERROR_MESSAGE, ISP_CANCEL_DECLINED_MESSAGE
from utils.isp_utils import in_skill_product_response

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-python/call-alexa-service-apis.html#in-skill-purchase-interface
class CancelSubsIntentHandler(AbstractRequestHandler):
    """Handler for Cancel Subs Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name(CANCEL_SUBS_INTENT)(handler_input)

    def handle(self, handler_input):
        return self.handle_text_request(handler_input, text="monthly")

    def handle_text_request(self, handler_input, text):
        # type: (HandlerInput, str) -> Response
        product_id = MONTHLY_SUBSCRIPTION_PRODUCT_ID
        if ("yearly" in text) or ("year" in text):
            product_id = YEARLY_SUBSCRIPTION_PRODUCT_ID

        return handler_input.response_builder.add_directive(
            SendRequestDirective(
                name="Cancel",
                payload={
                    "InSkillProduct": {
                        "productId": product_id,
                    }
                },
                token="correlationToken")
        ).response

class CancelResponseHandler(AbstractRequestHandler):
    """This handles the Connections.Response event after a cancel occurs."""
    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return (is_request_type("Connections.Response")(handler_input) and
                handler_input.request_envelope.request.name == "Cancel")

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("In CancelResponseHandler")
        # Localization helper
        data = handler_input.attributes_manager.request_attributes["_"]
        in_skill_response = in_skill_product_response(handler_input)
        product_id = handler_input.request_envelope.request.payload.get(
            "productId")
        try:
            if in_skill_response:
                product = [l for l in in_skill_response.in_skill_products
                           if l.product_id == product_id]
                logger.info("Product = {}".format(str(product)))
                if handler_input.request_envelope.request.status.code == "200":
                    purchase_result = handler_input.request_envelope.request.payload.get(
                            "purchaseResult")
                    if purchase_result == PurchaseResult.ACCEPTED.value:
                        speech = "You have successfully cancelled your subscription. Please restart the skill."
                    else:
                        speech = data[ISP_CANCEL_DECLINED_MESSAGE.format(product[0].name)]
                return handler_input.response_builder.speak(speech).set_should_end_session(True).response
            else:
                logger.log("Connections.Response indicated failure. "
                           "Error: {}".format(handler_input.request_envelope.request.status.message))
                speech = data[ISP_CANCEL_ERROR_MESSAGE]
                return handler_input.response_builder.speak(speech).set_should_end_session(True).response
        except Exception as exception:
            logger.exception("Buy Subs API Call failure. Error: {}")
            traceback.print_tb(exception.__traceback__)
            speech = data[ISP_CANCEL_ERROR_MESSAGE].format("Chat GPT Subscription")
            return handler_input.response_builder.speak(speech).set_should_end_session(True).response

