import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const stack: String = pulumi.getStack();
const stagingRef = new pulumi.StackReference("samox73/infra/dev");

export const privateSubnetIds: pulumi.Output<string[]> = stagingRef
  .requireOutput("privateSubnetIds")
  .apply((value) => <string[]>value);

export const vpc: pulumi.Output<aws.ec2.Vpc> = stagingRef.requireOutput("vpc").apply((value) => <aws.ec2.Vpc>value);
