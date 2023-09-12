import { Stack, StackProps } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import {CpuArchitecture,EcrImage,OperatingSystemFamily} from 'aws-cdk-lib/aws-ecs'; // prettier-ignore
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
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

    const { targetGroup } = new ApplicationLoadBalancedFargateService(
      this,
      ApplicationLoadBalancedFargateService.name,
      {
        vpc: Vpc.fromLookup(this, Vpc.name, { vpcId }),
        taskImageOptions: { image, containerPort: 3000 },
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
  }
}
