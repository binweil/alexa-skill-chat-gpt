import logging
from typing import Union
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model.services.monetization import EntitledState

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def in_skill_product_response(handler_input):
    """Get the In-skill product response from monetization service."""
    # type: (HandlerInput) -> Union[InSkillProductsResponse, Error]
    locale = handler_input.request_envelope.request.locale
    ms = handler_input.service_client_factory.get_monetization_service()
    return ms.get_in_skill_products(locale)


def is_product(product):
    """Is the product list not empty."""
    # type: (List) -> bool
    return bool(product)


def is_entitled(handler_input):
    """Is the product in ENTITLED state."""
    # type: (HandlerInput) -> bool
    in_skill_response = in_skill_product_response(handler_input)
    logger.info("in_skill_response")
    logger.info(in_skill_response)
    if in_skill_response:
        subscription = [
            l for l in in_skill_response.in_skill_products
            if "subscription" in l.reference_name]
        return (is_product(subscription) and
                subscription[0].entitled == EntitledState.ENTITLED)
    return False
