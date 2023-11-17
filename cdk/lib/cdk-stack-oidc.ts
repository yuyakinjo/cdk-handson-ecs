import { SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CpuArchitecture, EcrImage, OperatingSystemFamily } from "aws-cdk-lib/aws-ecs"; // prettier-ignore
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { ListenerAction, ListenerCondition } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { join } from 'path';

export interface CdkStackProps extends StackProps {}

export class CdkStackOIDC extends Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const image = EcrImage.fromAsset(join(__dirname, '../../'));

    const subDomain = process.env.SUB_DOMEIN?.toLowerCase() ?? new Error('SUB_DOMEIN is not defined');
    const domainName = process.env.DOMAIN_NAME ?? new Error('DOMAIN_NAME is not defined');
    const certificateArn = process.env.CERTIFICATE_ARN ?? new Error('CERTIFICATE_ARN is not defined');
    const issuer = process.env.ISSUER ?? new Error('ISSUER is not defined');
    const authorizationEndpoint =
      process.env.AUTHORIZATION_ENDPOINT ?? new Error('AUTHORIZATION_ENDPOINT is not defined');
    const tokenEndpoint = process.env.TOKEN_ENDPOINT ?? new Error('TOKEN_ENDPOINT is not defined');
    const userInfoEndpoint = process.env.USERINFO_ENDPOINT ?? new Error('USERINFO_ENDPOINT is not defined');
    const clientId = process.env.CLIENT_ID ?? new Error('CLIENT_ID is not defined');
    const clientSecret = process.env.CLIENT_SECRET ?? new Error('CLIENT_SECRET is not defined');

    if (subDomain instanceof Error) throw subDomain;
    if (domainName instanceof Error) throw domainName;
    if (certificateArn instanceof Error) throw certificateArn;
    if (issuer instanceof Error) throw issuer;
    if (authorizationEndpoint instanceof Error) throw authorizationEndpoint;
    if (tokenEndpoint instanceof Error) throw tokenEndpoint;
    if (userInfoEndpoint instanceof Error) throw userInfoEndpoint;
    if (clientId instanceof Error) throw clientId;
    if (clientSecret instanceof Error) throw clientSecret;

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
        issuer,
        authorizationEndpoint,
        tokenEndpoint,
        userInfoEndpoint,
        clientId,
        clientSecret: SecretValue.unsafePlainText(clientSecret),
        next: ListenerAction.forward([targetGroup]),
      }),
    });
  }
}
