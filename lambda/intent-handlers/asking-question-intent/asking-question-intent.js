import Alexa from "ask-sdk";
import AWS from "aws-sdk";
import { getAPIDirective} from "./multi-modal-render.js";
import { isUserEntitled } from "../../utilities/util.js";
import { chatCompletion, generateImage } from "../../services/openai-service.js";
import { addCount } from "../../services/cloudwatch.js";
import { ASKING_QUESTION_INTENT, METRICS_ERROR } from "../../constants/cloudwatch-constants.js";
import { callDirectiveService } from "../../services/alexa-directive-service.js";

const MAX_CHAT_CONTEXT = 6;
const ASKING_QUESTION_INTENT_SLOT_KEY = "question";

function refactorChatResponse(chatResponseText) {
    try {
        console.log("Before transform: " + chatResponseText);
        // https://docs.aws.amazon.com/polly/latest/dg/escapees.html
        chatResponseText = chatResponseText.replaceAll("&" , "&amp;"); // Replace "&" first to avoid conflict with the escapes like "&quot;"
        chatResponseText = chatResponseText.replaceAll('"' , "&quot;");
        chatResponseText = chatResponseText.replaceAll("'" , "&apos;");
        chatResponseText = chatResponseText.replaceAll('<', "&lt;");
        chatResponseText = chatResponseText.replaceAll('>', "&gt;");
        console.log("After transform: " + chatResponseText);
        return chatResponseText;
    } catch (err) {
        console.error("Cannot convert response text to SSML: " + err);
        return chatResponseText;
    }
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

        let INTENT_ERROR_MESSAGE = "QUESTION_INTENT_ERROR_MESSAGE";

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
            callDirectiveService(handlerInput)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Status code ${response.status}, Error Message: ${response.statusText}`);
                    }
                    console.log(`Successfully call progressive response API with status code ${response.status}`);
                }).catch((error)=>{
                    addCount(ASKING_QUESTION_INTENT, "Progressive Directive Error");
                    console.error("Failed to call progressive response API: " + error);
                });
        } catch(err) {
            console.error("Failed to call progressive response API: " + err);
        }

        let secretsManager = new AWS.SecretsManager({region: 'us-west-2'});
        const rawApiKey = await secretsManager.getSecretValue({SecretId: "alexa-skill-chatgpt/apikey"}).promise();
        const apiKeyJson = JSON.parse(rawApiKey.SecretString);
        const apiKeyIndex = Math.floor(Math.random() * Object.keys(apiKeyJson).length);
        const apiKey = apiKeyJson[apiKeyIndex];

        try {
            // Chat API Request
            let chatResponseText = "";
            let chatResponseTemplate = "QUESTION_RESPONSE";
            console.log("question is: " + question);
            const chatResponsePromise = chatCompletion(sessionAttributes.chatHistory, apiKey);

            // API Call for multi-model device
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                const imageResponsePromise = generateImage(question, apiKey);

                await Promise.all([imageResponsePromise, chatResponsePromise])
                    .then((responses)=>{
                        const errors = responses.filter((response) => !response.ok);
                        if (errors.length > 0) {
                            throw errors.map((response) => Error(`Status code: ${response.status}. Error Message: ${response.statusText}`));
                        }
                        const json = responses.map((response) => {
                            return response.json();
                        });
                        return Promise.all(json);
                    }).then((data) => {
                        console.log("Processing API Responses");
                        const imageURLData = data[0];
                        // Get Chat response text
                        const chatResponseData = data[1];
                        const rawChatResponseText = chatResponseData.choices[0].message.content;
                        chatResponseText = refactorChatResponse(rawChatResponseText);
                        if (chatResponseData.choices[0].finish_reason === "length") {
                            chatResponseTemplate = "QUESTION_UNFINISHED_RESPONSE";
                        }
                        // Append Chat response to context
                        sessionAttributes.chatHistory.push({"role": "assistant", "content": rawChatResponseText});
                        console.log("Chat Response: " + chatResponseText);
                        console.log("Chat Response Size: " + chatResponseText.length);

                        // Get Image URL from response
                        let imageURL = null;
                        if ((imageURLData != null) && (imageURLData.data != null) && (imageURLData.data.length > 0)) {
                            imageURL = imageURLData.data[0].url
                            console.log("Image Response Size: " + imageURL.length);
                        }
                        console.log("Image Response: " + imageURL);
                        // Create APL Directive
                        const aplDirective = getAPIDirective(handlerInput, question, rawChatResponseText, imageURL);
                        if (aplDirective != null) {
                            handlerInput.responseBuilder.addDirective(aplDirective)
                        }
                    }).catch((errors) => {
                        INTENT_ERROR_MESSAGE = "QUESTION_INTENT_OPENAI_ERROR_MESSAGE";
                        throw new Error("Failed to call Open AI Service API: " + errors);
                    });
                return handlerInput.responseBuilder
                    .speak(requestAttributes.t(chatResponseTemplate, chatResponseText))
                    .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                    .getResponse();
            }
            
            // API Call for Headless device
            await chatResponsePromise.then((response)=>{
                if (!response.ok) {
                    throw new Error(`Status code: ${response.status}. Error Message: ${response.statusText}`);
                }
                return response.json();
            }).then((data)=> {
                console.log(data);
                const rawChatResponseText = data.choices[0].message.content;
                chatResponseText = refactorChatResponse(rawChatResponseText);
                sessionAttributes.chatHistory.push({"role": "assistant", "content": rawChatResponseText});
                console.log("Chat Response: " + chatResponseText);
                if (data.choices[0].finish_reason === "length") {
                    chatResponseTemplate = "QUESTION_UNFINISHED_RESPONSE";
                }
                addCount(ASKING_QUESTION_INTENT, "Headless");
            }).catch((error)=>{
                INTENT_ERROR_MESSAGE = "QUESTION_INTENT_OPENAI_ERROR_MESSAGE";
                throw new Error("Failed to call Open AI Service API: " + error);
            });
            return handlerInput.responseBuilder
                .speak(requestAttributes.t(chatResponseTemplate, chatResponseText))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
            
        } catch (error) {
            console.error("Failed to full-fill AskingQuestionIntent: ");
            console.error(error);
            addCount(ASKING_QUESTION_INTENT, METRICS_ERROR);
            return handlerInput.responseBuilder
                .speak(requestAttributes.t(INTENT_ERROR_MESSAGE))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }
    }
}