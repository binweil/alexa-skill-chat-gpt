import { SPEECHCONS_ACK } from "../constants/progressive-speech-constants.js";
import { fetchWithTimeout } from "../utilities/util.js";

export function callDirectiveService(handlerInput) {
    const requestEnvelope = handlerInput.requestEnvelope;
    const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();

    const requestId = requestEnvelope.request.requestId;
    const endpoint = requestEnvelope.context.System.apiEndpoint;
    const token = requestEnvelope.context.System.apiAccessToken;

    const randomIndex = Math.floor(Math.random() * SPEECHCONS_ACK.length);
    const progressiveSpeechcon = `<say-as interpret-as="interjection">${SPEECHCONS_ACK[randomIndex]}</say-as>`;

    const customHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    }
    if (!requestId.startsWith("amzn1.echo-api.request.")) {
        requestId = `amzn1.echo-api.request.${requestId}`;
    }
    const directiveRequest = { 
        "header":{ 
          "requestId": requestId
        },
        "directive":{ 
          "type": "VoicePlayer.Speak",
          "speech": progressiveSpeechcon
        }
    }
    return fetch(`${endpoint}/v1/directives`, {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify(directiveRequest)
    });
}