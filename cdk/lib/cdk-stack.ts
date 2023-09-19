import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, Port, SubnetType, Vpc, } from "aws-cdk-lib/aws-ec2"; // prettier-ignore
import { CpuArchitecture, EcrImage, OperatingSystemFamily, } from "aws-cdk-lib/aws-ecs"; // prettier-ignore
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { AuroraPostgresEngineVersion, ClusterInstance, DatabaseCluster, DatabaseClusterEngine, InstanceUpdateBehaviour, ServerlessCluster, } from "aws-cdk-lib/aws-rds"; // prettier-ignore
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { join } from 'path';

const vpcIdParameterName = 'VpcStackOfVpcId';

export interface CdkStackProps extends StackProps {}

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props: CdkStackProps) {
    super(scope, id, props);

    const localDockerfile = join(__dirname, '../../');

    const image = EcrImage.fromAsset(localDockerfile);

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

    const { targetGroup, service } = new ApplicationLoadBalancedFargateService(
      this,
      ApplicationLoadBalancedFargateService.name,
      {
        vpc,
        taskImageOptions: {
          image,
          containerPort: 3000,
          command: ['bun', '--watch', './src/index.ts'],
          environment: {
            DB_HOST: rds.secret?.secretValueFromJson('host').unsafeUnwrap() ?? '',
            DB_PORT: rds.secret?.secretValueFromJson('port').unsafeUnwrap() ?? '',
            DB_USER: rds.secret?.secretValueFromJson('username').unsafeUnwrap() ?? '',
            DB_PASS: rds.secret?.secretValueFromJson('password').unsafeUnwrap() ?? '',
            DB_NAME: rds.secret?.secretValueFromJson('dbname').unsafeUnwrap() ?? '',
          },
        },
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
      port: '3000',
      path: '/',
    });

    rds.connections.allowFrom(service, Port.tcp(rds.clusterEndpoint.port));

    rds.secret?.grantRead(service.taskDefinition.taskRole);
  }
}
