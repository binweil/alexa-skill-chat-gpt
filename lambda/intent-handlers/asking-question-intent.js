import Alexa from "ask-sdk";
import AWS from "aws-sdk";
import {getAPIDirective} from "./multi-modal-render.js";
import {isUserEntitled} from "../utilities/util.js";

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
            const customHeaders = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }

            // Chat API Request
            const chatRequest = {
                "model": "gpt-3.5-turbo",
                "messages": sessionAttributes.chatHistory,
                "max_tokens": 200
            }
            console.log("Calling ChatGPT API with Request: " + JSON.stringify(chatRequest));
            const chatResponsePromise = fetch("https://api.openai.com/v1/chat/completions", {
                method: 'POST',
                headers: customHeaders,
                body: JSON.stringify(chatRequest),
            })
            // Image API Request
            const imageRequest = {
                "prompt": question,
                "n": 1,
                "size": "256x256"
            }
            const imageResponsePromise = fetch("https://api.openai.com/v1/images/generations", {
                method: 'POST',
                headers: customHeaders,
                body: JSON.stringify(imageRequest),
            });
            
            const [imageResponse, chatResponse] = 
                await Promise.all([imageResponsePromise, chatResponsePromise]);

            const chatResponseData = await chatResponse.json();
            const chatResponseText = chatResponseData.choices[0].message.content;
            sessionAttributes.chatHistory.push({"role": "system", "content": chatResponseText});
            console.log("Chat Response: " + JSON.stringify(chatResponseData));

            const imageURLData = await imageResponse.json();
            let imageURL = null;
            if (imageURLData.data && imageURLData.data.length > 0) {
                imageURL = imageURLData.data[0].url;
            }
            console.log("Image Response: " + imageURL);

            const aplDirective = getAPIDirective(handlerInput, question, chatResponseText, imageURL);
            if (aplDirective) {
                return handlerInput.responseBuilder
                    .addDirective(aplDirective)
                    .speak(requestAttributes.t('QUESTION_RESPONSE', chatResponseText))
                    .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                    .getResponse();
            }
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