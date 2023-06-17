from enum import Enum

GPT_MODEL_MAX_TOKEN = 500
RESULT_KEY_TEXT_RESPONSE = "text_response"
RESULT_KEY_IMAGE_RESPONSE = "image_response"

class OpenAIConfig(Enum):
    # Model documentation: https://platform.openai.com/docs/models/overview
    GPT_MODEL_3_5 = "gpt-3.5-turbo"  # max 4,096 tokens
    GPT_MODEL_4 = "gpt-4"   # max 8,192 tokens
    GPT_MODEL_4_32K = "gpt-4-32k"  # max 32,768 tokens
    CHAT_ENDPOINT = "https://api.openai.com/v1/chat/completions"
    IMAGE_ENDPOINT = "https://api.openai.com/v1/images/generations"


class OpenAIRequest:
    def __init__(self, api_key):
        pass

    def get_headers(self) -> dict:
        pass

    def get_body(self) -> dict:
        pass

    def get_endpoint(self) -> str:
        pass

    def get_timeout(self) -> int:
        pass

    def get_response_key(self) -> str:
        pass

    def get_api_key(self):
        pass


class OpenAIChatRequest(OpenAIRequest):
    def __init__(self, api_key, context, max_token=GPT_MODEL_MAX_TOKEN, model=OpenAIConfig.GPT_MODEL_3_5.value):
        super().__init__(api_key)
        self.api_key = api_key
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + api_key
        }
        self.body = {
            "model": model,
            "messages": context,
            "max_tokens": max_token,
            "stream": True
        }

    def get_api_key(self):
        return self.api_key

    def get_headers(self):
        return self.headers

    def get_body(self):
        return self.body

    def get_endpoint(self):
        return OpenAIConfig.CHAT_ENDPOINT.value

    def get_response_key(self):
        return RESULT_KEY_TEXT_RESPONSE


class OpenAIImageRequest(OpenAIRequest):
    def __init__(self, api_key, prompt, size="512x512", n=1):
        super().__init__(api_key)
        self.api_key = api_key
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + api_key
        }
        self.body = {
            "prompt": prompt,
            "size": size,
            "n": n,
        }

    def get_headers(self):
        return self.headers

    def get_body(self):
        return self.body

    def get_endpoint(self):
        return OpenAIConfig.IMAGE_ENDPOINT.value

    def get_response_key(self):
        return RESULT_KEY_IMAGE_RESPONSE

    def get_api_key(self):
        return self.api_key

