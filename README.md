# magda-minion-ckan-exporter

MAGDA Minion for exporting datasets to CKAN

## Description

TLDR: This minion exports datasets as open data to a CKAN instance (e.g, data.gov.au)

During the add dataset flow, in the `Access and User` section,
the user can choose whether or not to publish the dataset as open data (`No` by default).

At the moment, it only exports the dataset to data.gov.au.

## How it works

On publishing of the dataset to MAGDA, the minion will create an equivalent CKAN package
and upload it to CKAN via the [CKAN Api](https://docs.ckan.org/en/ckan-2.7.3/api/) and
store the `CkanId` returned by CKAN.

If the dataset is edited, the entire dataset is uploaded again, but as an update.

If the user chooses to not have the dataset available as open data anymore, the dataset
is deleted from the CKAN instance.

### Local Dev

For instructions on working on this minion, refer to [local-dev.md](./local-dev.md).

If you would like to build a connector or a minion for MAGDA,
here is a handy
[guide](https://github.com/magda-io/magda/blob/master/docs/docs/how-to-build-your-own-connectors-minions.md).

## Requirements

Kubernetes: `>= 1.14.0-0`

| Repository | Name | Version |
|------------|------|---------|
| oci://ghcr.io/magda-io/charts | magda-common | 2.1.1 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| defaultAdminUserId | string | `"00000000-0000-4000-8000-000000000000"` |  |
| defaultImage.imagePullSecret | bool | `false` |  |
| defaultImage.pullPolicy | string | `"IfNotPresent"` |  |
| defaultImage.repository | string | `"ghcr.io/magda-io"` |  |
| global.image | object | `{}` |  |
| global.minions.image | object | `{}` |  |
| global.rollingUpdate.maxUnavailable | int | `0` |  |
| image.name | string | `"magda-minion-ckan-exporter"` |  |
| resources.limits.cpu | string | `"100m"` |  |
| resources.requests.cpu | string | `"10m"` |  |
| resources.requests.memory | string | `"30Mi"` |  |