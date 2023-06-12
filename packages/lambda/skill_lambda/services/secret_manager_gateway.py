import json
import logging
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class SecretManagerGateway:
    def __init__(self):
        pass

    def get_secret_value(self, secret_name, region="us-east-1"):
        try:
            session = boto3.session.Session()
            client = session.client(
                service_name='secretsmanager',
                region_name=region,
            )
            get_secret_value_response = client.get_secret_value(
                SecretId=secret_name
            )
            secret_string = get_secret_value_response['SecretString']
            secret = json.loads(secret_string)
            return secret
        except Exception as exception:
            logger.exception("Failed to fetch OpenAI API key")
            raise exception


