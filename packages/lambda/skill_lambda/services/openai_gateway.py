import requests
import time
import logging

from concurrent.futures import ThreadPoolExecutor
from typing import List

from constants.openai_constants import OpenAIRequest

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class OpenAIGateway:
    def call(self, api_requests: List[OpenAIRequest]):
        start_time = time.time()
        max_workers = len(api_requests) + 1
        res = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            for api_request in api_requests:
                future = executor.submit(self._request_task, api_request)
                response_key = api_request.get_response_key()
                res[response_key] = future.result()
        logger.info("--- It took %s seconds for calling OpenAI ---" % (time.time() - start_time))
        return res

    def _request_task(self, request):
        # type: (OpenAIRequest) -> dict
        raw_response = requests.post(request.get_endpoint(),
                                     headers=request.get_headers(),
                                     json=request.get_body(),
                                     timeout=request.get_timeout())
        return raw_response.json()

