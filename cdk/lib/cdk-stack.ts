import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { InstanceClass, InstanceSize, InstanceType, Port, SubnetType, Vpc, } from "aws-cdk-lib/aws-ec2"; // prettier-ignore
import { CpuArchitecture, EcrImage, OperatingSystemFamily, Secret } from "aws-cdk-lib/aws-ecs"; // prettier-ignore
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { AuroraPostgresEngineVersion, ClusterInstance, DatabaseCluster, DatabaseClusterEngine, InstanceUpdateBehaviour, ServerlessCluster, } from "aws-cdk-lib/aws-rds"; // prettier-ignore
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { join } from 'path';

export interface CdkStackProps extends StackProps {}

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const image = EcrImage.fromAsset(join(__dirname, '../../'));

    const vpcIdParameterName = 'VpcStackOfVpcId';
    const vpcId = StringParameter.valueFromLookup(this, vpcIdParameterName); // ハンズオンのため、VpcStackがないためのワークアラウンド
    const vpc = Vpc.fromLookup(this, Vpc.name, { vpcId }); // vpc上限にひっかかるため、ひとつのvpcを使いまわす

    const rds = new DatabaseCluster(this, ServerlessCluster.name, {
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_15_3,
      }),
      instanceUpdateBehaviour: InstanceUpdateBehaviour.ROLLING,
      writer: ClusterInstance.provisioned('WriterInstanceT3Medium', {
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
        enablePerformanceInsights: true,
      }),
      readers: [
        ClusterInstance.provisioned('ReaderInstanceT3Medium', {
          instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
          enablePerformanceInsights: true,
        }),
      ],
      defaultDatabaseName: 'zon100',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const subDomain = `${process.env.USER?.toLowerCase()}`;
    const domainName = process.env.DOMAIN_NAME ?? new Error('DOMAIN_NAME is not defined');
    const certificateArn = process.env.CERTIFICATE_ARN ?? new Error('CERTIFICATE_ARN is not defined');

    if (!rds.secret || certificateArn || domainName) return;

    const { targetGroup, service, loadBalancer, taskDefinition } = new ApplicationLoadBalancedFargateService(
      this,
      ApplicationLoadBalancedFargateService.name,
      {
        vpc,
        taskImageOptions: {
          image,
          command: ['bun', 'run', 'start'],
          containerPort: 3000,
          secrets: {
            DB_HOST: Secret.fromSecretsManager(rds.secret, 'host'),
            DB_PORT: Secret.fromSecretsManager(rds.secret, 'port'),
            DB_USER: Secret.fromSecretsManager(rds.secret, 'username'),
            DB_PASS: Secret.fromSecretsManager(rds.secret, 'password'),
            DB_NAME: Secret.fromSecretsManager(rds.secret, 'dbname'),
          },
        },
        domainName: `${subDomain}.${domainName}`,
        domainZone: HostedZone.fromLookup(this, 'HostedZone', { domainName }),
        certificate: Certificate.fromCertificateArn(this, Certificate.name, certificateArn),
        redirectHTTP: true,
        circuitBreaker: { rollback: true },
        enableExecuteCommand: true,
        // apple silicon mac　で docker build の方は下記を追加
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

    rds.connections.allowFrom(service, Port.tcp(rds.clusterEndpoint.port));

    new CfnOutput(this, 'URL', { value: `http://${loadBalancer.loadBalancerDnsName}` });
    new CfnOutput(this, 'Cluster', { value: service.cluster.clusterName });
    new CfnOutput(this, 'TaskDefinitionARN', { value: service.taskDefinition.taskDefinitionArn });
    new CfnOutput(this, 'RDSHost', { value: rds.clusterEndpoint.hostname });
    new CfnOutput(this, 'RDSPort', { value: rds.clusterEndpoint.port.toString() });
    new CfnOutput(this, 'DocumentName', { value: 'AWS-StartPortForwardingSessionToRemoteHost' });
  }
}
