# Developing and debugging the Magda CKAN Publishing Minion

## Build

Building magda-core and then minion.

For magda-core, run:

```bash
helm repo update
helm dep build deploy/helm/internal-charts/storage-api
helm dep build deploy/helm/magda-core
helm dep build deploy/helm/magda
```

then delete the minion tgz
then symbol link

## How to link to magda-core

Set a symbolic link in magda-core that points to the minion.
Assuming that `magda` lives in `~/magda` and the minion lives in `~/magda-minion-ckan-publisher`,
you want to run:

```bash
ln -s ~/magda-minion-ckan-publisher/deploy/magda-minion-ckan-publisher ~/magda/deploy/helm/magda/charts/magda-minion-ckan-publisher
```

### Building

```bash
yarn run build
eval $(minikube docker-env)
yarn run docker-build-local
cd ~/magda
helm upgrade --install --timeout 9999s --wait -f deploy/helm/minikube-dev.yml magda deploy/helm/magda
```
