import Alexa from "ask-sdk";

export const CancelSubIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CancelSubIntent';
    },
    async handle(handlerInput) {

        const billingPeriod = Alexa.getSlotValue(handlerInput.requestEnvelope, 'monthly_or_yearly');
        console.log("User trying to cancel month or year subscription: " + billingPeriod);

        if (billingPeriod != null && 
            billingPeriod.length != 0 && 
            billingPeriod.includes("year")) {
            console.log("Cancelling yearly subscription");
            return handlerInput.responseBuilder
                .addDirective({
                    type: "Connections.SendRequest",
                    name: "Cancel",
                    payload: {
                        InSkillProduct: {
                            productId: "amzn1.adg.product.1552c261-fbce-42eb-900a-779d0923cbeb",
                        }
                    },
                    token: "amzn1.adg.product.1552c261-fbce-42eb-900a-779d0923cbeb"
                })
                .getResponse();
        };

        console.log("Cancelling monthly subscription");
        return handlerInput.responseBuilder
            .addDirective({
                type: "Connections.SendRequest",
                name: "Cancel",
                payload: {
                    InSkillProduct: {
                        productId: "amzn1.adg.product.ebbdb80e-3da2-46c2-9d12-60c6f1c2e519",
                    }
                },
                token: "amzn1.adg.product.ebbdb80e-3da2-46c2-9d12-60c6f1c2e519"
            })
            .getResponse();
    },
};