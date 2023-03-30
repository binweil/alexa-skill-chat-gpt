import Alexa from "ask-sdk";

export const BuySubsIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BuySubsIntent';
    },
    async handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const billingPeriod = Alexa.getSlotValue(handlerInput.requestEnvelope, 'monthly_or_yearly');
        console.log("User trying to buy month or year subscription: " + billingPeriod);

        if (billingPeriod != null && 
            billingPeriod.length != 0 && 
            billingPeriod.includes("year")) {
            console.log("Buying yearly subscription");
            return handlerInput.responseBuilder
                .addDirective({
                    type: "Connections.SendRequest",
                    name: "Buy",
                    payload: {
                        InSkillProduct: {
                            productId: "amzn1.adg.product.1552c261-fbce-42eb-900a-779d0923cbeb",
                        }
                    },
                    token: "amzn1.adg.product.1552c261-fbce-42eb-900a-779d0923cbeb"
                })
                .getResponse();
        };
        
        console.log("Buying monthly subscription");
        return handlerInput.responseBuilder
            .addDirective({
                type: "Connections.SendRequest",
                name: "Buy",
                payload: {
                    InSkillProduct: {
                        productId: "amzn1.adg.product.ebbdb80e-3da2-46c2-9d12-60c6f1c2e519",
                    }
                },
                token: "amzn1.adg.product.ebbdb80e-3da2-46c2-9d12-60c6f1c2e519"
            })
            .getResponse();
    }
}
