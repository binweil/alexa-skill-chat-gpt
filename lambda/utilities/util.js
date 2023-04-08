//import S3 from 'aws-sdk/clients/s3.js';

// const s3SigV4Client = new S3({
//     signatureVersion: 'v4',
//     region: process.env.S3_PERSISTENCE_REGION
// });
//
// export function getS3PreSignedUrl(s3ObjectKey) {
//
//     const bucketName = process.env.S3_PERSISTENCE_BUCKET;
//     const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
//         Bucket: bucketName,
//         Key: s3ObjectKey,
//         Expires: 60*1 // the Expires is capped for 1 minute
//     });
//     console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
//     return s3PreSignedUrl;
//
// }

export function isNullOrEmpty(string) {
    if (!string || string.length == 0) {
        return true;
    }
    return false;
}

export function isProduct(product) {
    return product != null;
}

export async function isUserEntitled(handlerInput) {
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
    return entitled;
}