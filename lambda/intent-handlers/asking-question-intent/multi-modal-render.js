import Alexa from 'ask-sdk';
import showdown from 'showdown';
import xssfilter from 'showdown-xss-filter';
import { METRICS_SUCCESS, METRICS_ERROR, ASKING_QUESTION_INTENT_MM } from '../../constants/cloudwatch-constants.js';
import { addCount } from '../../services/cloudwatch.js';

const DOCUMENT_ID = "VisualizeResponseText";

// "headerAttributionImage": "https://d2o906d8ln7ui1.cloudfront.net/images/response_builder/logo-world-of-plants-2.png",
const datasource = {
    "fr-FR": {
        "simpleTextTemplateData": {
            "type": "object",
            "properties": {
                "backgroundImage": "https://d2o906d8ln7ui1.cloudfront.net/images/response_builder/background-green.png",
                "foregroundImageLocation": "left",
                "foregroundImageSource": "https://d2s5tydsfac9v4.cloudfront.net/chat-gpt-108.png",
                "headerTitle": "Réponse ChatGPT",
                "headerSubtitle": "",
                "hintText": "Essayez de me demander \"De Vinci, qu'est-ce que l'apprentissage automatique?\"",
                "primaryText": "",
                "textAlignment": "start",
                "titleText": "Entrée utilisateur"
            }
        }
    },
    "default": {
        "simpleTextTemplateData": {
            "type": "object",
            "properties": {
                "backgroundImage": "https://d2o906d8ln7ui1.cloudfront.net/images/response_builder/background-green.png",
                "foregroundImageLocation": "left",
                "foregroundImageSource": "https://d2s5tydsfac9v4.cloudfront.net/chat-gpt-108.png",
                "headerTitle": "ChatGPT Response",
                "headerSubtitle": "",
                "hintText": "Try ask me, \"What is machine learning\"",
                "primaryText": "",
                "textAlignment": "start",
                "titleText": "User Input"
            }
        }
    }
};

const createDirectivePayload = (aplDocumentId, dataSources = {}, tokenId = "documentToken") => {
    return {
        type: "Alexa.Presentation.APL.RenderDocument",
        token: tokenId,
        document: {
            type: "Link",
            src: "doc://alexa/apl/documents/" + aplDocumentId
        },
        datasources: dataSources
    }
};

export function getAPIDirective(handlerInput, userInputText, responseText, imageURL) {
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
        let markdownResponse;
        try {
            const options = {
                omitExtraWLInCodeBlocks: false,
                noHeaderId: false,
                ghCompatibleHeaderId: true,
                prefixHeaderId: true,
                headerLevelStart: 1,
                parseImgDimensions: true,
                simplifiedAutoLink: true,
                excludeTrailingPunctuationFromURLs: true,
                literalMidWordUnderscores: true,
                strikethrough: true,
                tables: true,
                tasklists: true,
                ghMentions: false,
                ghMentionsLink: null,
                ghCodeBlocks: true,
                smartIndentationFix: true,
                smoothLivePreview: true,
                disableForced4SpacesIndentedSublists: true,
                simpleLineBreaks: true,
                requireSpaceBeforeHeadingText: true,
                encodeEmails: false,
                extensions: [
                    xssfilter,
                    // showdownPrismjs
                ],
            };

            const converter = new showdown.Converter(options);
            markdownResponse = converter.makeHtml(JSON.stringify(responseText));
            console.log(markdownResponse);
            addCount(ASKING_QUESTION_INTENT_MM, METRICS_SUCCESS);
        } catch (err) {
            markdownResponse = responseText;
            console.error("Cannot parse response to html");
            console.error(err);
            addCount(ASKING_QUESTION_INTENT_MM, METRICS_ERROR);
        }

        let datasourceWithLocale = datasource.default;
        if (locale != null && datasource.hasOwnProperty(locale)){
            datasourceWithLocale = datasource[locale];
        }

        datasourceWithLocale.simpleTextTemplateData.properties.titleText = userInputText;
        datasourceWithLocale.simpleTextTemplateData.properties.primaryText = responseText;
        if (markdownResponse && markdownResponse.length != 0) {
            datasourceWithLocale.simpleTextTemplateData.properties.primaryText = markdownResponse;
        }
        datasourceWithLocale.simpleTextTemplateData.properties.foregroundImageSource = imageURL;
        return createDirectivePayload(DOCUMENT_ID, datasourceWithLocale);
    }
    return null;
}