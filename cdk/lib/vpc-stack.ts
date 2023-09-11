import { Construct } from 'constructs';
import { CfnOutput, Fn, Stack } from 'aws-cdk-lib';
import { Vpc } from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends Stack {
  vpc: Vpc;
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

    new CfnOutput(this, `${Vpc.name}IdOf${VpcStack.name}`, {
      value: vpc.vpcId,
      exportName: 'VpcStackOfVpcId',
    });
  }
}
