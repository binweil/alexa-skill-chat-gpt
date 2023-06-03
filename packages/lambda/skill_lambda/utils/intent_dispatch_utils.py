import logging

from ask_sdk_core.utils import get_supported_interfaces
from ask_sdk_core.handler_input import HandlerInput

from constants.intent_constants import QUESTION_INTENT_QUESTION_SLOT_NAME


logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def is_buy_subs_request(handler_input):
    # type: (HandlerInput) -> bool
    if not hasattr(handler_input.request_envelope.request, "intent"):
        return False
    if not hasattr(handler_input.request_envelope.request.intent, "slots"):
        return False
    buy_sub_keywords = ["buy subs", "buy subscription",
                        "buy monthly subscription", "buy yearly subscription",
                        "buy monthly subs", "buy monthly subs"]
    slots = handler_input.request_envelope.request.intent.slots
    search_query = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value
    return search_query.lower() in buy_sub_keywords


def is_cancel_subs_request(handler_input):
    # type: (HandlerInput) -> bool
    if not hasattr(handler_input.request_envelope.request, "intent"):
        return False
    if not hasattr(handler_input.request_envelope.request.intent, "slots"):
        return False
    buy_sub_keywords = ["cancel subs", "cancel subscription",
                        "cancel monthly subscription", "cancel yearly subscription",
                        "cancel monthly subs", "cancel monthly subs"]
    slots = handler_input.request_envelope.request.intent.slots
    search_query = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value
    return search_query.lower() in buy_sub_keywords


def is_clear_context_request(handler_input):
    # type: (HandlerInput) -> bool
    if not hasattr(handler_input.request_envelope.request, "intent"):
        return False
    if not hasattr(handler_input.request_envelope.request.intent, "slots"):
        return False
    stop_keywords = ["restart", "restart conversation", "reset context",
                     "reset", "clear", "clear context"]
    slots = handler_input.request_envelope.request.intent.slots
    search_query = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value
    return search_query.lower() in stop_keywords


def is_stop_session_request(handler_input):
    # type: (HandlerInput) -> bool
    if not hasattr(handler_input.request_envelope.request, "intent"):
        return False
    if not hasattr(handler_input.request_envelope.request.intent, "slots"):
        return False
    stop_keywords = ["cancel", "stop", "pause", "quit", "shut up", "shut down", "nothing", "nothing else", "no"]
    slots = handler_input.request_envelope.request.intent.slots
    search_query = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value
    return search_query.lower() in stop_keywords


def is_search_image_request(handler_input):
    # type: (HandlerInput) -> bool
    logger.info("Checking is_search_image_request")

    if not hasattr(handler_input.request_envelope.request, "intent"):
        return False
    if not hasattr(handler_input.request_envelope.request.intent, "slots"):
        return False
    search_image_keywords = ["search image for", "search image of"]
    slots = handler_input.request_envelope.request.intent.slots
    search_query = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value
    logger.info("search_query is: " + search_query.lower())
    for keyword in search_image_keywords:
        if keyword in search_query.lower():
            return True
    return False


def is_help_request(handler_input):
    # type: (HandlerInput) -> bool
    if not hasattr(handler_input.request_envelope.request, "intent"):
        return False
    if not hasattr(handler_input.request_envelope.request.intent, "slots"):
        return False
    help_keywords = ["help"]
    slots = handler_input.request_envelope.request.intent.slots
    search_query = slots[QUESTION_INTENT_QUESTION_SLOT_NAME].value
    return search_query.lower() in help_keywords

def supports_apl(handler_input):
    # type: (HandlerInput) -> bool
    # Checks whether APL is supported by the User's device
    supported_interfaces = get_supported_interfaces(
        handler_input)
    return supported_interfaces.alexa_presentation_apl is not None
