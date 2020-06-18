# Developing and debugging the Magda CKAN Export Minion

This will assume that you have [magda](https://github.com/magda-io/magda) and
this minion at the same level (`~`).

```console
$ tree
.
├── magda
│   └── stuff
├── magda-minion-ckan-exporter
│   └── stuff
```

## Building

To build the minion, run the following commands:

```bash
yarn install
yarn run build
eval $(minikube docker-env)
yarn run docker-build-local
```

This will build the minion and push an image to your local docker registry.

`cd` to magda and run:

```bash
helm repo update
helm dep build deploy/helm/internal-charts/storage-api
helm dep build deploy/helm/magda-core
helm dep build deploy/helm/magda
```

Then delete the minion tgz.

```bash
rm -r deploy/helm/magda/charts/magda-minion-ckan-publisher-0.0.57-0.tgz
```

## How to link local repo to magda-core

Set a symbolic link in magda-core that points to the minion.
Assuming that `magda` lives in `~/magda` and the minion lives in `~/magda-minion-ckan-exporter`,
you want to run:

```bash
ln -s ~/magda-minion-ckan-exporter/deploy/magda-minion-ckan-exporter ~/magda/deploy/helm/magda/charts/magda-minion-ckan-exporter
```

Lastly, to make magda pull the minion images from your local registry instead of docker hub,
go to `minikube-dev.yml` in magda and comment out the following:

```YAML
  minions:
    # Remove the image section to make minions pull your test docker images from local docker registry
    # Make sure you build & push the connector docker images to your local docker registry
    image:
      repository: docker.io/data61
      tag: 0.0.57-0
      pullPolicy: IfNotPresent
      imagePullSecret: false
```

### Deploying

Before you deploy, you need to create a k8s secret with a file that contains your CKAN api keys.
The map should look like this:

```json
{
    "https://demo.ckan.org": {
        "apiKey": "blah"
    }
}
```

To create the secret, run :

```console
$ kubectl create secret generic ckan-exporter-secrets --from-file=/path/to/file.json
secret/ckan-exporter-secrets created
```

Deploying now should be as simple as running a helm upgrade from magda:

```bash
helm upgrade --install --timeout 9999s --wait -f deploy/helm/minikube-dev.yml magda deploy/helm/magda
```
