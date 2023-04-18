import Alexa from "ask-sdk";

const YEARLY_ISP_PRODUCT_ID_MAP = {
    "fr-FR": "amzn1.adg.product.46422018-2850-411f-8b56-11c0f65d4349",
    "default": "amzn1.adg.product.1552c261-fbce-42eb-900a-779d0923cbeb"
}

const MONTHLY_ISP_PRODUCT_ID_MAP = {
    "fr-FR": "amzn1.adg.product.dfc89bf4-a5f2-4776-bb59-2fd5a560a650",
    "default": "amzn1.adg.product.ebbdb80e-3da2-46c2-9d12-60c6f1c2e519"
}

const BILLING_PERIOD_IDENTIFIER = {
    "fr-FR": ["annuel", "annuelle", "annuellement", "an"],
    "default": ["year", "yearly"]
}

function isBuyYearlySubsIntent(billingPeriod, locale) {
    let wordBank = BILLING_PERIOD_IDENTIFIER.default;
    if (locale) {
        wordBank = BILLING_PERIOD_IDENTIFIER[locale];
    }
    if (billingPeriod == null || billingPeriod.length === 0) {
        return false;
    }
    for (let keyword in wordBank) {
        if (billingPeriod.includes(keyword)){
            return true;
        }
    }
    return false;
}

export const BuySubsIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BuySubsIntent';
    },
    async handle(handlerInput) {
        const locale = Alexa.getLocale(handlerInput.requestEnvelope);
        let billingPeriod = "monthly";
        if (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest') {
            billingPeriod = Alexa.getSlotValue(handlerInput.requestEnvelope, 'monthly_or_yearly');
        }
        console.log("User trying to buy month or year subscription: " + billingPeriod);

        let monthlyISPProductID = MONTHLY_ISP_PRODUCT_ID_MAP.default;
        if (locale != null && MONTHLY_ISP_PRODUCT_ID_MAP.hasOwnProperty(locale)){
            monthlyISPProductID = MONTHLY_ISP_PRODUCT_ID_MAP[locale];
        }
        let yearlyISPProductID = YEARLY_ISP_PRODUCT_ID_MAP.default;
        if (locale != null && YEARLY_ISP_PRODUCT_ID_MAP.hasOwnProperty(locale)){
            yearlyISPProductID = YEARLY_ISP_PRODUCT_ID_MAP[locale];
        }

        const isYearlySubIntent = isBuyYearlySubsIntent(billingPeriod, locale);
        if (isYearlySubIntent) {
            console.log("Buying yearly subscription");
            return handlerInput.responseBuilder
                .addDirective({
                    type: "Connections.SendRequest",
                    name: "Buy",
                    payload: {
                        InSkillProduct: {
                            productId: yearlyISPProductID,
                        }
                    },
                    token: yearlyISPProductID
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
                        productId: monthlyISPProductID,
                    }
                },
                token: monthlyISPProductID
            })
            .getResponse();
    }
}
