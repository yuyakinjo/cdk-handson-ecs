import { Construct } from 'constructs';
import { CfnOutput, Stack } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export const vpcIdParameterName = 'VpcStackOfVpcId';

export class VpcStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vpc = new Vpc(this, VpcStack.name);

    new CfnOutput(this, `CfnOutput${Vpc.name}`, {
      value: JSON.stringify({
        arn: vpc.vpcArn,
        vpcId: vpc.vpcId,
        publicSubnetIds: vpc.publicSubnets.map(({ subnetId }) => subnetId),
        privateSubnetIds: vpc.privateSubnets.map(({ subnetId }) => subnetId),
        isolatedSubnetIds: vpc.isolatedSubnets.map(({ subnetId }) => subnetId),
      }),
    });

    new StringParameter(this, `${StringParameter.name}VpcId`, {
      parameterName: vpcIdParameterName,
      stringValue: vpc.vpcId,
    });
  }
}
