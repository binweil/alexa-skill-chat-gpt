import json
import json_stream
import requests
import time
import logging
import openai

from concurrent.futures import ThreadPoolExecutor
from typing import List

from ask_sdk_core.handler_input import HandlerInput

from constants.openai_constants import OpenAIRequest
from directive.progressive_directive import call_directive_service
from utils.ssml_utils import replace_special_characters

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class OpenAIGateway:
    def call(self, api_requests: List[OpenAIRequest], handler_input: HandlerInput):
        start_time = time.time()
        max_workers = len(api_requests) + 1
        res = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            for api_request in api_requests:
                future = executor.submit(self._request_task, api_request, handler_input)
                response_key = api_request.get_response_key()
                res[response_key] = future.result()
        logger.info("--- It took %s seconds for calling OpenAI ---" % (time.time() - start_time))
        return res

    def _request_task(self, request, handler_input):
        # type: (OpenAIRequest, HandlerInput) -> dict
        logger.info("model_setting: " + request.get_body().get("model"))
        raw_response = openai.ChatCompletion.create(
            api_key=request.get_api_key(),
            model=request.get_body().get("model"),
            messages=request.get_body().get("messages"),
            max_tokens=request.get_body().get("max_tokens"),
            timeout=request.get_timeout(),
            stream=True
        )
        full_message = ""
        collected_chunks = []
        collected_messages = ""
        directive_count = 0
        for chunk in raw_response:
            collected_chunks.append(chunk)  # save the event response
            chunk_message = chunk['choices'][0]['delta']  # extract the message
            collected_messages += chunk_message.get('content', '')
            full_message += chunk_message.get('content', '')

            # Maximum 5 progressive prompt is allowed for each request
            if directive_count < 5:
                sentences = collected_messages.rsplit('. ', 1)
                if len(sentences) == 2:
                    # Call directive service
                    logger.info("Sending progressive prompt: " + sentences[0])
                    call_directive_service(handler_input, replace_special_characters(sentences[0]))
                    directive_count += 1
                    collected_messages = sentences[1]
                    collected_chunks = []

        if len(collected_messages) == 0:
            collected_messages += "What else do you want to chat about?"

        prompt = replace_special_characters(collected_messages)
        finish_reason = collected_chunks[-1]['choices'][0].get("finish_reason", "stop")
        logger.info(collected_chunks[-1])

        return {
            "prompt": prompt,
            "full_message": full_message,
            "finish_reason": finish_reason
        }

