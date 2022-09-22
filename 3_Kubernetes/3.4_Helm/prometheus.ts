import * as k8s from "@pulumi/kubernetes";
import { cluster } from "../3.2_EKS/eks";

const namespace = new k8s.core.v1.Namespace("prometheus-namespace", {
  metadata: {
    name: "kube-prometheus",
  },
});

const kubePrometheus = new k8s.helm.v3.Release(
  "kube-prometheus",
  {
    repositoryOpts: {
      repo: "https://prometheus-community.github.io/helm-charts",
    },
    chart: "kube-prometheus-stack",
    namespace: namespace.metadata.name,
    values: {
      nameOverride: "kp",
      fullnameOverride: "kp",
      namespaceOverride: namespace.metadata.name,
      prometheusOperator: {
        admissionWebhooks: {
          enabled: false, // webhooks don't work with helm (yet)
        },
        tls: {
          enabled: false,
        },
      },
      alertmanager: {
        enabled: true,
        alertmanagerSpec: {
          replicas: 1,
          externalUrl: "https://alerts.powerbot-trading.com",
        },
      },
      grafana: { enabled: true },
      prometheus: {
        prometheusSpec: {
          replicas: 2,
          scrapeInterval: "15s",
          scrapeTimeout: "10s",
          retention: "1h",
        },
      },
      nodeExporter: { enabled: true },
      // the following are disabled because they are hidden inside the "managed" EKS control plane, thus out of reach
      kubelet: { enabled: false },
      kubeControllerManager: { enabled: false },
      kubeEtcd: { enabled: false },
      kubeScheduler: { enabled: false },
    },
  },
  {
    provider: cluster.provider,
  }
);
