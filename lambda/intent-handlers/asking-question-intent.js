import Alexa from "ask-sdk";
import AWS from "aws-sdk";
import {ChatGPTAPI, openai} from "chatgpt";
import {getAPIDirective} from "./multi-modal-render.js";

function isProduct(product) {
    return product != null;
}

function isEntitled(product) {
    console.log("Product entitilement: " + product[0].entitled);
    return isProduct(product) &&
        product[0].entitled === 'ENTITLED';
}

export const AskingQuestionIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskingQuestionIntent';
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'user_input');
        sessionAttributes.interaction += 1;

        //Check subscription status
        const locale = handlerInput.requestEnvelope.request.locale;
        const ms = handlerInput.serviceClientFactory.getMonetizationServiceClient();
        const result = await ms.getInSkillProducts(locale);
        
        let entitled = false;
        for (let inSkillProduct of result.inSkillProducts) {
            console.log(inSkillProduct);
            if ((inSkillProduct.referenceName === 'yearly_subscription') || 
                (inSkillProduct.referenceName === 'monthly_subscription')) {
                if (isProduct(inSkillProduct) && (inSkillProduct.entitled === "ENTITLED")) {
                    console.log("User has active subscription: " + inSkillProduct.referenceName);
                    entitled = true;
                }
            }
        }
            
        if (sessionAttributes.interaction > 3 && !entitled) {
            return handlerInput.responseBuilder
                .speak(requestAttributes.t('SUBSCRIPTION_UPSELL'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }

        let secretsManager = new AWS.SecretsManager({region: 'us-west-2'});
        const rawApiKey = await secretsManager.getSecretValue({SecretId: "chatgpt/apikey"}).promise();
        const apiKey = rawApiKey.SecretString;
        const api = new ChatGPTAPI({
            apiKey: apiKey
        });
        try {
            const customHeaders = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            }

            // Chat API Request
            const chatRequest = {
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": question}],
                "max_tokens": 100
            }
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
            console.log("Chat Response: " + chatResponseText);

            const imageURLData = await imageResponse.json();
            const imageURL = imageURLData.data[0].url
            console.log("Image Response: " + imageURL);

            const aplDirective = getAPIDirective(handlerInput, question, chatResponseText, imageURL);
            if (aplDirective != null) {
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
                .speak(requestAttributes.t('TIMEOUT_ERROR_MESSAGE'))
                .reprompt(requestAttributes.t('CONTINUE_MESSAGE'))
                .getResponse();
        }
    }
}