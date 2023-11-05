import boto3
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class CloudWatchWrapper:
    """Encapsulates Amazon CloudWatch functions."""

    def __init__(self):
        self.cloudwatch_resource = boto3.resource("cloudwatch")


    def put_metric_data(self, namespace, service_name, metric_name, value, unit):
        """
        Sends a single data value to CloudWatch for a metric. This metric is given
        a timestamp of the current UTC time.

        :param namespace: The namespace of the metric.
        :param name: The name of the metric.
        :param value: The value of the metric.
        :param unit: The unit of the metric.
        """
        try:
            metric = self.cloudwatch_resource.Metric(namespace, service_name)
            metric.put_data(
                Namespace=namespace,
                MetricData=[{
                    "MetricName": metric_name,
                    'Dimensions': [
                        {
                            'Name': 'Service Name',
                            'Value': service_name
                        },
                    ],
                    "Value": value,
                    "Unit": unit
                }],
            )
            logger.info("Put data for metric %s.%s", namespace, service_name)
        except ClientError:
            logger.exception("Couldn't put data for metric %s.%s", namespace, service_name)
            raise

