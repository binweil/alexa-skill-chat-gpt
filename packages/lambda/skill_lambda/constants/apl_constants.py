import random


class VisualizeResponseTextAPL:
    def __init__(self):
        self.document_id = "VisualizeResponseText"
        self.document_token = "documentToken"
        self.background_image_pool = [
            "https://d2s5tydsfac9v4.cloudfront.net/voice-gpt/background-image-1.png",
            "https://d2s5tydsfac9v4.cloudfront.net/voice-gpt/background-image-2.png",
            "https://d2s5tydsfac9v4.cloudfront.net/voice-gpt/background-image-3.png"
        ]
        self.data_source = {
            "simpleTextTemplateData": {
                "type": "object",
                "properties": {
                    "backgroundImage": "https://d2s5tydsfac9v4.cloudfront.net/voice-gpt/background-image-1.png",
                    "foregroundImageLocation": "left",
                    "foregroundImageSource": "",
                    "headerTitle": "Voice GPT Response",
                    "headerSubtitle": "",
                    "hintText": "Say \"more\" to load more response, or \"stop\" to go to exit",
                    "headerAttributionImage": "",
                    "primaryText": "",
                    "textAlignment": "start",
                    "titleText": "Search Query"
                }
            }
        }

    def set_random_background_image(self):
        url = random.choice(self.background_image_pool)
        self.data_source["simpleTextTemplateData"]["properties"]["backgroundImage"] = url
        return url

    def set_background_image(self, url):
        self.data_source["simpleTextTemplateData"]["properties"]["backgroundImage"] = url

    def set_foreground_image(self, url):
        self.data_source["simpleTextTemplateData"]["properties"]["foregroundImageSource"] = url

    def set_hint_text(self, hint_text):
        self.data_source["simpleTextTemplateData"]["properties"]["hintText"] = hint_text

    def set_primary_text(self, primary_text):
        self.data_source["simpleTextTemplateData"]["properties"]["primaryText"] = primary_text

    def set_title_text(self, title_text):
        self.data_source["simpleTextTemplateData"]["properties"]["titleText"] = title_text

    def get_data_source(self):
        return self.data_source

    def get_document_id(self):
        return self.document_id

    def get_document_token(self):
        return self.document_token


class HomeScreenAPL:
    def __init__(self):
        self.document_id = "HomeScreen"
        self.document_token = "documentToken"
        self.data_source = {
            "backgroundImage": {
                "imageSource": "https://assets.alexa-chat-gpt.neural-x.com/homepage.png"
            },
            "bottomPrompt": {
                "text": "Try \"Alexa, tell me why sky is blue\" "
            }
        }

    def set_background_image(self, url):
        self.data_source["backgroundImage"]["imageSource"] = url

    def get_background_image(self):
        return self.data_source["backgroundImage"]["imageSource"]

    def get_data_source(self):
        return self.data_source

    def get_document_id(self):
        return self.document_id

    def get_document_token(self):
        return self.document_token


class HelpListScreenAPL:
    def __init__(self):
        self.document_id = "HelpListScreen"
        self.document_token = "documentToken"
        self.data_source = {
            "textListData": {
                "type": "object",
                "objectId": "helpListData",
                "listItems": [
                    {
                        "primaryText": "Chat with AI",
                        "secondaryText": "ex. Why sky is blue"
                    },
                    {
                        "primaryText": "Daily Trivia Question & Answer",
                        "secondaryText": "say: \"Give me one daily trivia question\" "
                    },
                    {
                        "primaryText": "Get Entertained with a Short Story",
                        "secondaryText": "say: \"Tell me a bedtime story\" "
                    },
                    {
                        "primaryText": "Clear Chat Context",
                        "secondaryText": "ex. clear context"
                    }
                    # {
                    #     "primaryText": "Buy Subscription",
                    #     "secondaryText": "ex. buy monthly/yearly subscription"
                    # }
                ]
            }
        }

    def get_data_source(self):
        return self.data_source

    def get_document_token(self):
        return self.document_token

    def get_document_id(self):
        return self.document_id


class SearchImageAPL:
    def __init__(self):
        self.document_id = "SearchImageScreen"
        self.document_token = "documentToken"
        self.data_source = {
            "imageListData": {
                "type": "object",
                "objectId": "imageList",
                "title": "Search Image",
                "listItems": [
                    {
                        "primaryText": "",
                        "secondaryText": "",
                        "imageSource": "https://d2s5tydsfac9v4.cloudfront.net/image-test-1.jpeg"
                    }
                ]
            }
        }

    def set_image_source(self, url):
        self.data_source["imageListData"]["listItems"][0]["imageSource"] = url

    def get_data_source(self):
        return self.data_source

    def get_document_token(self):
        return self.document_token

    def get_document_id(self):
        return self.document_id


class BubbleChatAPL:
    def __init__(self):
        self.document_id = "BubbleChatScreen"
        self.document_token = "documentToken"
        self.data_source = {
            "backgroundImage": {
                "url": "https://assets.alexa-chat-gpt.neural-x.com/voice-gpt/background-image-1.png"
            },
            "chat_context": {
                "type": "object",
                "objectId": "chatListData",
                "listItems": [
                    {
                        "type": "SpeechBubble",
                        "message": "No chat history",
                        "sender": "alexa"
                    }
                ]
            }
        }

    def set_chat_context(self, chat_context):
        self.data_source["chat_context"]["listItems"] = chat_context

    def set_background_image(self, url):
        self.data_source["backgroundImage"]["url"] = url

    def get_data_source(self):
        return self.data_source

    def get_document_token(self):
        return self.document_token

    def get_document_id(self):
        return self.document_id
