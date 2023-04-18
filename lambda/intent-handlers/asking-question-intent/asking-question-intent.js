import Alexa from "ask-sdk";
import AWS from "aws-sdk";
import {getAPIDirective} from "./multi-modal-render.js";
import {isUserEntitled} from "../../utilities/util.js";
import { chatCompletion, generateImage } from "../../services/openai-service.js";
import { addCount } from "../../services/cloudwatch.js";
import { ASKING_QUESTION_INTENT, METRICS_ERROR } from "../../constants/cloudwatch-constants.js";

const MAX_CHAT_CONTEXT = 6;
const ASKING_QUESTION_INTENT_SLOT_KEY = "question";

function callDirectiveService(handlerInput) {
    const requestEnvelope = handlerInput.requestEnvelope;
    const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();

    const requestId = requestEnvelope.request.requestId;
    const endpoint = requestEnvelope.context.System.apiEndpoint;
    const token = requestEnvelope.context.System.apiAccessToken;

    const progressiveSpeechCandidates = [
        "Hang on! I am brewing an insightful response just for you.",
        "Thinking up a thoughtful response for you",
        "Hold tight!",
        "Wait just a moment! Your answer is being mixed to perfection!",
        "Stay tuned! I will be back in no time!"
    ];

    const directive = {
       header: {
        requestId
       },
       directive: {
        type: "VoicePlayer.Speak",
        speech: progressiveSpeechCandidates[Math.floor(Math.random() * progressiveSpeechCandidates.length)]
       }
    };
    return directiveServiceClient.enqueue(directive, endpoint, token);
}

export const AskingQuestionIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskingQuestionIntent';
    },
    async handle(handlerInput, aplQuestion) {
        addCount(ASKING_QUESTION_INTENT);
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();

        // Fetch Intent Input
        let question = aplQuestion;
        if (aplQuestion == null || question.length === 0) {
            question = Alexa.getSlotValue(handlerInput.requestEnvelope, ASKING_QUESTION_INTENT_SLOT_KEY);
        }

        // Initialize Chat Context
        if (!sessionAttributes.chatHistory) {
            sessionAttributes.chatHistory = [];
        }

        // Maximum 6 Chat Context
        sessionAttributes.chatHistory.push({"role": "user", "content": question});
        if (sessionAttributes.chatHistory.length > MAX_CHAT_CONTEXT) {
            sessionAttributes.chatHistory.shift();
            sessionAttributes.chatHistory.shift();
        }
        sessionAttributes.interaction += 1;

        const entitled = await isUserEntitled(handlerInput);
        if (sessionAttributes.interaction > 3 && !entitled) {
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('SUBSCRIPTION_UPSELL'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }

        // Add Progressive Response
        try {
            await callDirectiveService(handlerInput);
        } catch(err) {
            console.error(err);
        }

        let secretsManager = new AWS.SecretsManager({region: 'us-west-2'});
        const rawApiKey = await secretsManager.getSecretValue({SecretId: "chatgpt/apikey"}).promise();
        const apiKey = rawApiKey.SecretString;
        try {
            // Chat API Request
            let chatResponseText = "";
            console.log("question is: " + question);
            const chatResponsePromise = chatCompletion(question, apiKey);

            // Image API Call
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                const imageResponsePromise = generateImage(question, apiKey);
                const [imageResponse, chatResponse] = await Promise.all([imageResponsePromise, chatResponsePromise]);
                
                const chatResponseData = await chatResponse.json();
                chatResponseText = chatResponseData.choices[0].message.content;
                chatResponseText.replace('&', " and ");
                console.log("Chat Response: " + chatResponseText);
    
                const imageURLData = await imageResponse.json();
                let imageURL = null;
                if ((imageURLData != null) && (imageURLData.data != null) && (imageURLData.data.length > 0)) {
                    imageURL = imageURLData.data[0].url
                }
                console.log("Image Response: " + imageURL);

                const aplDirective = getAPIDirective(handlerInput, question, chatResponseText, imageURL);
                if (aplDirective != null) {
                    handlerInput.responseBuilder.addDirective(aplDirective)
                }
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t('QUESTION_RESPONSE', chatResponseText))
                    .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                    .getResponse();
            }
            
            const [chatResponse] = await Promise.all([chatResponsePromise]);
            const chatResponseData = await chatResponse.json();
            chatResponseText = chatResponseData.choices[0].message.content;
            console.log("Chat Response: " + chatResponseText);

            addCount(ASKING_QUESTION_INTENT, "Headless");
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('QUESTION_RESPONSE', chatResponseText))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
            
        } catch (error) {
            console.error(error);
            addCount(ASKING_QUESTION_INTENT, METRICS_ERROR);
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('OPENAI_ERROR_MESSAGE'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }
    }
}