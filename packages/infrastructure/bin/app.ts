#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServiceStack } from '../lib/service-stack';

const app = new cdk.App();
const env= { account: '057559841507', region: 'us-east-1' };

const serviceStack = new ServiceStack(app, 'Alexa-ChatGPT-Service-Stack', {
    env
});

