import CloudWatchClient from 'aws-sdk/clients/cloudwatch.js';
import { CLOUDWATCH_REGION, NAMESPACE } from '../constants/cloudwatch-constants.js';

export function addCount(intentName, metrics) {
    const client = new CloudWatchClient({region: CLOUDWATCH_REGION});
    client.putMetricData({
        Namespace: NAMESPACE,
        MetricData: [
            {
                MetricName: metrics | "Count",
                Dimensions: [{
                    Name: intentName,
                    Value: intentName,
                }],
                Unit: "Count",
                Value: 1.0
            }
        ]
    }, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    })
}