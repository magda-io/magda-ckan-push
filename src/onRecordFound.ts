import {
    AuthorizedRegistryClient,
    Record
} from "@magda/minion-sdk";
import CkanClient from "./CkanClient";
import ckanPublishAspectDef from "./ckanPublishAspectDef";
const URI =  require("urijs").default;
// const _ = require("lodash");

interface PlainObjectType {
    [key: string]: any;
}

export interface CkanPublishAspectType {
    status: "retain" | "withdraw";
    publishingUserId?: string;
    ckanId?: string;
    hasCreated: boolean;
    publishRequired: boolean;
    publishAttempted: boolean;
    lastPublishAttemptTime?: string;
    publishError?: string;
}

async function recordSuccessCkanPublishAction(
    recordId: string,
    tenantId: number,
    registry: AuthorizedRegistryClient,
    ckanPublishData: CkanPublishAspectType,
    ckanId?: string
) {
    const data: CkanPublishAspectType = {
        ...ckanPublishData,
        publishRequired: false,
        publishAttempted: true,
        lastPublishAttemptTime: new Date().toISOString(),
        publishError: ""
    };
    if (ckanId) {
        data.ckanId = ckanId;
        data.hasCreated = true;
    } else {
        data.ckanId = undefined;
        data.hasCreated = false;
    }
    const res = await registry.putRecordAspect(
        recordId,
        ckanPublishAspectDef.id,
        data,
        tenantId
    );
    if (res instanceof Error) {
        throw Error;
    }
}

async function recordFailCkanPublishAction(
    recordId: string,
    tenantId: number,
    registry: AuthorizedRegistryClient,
    ckanPublishData: CkanPublishAspectType,
    error: Error | string
) {
    const data: CkanPublishAspectType = {
        ...ckanPublishData,
        publishAttempted: true,
        lastPublishAttemptTime: new Date().toISOString(),
        publishError: `${error}`
    };
    const res = await registry.putRecordAspect(
        recordId,
        ckanPublishAspectDef.id,
        data,
        tenantId
    );
    if (res instanceof Error) {
        throw Error;
    }
}

async function createDistributionData(
    ckanClient: CkanClient,
    externalUrl: string,
    record: Record,
    distribution: Record
) {
    const url =
        distribution?.["aspects"]?.["dcat-distribution-strings"]?.[
            "downloadURL"
        ] ??
        distribution?.["aspects"]?.["dcat-distribution-strings"]?.[
            "accessURL"
        ] ??
        new URI(externalUrl).path(`dataset/${record.id}/details`).toString();
    const data = {
        name:
            distribution?.["aspects"]?.["dcat-distribution-strings"]?.[
                "title"
            ] ?? record.name,
        url
    } as any;

    if (
        distribution?.["aspects"]?.["dcat-distribution-strings"]?.[
            "description"
        ]
    ) {
        data.description =
            distribution?.["aspects"]?.["dcat-distribution-strings"]?.[
                "description"
            ];
    }

    const format =
        distribution?.["aspects"]?.["dataset-format"]?.["format"] ??
        distribution?.["aspects"]?.["dcat-distribution-strings"]?.["format"] ??
        "";

    if (format) {
        data.description = format;
    }

    if (
        distribution?.["aspects"]?.["dcat-distribution-strings"]?.["mediaType"]
    ) {
        data.mimetype =
            distribution?.["aspects"]?.["dcat-distribution-strings"]?.[
                "mediaType"
            ];
    }

    /*

    if (distribution?.["aspects"]?.["dcat-distribution-strings"]?.["issued"]) {
        data.created =
            distribution?.["aspects"]?.["dcat-distribution-strings"]?.[
                "issued"
            ];
    }

    if (
        distribution?.["aspects"]?.["dcat-distribution-strings"]?.[
            "last_modified"
        ]
    ) {
        data.last_modified =
            distribution?.["aspects"]?.["dcat-distribution-strings"]?.[
                "last_modified"
            ];
    }*/

    return data;
}

async function createCkanDistributionsFromDataset(
    ckanClient: CkanClient,
    externalUrl: string,
    record: Record
): Promise<PlainObjectType[]> {
    // --- creating resources
    // --- to do: publish resource by id
    if (record?.aspects?.["dataset-distributions"]?.["distributions"].length) {
        const distributions = record?.aspects?.["dataset-distributions"]?.[
            "distributions"
        ] as Record[];
        return await Promise.all(
            distributions.map(item =>
                createDistributionData(ckanClient, externalUrl, record, item)
            )
        );
    } else {
        return [] as PlainObjectType[];
    }
}

async function createCkanPackageDataFromDataset(
    ckanClient: CkanClient,
    externalUrl: string,
    record: Record
) {
    const data = {
        name: await ckanClient.getAvailablePackageName(record.name),
        state: "active",
        title:
            record?.aspects?.["dcat-dataset-strings"]?.["title"] ?? record.name
    } as any;

    if (record?.aspects?.publishing?.state === "draft") {
        data.private = true;
    } else {
        data.private = false;
    }

    const licenseStr =
        record?.aspects?.["dcat-dataset-strings"]?.["defaultLicense"] ??
        record?.aspects?.["dcat-dataset-strings"]?.["license"];

    if (licenseStr) {
        const license = await ckanClient.searchLicense(licenseStr);
        if (license) {
            data.license_id = license.id;
        }
    } else if (
        record?.aspects?.["dataset-distributions"]?.["distributions"].length
    ) {
        let disLicenseList: Record[] =
            record?.aspects?.["dataset-distributions"]?.["distributions"] ?? [];
        if (disLicenseList.length) {
            const disLicenseStrList: string[] = disLicenseList
                .map(
                    item =>
                        item?.aspects?.["dcat-distribution-strings"]?.license
                )
                .filter(item => !!item);
            if (disLicenseList.length) {
                for (let i = 0; i < disLicenseStrList.length; i++) {
                    const license = await ckanClient.searchLicense(
                        disLicenseStrList[i]
                    );
                    if (license) {
                        data.license_id = license.id;
                        break;
                    }
                }
            }
        }
    }

    if (record?.aspects?.["dcat-dataset-strings"]?.["description"]) {
        data.notes = record?.aspects?.["dcat-dataset-strings"]?.["description"];
    }

    data.url = new URI(externalUrl)
        .path(`dataset/${record.id}/details`)
        .toString();

    if (record?.aspects?.["dcat-dataset-strings"]?.["keywords"]) {
        const tagsData =
            record?.aspects?.["dcat-dataset-strings"]?.["keywords"];
        if (typeof tagsData === "string") {
            data.tags = [{ name: tagsData }];
        } else if (tagsData.length) {
            data.tags = (tagsData as string[]).map(name => ({ name }));
        }
    }

    if (record?.aspects?.["dataset-publisher"]?.["publisher"]?.["name"]) {
        const org = await ckanClient.searchAuthorizedOrgByName(
            record?.aspects?.["dataset-publisher"]?.["publisher"]?.["name"],
            "create_dataset"
        );

        if (org) {
            data.owner_org = org.id;
        }
    }

    console.log("creating package data: ", data);

    return data;
}

async function createCkanPackage(
    ckanClient: CkanClient,
    record: Record,
    externalUrl: string
): Promise<string> {
    const data = await createCkanPackageDataFromDataset(
        ckanClient,
        externalUrl,
        record
    );

    const distributions = await createCkanDistributionsFromDataset(
        ckanClient,
        externalUrl,
        record
    );

    if (distributions.length) {
        data.resources = distributions;
    }

    const pkg = await ckanClient.callCkanFunc<PlainObjectType>(
        "package_create",
        data
    );
    const pkgId = pkg.id as string;

    return pkgId;
}

async function updateCkanPackage(
    ckanClient: CkanClient,
    ckanId: string,
    record: Record,
    externalUrl: string
) {
    const data = await createCkanPackageDataFromDataset(
        ckanClient,
        externalUrl,
        record
    );
    const existingData = await ckanClient.getPackage(ckanId);
    const newData = {
        ...existingData,
        ...data
    };

    const distributions = await createCkanDistributionsFromDataset(
        ckanClient,
        externalUrl,
        record
    );

    if (distributions.length) {
        newData.resources = distributions;
    }

    const pkg = await ckanClient.callCkanFunc("package_update", newData);
    return pkg.id;
}

export default async function onRecordFound(
    ckanClient: CkanClient,
    externalUrl: string,
    record: Record,
    registry: AuthorizedRegistryClient
) {
    try {
        const tenantId = record.tenantId;
        const recordData = await registry.getRecord(
            record.id,
            ["dcat-dataset-strings"],
            [
                "ckan-publish",
                "dataset-distributions",
                "temporal-coverage",
                "dataset-publisher",
                "provenance"
            ],
            true
        );

        if (recordData instanceof Error) {
            throw recordData;
        }

        const ckanPublishData = record.aspects["ckan-publish"] as CkanPublishAspectType;
        if (!ckanPublishData) {
            console.log(
                "The dataset record has no ckan-publish aspect. Ignore webhook request."
            );
            return;
        }

        if (!ckanPublishData.publishRequired) {
            console.log(
                `Ignore as no publish is required for dataset ${recordData.id}: `,
                ckanPublishData
            );
            return;
        }

        console.log("Publishing is required for: ", ckanPublishData);

        if (ckanPublishData.status === "withdraw") {
            if (!ckanPublishData.hasCreated || !ckanPublishData.ckanId) {
                return;
            }
            const pkgData = await ckanClient.getPackage(ckanPublishData.ckanId);
            if (pkgData) {
                try {
                    await ckanClient.callCkanFunc("package_delete", {
                        id: ckanPublishData.ckanId
                    });
                } catch (e) {
                    await recordFailCkanPublishAction(
                        recordData.id,
                        tenantId,
                        registry,
                        ckanPublishData,
                        e
                    );
                }
            }

            await recordSuccessCkanPublishAction(
                recordData.id,
                tenantId,
                registry,
                ckanPublishData
            );
        } else if (ckanPublishData.status === "retain") {
            let ckanId: string;
            let error: Error;
            try {
                if (ckanPublishData.hasCreated && ckanPublishData.ckanId) {
                    const pkgData = await ckanClient.getPackage(
                        ckanPublishData.ckanId
                    );
                    if (pkgData) {
                        ckanId = ckanPublishData.ckanId;
                        await updateCkanPackage(
                            ckanClient,
                            ckanId,
                            recordData,
                            externalUrl
                        );
                    } else {
                        ckanId = await createCkanPackage(
                            ckanClient,
                            recordData,
                            externalUrl
                        );
                    }
                } else {
                    ckanId = await createCkanPackage(
                        ckanClient,
                        recordData,
                        externalUrl
                    );
                }
            } catch (e) {
                error = e;
            }

            if (error) {
                await recordFailCkanPublishAction(
                    recordData.id,
                    tenantId,
                    registry,
                    ckanPublishData,
                    error
                );
            } else {
                await recordSuccessCkanPublishAction(
                    recordData.id,
                    tenantId,
                    registry,
                    ckanPublishData,
                    ckanId
                );
            }
        } else {
            throw new Error(`Unknow ckan publish status: ${ckanPublishData.status}`);
        }
    } catch (e) {
        console.error(
            `Error when process event for record ${
                record.id
            }: ${e} \n Record Data: ${JSON.stringify(record)}`
        );
    }
}
