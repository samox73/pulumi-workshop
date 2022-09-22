# Pulumi Workshop

## Requirements
- Pulumi binary
- Language Runtime (Node.js, Python, Go, .NET, Java)
- basic shell knowledge

## Outline
1. Installation 
2. General Infrastructure
3. Kubernetes
    1. Stack References
    2. EKS (Elastic Kubernetes Service)
    3. Native K8s Deployments
    4. Helm Chart Deployments

## 1. Installation
Follow one of these to setup the environment
- [AWS](https://www.pulumi.com/docs/get-started/aws/)
- [Azure](https://www.pulumi.com/docs/get-started/azure/)
- [GCP](https://www.pulumi.com/docs/get-started/gcp/)
## 2. General Infrastructure
Create a new directory named `2_General_Infrastructure` and a new project with

(NOTE: The directory must be empty or you can supply `--force`.)

```bash
mkdir 2_General_Infrastructure
cd 2_General_Infrastructure
pulumi new aws-typescript
```

Supply all necessary values. For this project, we use

```yaml
project name: infra
```

any description (press return for the default) and
Pulumi will set up the project and generate all necessary files. The entry point will be the file `index.ts`. 

Stacks are primarily used to share common code between environments. We already created a `dev` stack and could now create others (e.g. `staging`, `prod`). To be able to use the same code with different parameters (e.g. the VPC CIDR) Pulumi can be configured to use different values per stack. For this, we execute
See `2_General_Infrastructure/index.ts` for how this configuration value can then be used.

Now we can issue

```bash
pulumi up
```

to create the stack.

> **We have now created a VPC with subnets and route tables, which we can use to create other resources**

## 3. Kubernetes

For this part, we create a separate project in a new folder with the following settings

```yaml
project name: kubernetes
stack name: dev
aws:region: eu-central-1
```

and install the packages

```bash
npm i @pulumi/kubernetes @pulumi/eks
```

### 3.1 Stack references

Pulumi projects can have 2 different approaches:
- Monolithic
- Microstacks

For simple and small projects the monolithic architecture is the right approach. When the project grows larger, so does the complexity and execution time of Pulumi. For big projects, it is sensible to split projects into their respective areas of responsibility. For example, we might have to deploy both an EKS (Kubernetes) based architecture and EC2 instances. It is recommended to create separate projects for both and to reference the `General_Infrastructure` (parent-)project from each.

See `3_Kubernetes/3.1_Stack_References/imports.ts` how we can reference another stack and use its exports in another project.

### 3.2 EKS cluster

Now we can create an Elastic Kubernetes Service (EKS) cluster with node groups. For this, we need some information about the VPC and the subnets.
See `3_Kubernetes/3.2_EKS/eks.ts` how we create the EKS cluster. The various parameters in this step should not scare you off. The [documentation for the EKS package](https://www.pulumi.com/registry/packages/eks/api-docs/) offers a decent explanation.

Deploy the EKS cluster by executing

```
pulumi up
```

and then wait for it to finish. This might take up to 20 minutes.

For AWS we can easily add the new cluster to our `~/.kube/config` by executing

```bash
aws eks update-kubeconfig --region eu-central-1 --name workshop
```

You can check that nodes are running in the cluster by first selecting the right context for `kubectl` and then getting the nodes

```bash
kubectl config use-context CONTEXT_NAME
kubectl get nodes
```

The output will be similar to this:

```bash
NAME                                           STATUS   ROLES    AGE     VERSION
ip-10-0-48-11.eu-central-1.compute.internal    Ready    <none>   6m50s   v1.22.10-eks-7dc61e8
ip-10-0-64-50.eu-central-1.compute.internal    Ready    <none>   6m55s   v1.22.10-eks-7dc61e8
ip-10-0-94-211.eu-central-1.compute.internal   Ready    <none>   6m52s   v1.22.10-eks-7dc61e8
```

### 3.3 K8s Deployments

Now that we have a K8s cluster with nodes up and running we can finally deploy applications, e.g. Grafana.  This is as simple as writing a `Deployment` with the `@pulumi/kubernetes` provider and executing `pulumi up` once again. 

See `3_Kubernetes/3.3_K8s_Deployment/grafana.ts`.

### 3.4 Helm Charts

Writing deployments, services, ingresses, etc. is cumbersome and time-consuming. Helm charts contain all resources needed to deploy some applications. As an example, we will now deploy the `kube-prometheus` chart. This automatically deploys 
- Prometheus
- Alertmanager
- Grafana
- node-exporter (on each node)
and registers Prometheus as a datasource in Grafana.

See `3_Kubernetes/3.4_Helm/prometheus.ts`.

## Teardown
To delete all created resources simply do

```bash
pulumi destroy
```

in reverse order.