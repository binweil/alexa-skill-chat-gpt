import logging
import random
import time
import traceback

from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model.services.directive import (SendDirectiveRequest, Header, SpeakDirective)

from constants.prompts import SPEECHCONS_ACK

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def call_directive_service(handler_input):
    # type: (HandlerInput) -> None
    try:
        directive_service_client = handler_input.service_client_factory.get_directive_service()

        request_id = handler_input.request_envelope.request.request_id

        sentence = random.choice(SPEECHCONS_ACK)
        # sentence = "<say-as interpret-as=\"interjection\">{}</say-as>".format(sentence)

        directive_header = Header(request_id=request_id)
        speech = SpeakDirective("Hold On")

        directive_request = SendDirectiveRequest(header=directive_header, directive=speech)
        response = directive_service_client.enqueue(send_directive_request=directive_request)
        logger.info(response.status_code)
        logger.info(response.message)
        # time.sleep(5)
    except Exception as exception:
        logger.error("Cannot call directive service")
        logger.error(exception.__traceback__)
        traceback.print_tb(exception.__traceback__)
