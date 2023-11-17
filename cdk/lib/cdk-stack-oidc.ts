import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CpuArchitecture, EcrImage, OperatingSystemFamily } from "aws-cdk-lib/aws-ecs"; // prettier-ignore
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { ListenerAction, ListenerCondition } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { join } from 'path';
import { envSchema } from './env-validation';

export interface CdkStackProps extends StackProps {}

export class CdkStackOIDC extends Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const image = EcrImage.fromAsset(join(__dirname, '../../'));

    const validation = envSchema.safeParse({
      subDomain: process.env.SUB_DOMEIN?.toLowerCase(),
      domainName: process.env.DOMAIN_NAME,
      certificateArn: process.env.CERTIFICATE_ARN,
      issuer: process.env.ISSUER,
      authorizationEndpoint: process.env.AUTHORIZATION_ENDPOINT,
      tokenEndpoint: process.env.TOKEN_ENDPOINT,
      userInfoEndpoint: process.env.USERINFO_ENDPOINT,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    });

    if (!validation.success) {
      throw {
        errors: validation.error.flatten().fieldErrors,
        message: 'Missing required environment variables.',
      };
    }
    const { domainName, subDomain, clientId, clientSecret, certificateArn, ...oidcOptions } = validation.data; // prettier-ignore

    const { targetGroup, taskDefinition, listener } = new ApplicationLoadBalancedFargateService(
      this,
      ApplicationLoadBalancedFargateService.name,
      {
        taskImageOptions: {
          image,
          command: ['bun', 'run', 'oidc'],
          containerPort: 3000,
        },
        domainName: `${subDomain}.${domainName}`,
        domainZone: HostedZone.fromLookup(this, 'HostedZone', { domainName }),
        certificate: Certificate.fromCertificateArn(this, Certificate.name, certificateArn),
        redirectHTTP: true,
        circuitBreaker: { rollback: true },
        enableExecuteCommand: true,
        runtimePlatform: {
          cpuArchitecture: CpuArchitecture.ARM64,
          operatingSystemFamily: OperatingSystemFamily.LINUX,
        },
      }
    );

    targetGroup.configureHealthCheck({
      port: `${taskDefinition.defaultContainer?.containerPort}`,
      path: '/',
    });

    listener.addAction('HeaderReturnAction', {
      priority: 2,
      conditions: [ListenerCondition.hostHeaders([`${subDomain}.${domainName}`])],
      action: ListenerAction.authenticateOidc({
        ...oidcOptions,
        clientId,
        clientSecret: SecretValue.unsafePlainText(clientSecret),
        next: ListenerAction.forward([targetGroup]),
      }),
    });
  }
}
