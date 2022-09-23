// crosswalk for aws (convenience wrapper around @pulumi/aws)
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

const stack: string = pulumi.getStack();
const config: pulumi.Config = new pulumi.Config();

const vpc: awsx.ec2.Vpc = new awsx.ec2.Vpc(`vpc`, {
  cidrBlock: config.require("cidr"),
  numberOfAvailabilityZones: "all",
  subnets: [
    {
      type: "public",
      name: "workshop",
      cidrMask: 20,
      tags: {
        "kubernetes.io/role/elb": "1",
        "kubernetes.io/cluster/workshop": "owned",
      },
    },
    {
      type: "private",
      name: "worhshop",
      cidrMask: 20,
      tags: {
        "kubernetes.io/role/internal-elb": "1",
        "kubernetes.io/cluster/workshop": "owned",
      },
    },
  ],
  tags: {
    Name: `workshop-${stack}`,
  },
});

const privateSubnetIds = vpc.privateSubnets.then((sns) => sns.map((sn) => sn.id));

// we export these variables so that we can reference them from other projects
export { vpc, privateSubnetIds };
