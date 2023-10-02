#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();

const user = process.env.USER?.toUpperCase();

new CdkStack(app, `${CdkStack.name}Of${user}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
