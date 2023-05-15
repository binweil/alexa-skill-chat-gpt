from enum import Enum


class RequestType(Enum):
    LAUNCH_REQUEST = "LaunchRequest"
    INTENT_REQUEST = "IntentRequest"


QUESTION_INTENT_NAME = "GPT_QuestionIntent"
QUESTION_INTENT_QUESTION_SLOT_NAME = "question"
QUESTION_INTENT_MAX_FREE_INTERACTION_COUNT = 3
BUY_SUBS_INTENT = "GPT_BuySubsIntent"
CANCEL_SUBS_INTENT = "GPT_CancelSubsIntent"
