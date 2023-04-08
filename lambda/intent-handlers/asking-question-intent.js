import Alexa from "ask-sdk";
import AWS from "aws-sdk";
import {getAPIDirective} from "./multi-modal-render.js";
import {isUserEntitled} from "../utilities/util.js";
import { chatCompletion, generateImage } from "../services/openai-service.js";

function isProduct(product) {
    return product != null;
}

function isEntitled(product) {
    return isProduct(product) &&
        product[0].entitled === 'ENTITLED';
}

export const AskingQuestionIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskingQuestionIntent';
    },
    async handle(handlerInput, aplQuestion) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        let question = aplQuestion;
        if (aplQuestion == null || question.length === 0) {
            question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'question');
        }
        if (!sessionAttributes.chatHistory) {
            sessionAttributes.chatHistory = [];
        }
        sessionAttributes.chatHistory.push({"role": "user", "content": question});
        if (sessionAttributes.chatHistory.length > 6) {
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
                console.log(chatResponseData);
                chatResponseText = chatResponseData.choices[0].message.content;
                console.log("Chat Response: " + chatResponseText);
    
                const imageURLData = await imageResponse.json();
                const imageURL = imageURLData.data[0].url
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

            return handlerInput.responseBuilder
                .speak(requestAttributes.t('QUESTION_RESPONSE', chatResponseText))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
            
        } catch (error) {
            console.log(error)
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('OPENAI_ERROR_MESSAGE'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }
    }
}