import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";

import { privateSubnetIds, vpc } from "../3.1_Stack_References/imports";

const clusterName = "workshop";
const instanceTypes = ["r5.large"];

// create necessary role with policies for EKS nodes
const role = new aws.iam.Role(`${clusterName}-ng-role`, {
  name: `${clusterName}-nodeGroup-role`,
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "ec2.amazonaws.com",
  }),
});
let counter = 0;
for (const policyArn of [
  "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
  "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
  "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
]) {
  new aws.iam.RolePolicyAttachment(`${clusterName}-ng-role-policy-${counter++}`, { policyArn, role });
}

// Create the EKS cluster. This is just the Control Plane part that EKS manages.
// At this point no nodes are running yet.
const cluster: eks.Cluster = new eks.Cluster(`eksCluster`, {
  name: clusterName,
  skipDefaultNodeGroup: true,
  vpcId: vpc.id,
  privateSubnetIds: privateSubnetIds,
  instanceRoles: [role],
  createOidcProvider: true,
  // add additional people/groups if necessary
  userMappings: [
    {
      groups: ["system:masters"],
      username: "samuel.recker",
      userArn: "arn:aws:iam::251058682577:user/samuel.recker",
    },
  ],
});

const oidcProviderUrl = cluster.core.oidcProvider!.url;
const oidcProviderArn = cluster.core.oidcProvider!.arn;

// loop over the subnets IDs and create a node group for each subnet (i.e. availability zone in this case)
privateSubnetIds.apply((subnetIds) => {
  for (const subnetId of subnetIds) {
    eks.createManagedNodeGroup(
      `ng-${clusterName}-${subnetId}`,
      {
        cluster: cluster,
        nodeGroupName: `${clusterName}-${subnetId}`,
        nodeRoleArn: role.arn,
        subnetIds: [subnetId],
        amiType: "BOTTLEROCKET_x86_64",
        capacityType: "ON_DEMAND",
        instanceTypes: instanceTypes,
        scalingConfig: {
          desiredSize: 1,
          maxSize: 1,
          minSize: 1,
        },
        updateConfig: {
          maxUnavailable: 1,
        },
      },
      cluster
    );
  }
});

const kubeConfig = cluster.kubeconfig;

export { cluster, oidcProviderArn, oidcProviderUrl, kubeConfig };
