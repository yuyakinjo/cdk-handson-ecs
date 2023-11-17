#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { CdkStackOIDC } from '../lib/cdk-stack-oidc';

const app = new cdk.App();

// const user = process.env.USER?.toUpperCase();

// new CdkStack(app, `${CdkStack.name}Of${user}`, {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: 'us-east-1',
//   },
// });

new CdkStackOIDC(app, CdkStackOIDC.name, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
