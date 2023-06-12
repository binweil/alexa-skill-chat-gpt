import logging
import traceback

from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.utils import is_intent_name, is_request_type
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model import Intent
from ask_sdk_model.dialog import DelegateRequestDirective
from ask_sdk_model.interfaces.connections import SendRequestDirective
from ask_sdk_model.interfaces.monetization.v1 import PurchaseResult

from constants.in_skill_product_constants import MONTHLY_SUBSCRIPTION_PRODUCT_ID, YEARLY_SUBSCRIPTION_PRODUCT_ID
from constants.intent_constants import BUY_SUBS_INTENT
from constants.prompts import ISP_PURCHASE_ERROR_MESSAGE, ISP_PURCHASE_DECLINED_MESSAGE
from utils.isp_utils import in_skill_product_response

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


# https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-python/call-alexa-service-apis.html#in-skill-purchase-interface
class BuySubsIntentHandler(AbstractRequestHandler):
    """Handler for Buy Subs Intent."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return is_intent_name(BUY_SUBS_INTENT)(handler_input)

    def handle(self, handler_input):
        return self.handle_text_request(handler_input, text="monthly")

    def handle_text_request(self, handler_input, text):
        # type: (HandlerInput, str) -> Response
        product_id = MONTHLY_SUBSCRIPTION_PRODUCT_ID
        if ("yearly" in text) or ("year" in text):
            product_id = YEARLY_SUBSCRIPTION_PRODUCT_ID

        return handler_input.response_builder.add_directive(
            SendRequestDirective(
                name="Buy",
                payload={
                    "InSkillProduct": {
                        "productId": product_id,
                    }
                },
                token=product_id))\
            .response


class BuyResponseHandler(AbstractRequestHandler):
    """This handles the Connections.Response event after a buy occurs."""

    def can_handle(self, handler_input):
        # type: (HandlerInput) -> bool
        return (is_request_type("Connections.Response")(handler_input) and
                handler_input.request_envelope.request.name == "Buy")

    def handle(self, handler_input):
        # type: (HandlerInput) -> Response
        logger.info("In BuyResponseHandler")
        # Localization helper
        data = handler_input.attributes_manager.request_attributes["_"]
        product_name = "Chat GPT Subscription"
        try:
            # Parse handler input
            in_skill_response = in_skill_product_response(handler_input)
            product_id = handler_input.request_envelope.request.payload.get(
                "productId")

            if in_skill_response:
                product = [l for l in in_skill_response.in_skill_products
                           if l.product_id == product_id]
                logger.info("Product = {}".format(str(product)))
                if len(product) > 0:
                    product_name = product[0].name

                if handler_input.request_envelope.request.status.code == "200":
                    purchase_result = handler_input.request_envelope.request.payload.get(
                        "purchaseResult")
                    if purchase_result == PurchaseResult.ACCEPTED.value:
                        speech = "You have successfully purchased the {}. Please restart the skill."\
                            .format(product_name)
                    elif purchase_result == PurchaseResult.ALREADY_PURCHASED.value:
                        logger.info("Already purchased {}".format(product_name))
                        speech = "You have already purchased {}. Please restart the skill."\
                            .format(product_name)
                    else:
                        speech = data[ISP_PURCHASE_DECLINED_MESSAGE].format(product_name)
                return handler_input.response_builder.speak(speech).set_should_end_session(True).response

            else:
                logger.error("Connections.Response indicated failure. Error: {}"
                             .format(handler_input.request_envelope.request.status.message))
                speech = data[ISP_PURCHASE_ERROR_MESSAGE].format(product_name)
                return handler_input.response_builder.speak(speech)\
                    .set_should_end_session(True)\
                    .response
        except Exception as exception:
            logger.exception("Buy Subs API Call failure")
            speech = data[ISP_PURCHASE_ERROR_MESSAGE].format(product_name)
            return handler_input.response_builder.speak(speech) \
                .set_should_end_session(True) \
                .response
