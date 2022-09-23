import { cluster } from "../3.2_EKS/eks";
import * as k8s from "@pulumi/kubernetes";

const appName = "grafana";
const namespace = new k8s.core.v1.Namespace(
  "namespace",
  {
    metadata: {
      name: "grafana",
    },
  },
  // never forget to add the next line
  // otherwise pulumi deploys to the currently selected cluster in your kubeconfig
  { provider: cluster.provider }
);

const grafana = new k8s.apps.v1.Deployment(
  "grafana",
  {
    metadata: {
      namespace: namespace.metadata.name,
      name: appName,
      labels: { app: appName },
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: { app: appName },
      },
      template: {
        metadata: { labels: { app: appName } },
        spec: {
          containers: [
            {
              name: appName,
              image: "grafana/grafana:9.0.4",
              ports: [
                {
                  containerPort: 3000,
                  name: "http",
                },
              ],
            },
          ],
        },
      },
    },
  },
  { provider: cluster.provider }
);
