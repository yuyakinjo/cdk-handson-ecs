#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import { VpcStack } from '../lib/vpc-stack';

const app = new cdk.App();

const user = process.env.USER?.toUpperCase();

new VpcStack(app, `${VpcStack.name}Of${user}`);

new CdkStack(app, `${CdkStack.name}Of${user}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
