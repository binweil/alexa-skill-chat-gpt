import {Duration, StackProps, Stack} from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import {Construct} from 'constructs';
import * as path from "path";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaRole = new iam.Role(this, "Alexa-ChatGPT-Lambda-Role", {
      roleName: "Alexa-ChatGPT-Lambda-Role",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("SecretsManagerReadWrite"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess")
      ]
    });
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      resources: ["*"],
      actions: [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
      ],
      effect: iam.Effect.ALLOW
    }))

    const dynamoDB = new ddb.Table(this, "Alexa-ChatGPT-Table", {
      tableName: "Alexa-ChatGPT-Table",
      partitionKey: {
        name: "customer_id",
        type: ddb.AttributeType.STRING
      },
      timeToLiveAttribute: "expire_ttl"
    })

    const handler = new lambda.Function(this, 'Alexa-ChatGPT-Handler', {
      functionName: "Alexa-ChatGPT-Handler",
      runtime: lambda.Runtime.PYTHON_3_7,
      timeout: Duration.seconds(30),
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/skill_lambda/build/lambda.zip')),
      role: lambdaRole,
      environment: {
        "DYNAMODB_TABLE_NAME": dynamoDB.tableName
      }
    });

    dynamoDB.grantFullAccess(handler);

  }
}
