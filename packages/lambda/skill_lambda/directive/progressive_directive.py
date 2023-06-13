import logging
import random
import time

from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model.services.directive import (SendDirectiveRequest, Header, SpeakDirective)

from constants.prompts import SPEECHCONS_ACK

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


def call_directive_service(handler_input, prompt=None):
    # type: (HandlerInput) -> None
    try:
        directive_service_client = handler_input.service_client_factory.get_directive_service()

        request_id = handler_input.request_envelope.request.request_id

        if prompt is None:
            prompt = random.choice(SPEECHCONS_ACK)

        directive_header = Header(request_id=request_id)
        speech = SpeakDirective(prompt)

        directive_request = SendDirectiveRequest(header=directive_header, directive=speech)
        directive_service_client.enqueue(send_directive_request=directive_request)
        #time.sleep(1)

    except Exception as exception:
        logger.exception("Cannot call directive service")

