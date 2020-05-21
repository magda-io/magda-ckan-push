import {
    AuthorizedRegistryClient,
    Record
} from "@magda/minion-sdk";
import CkanClient from "./CkanClient";
import ckanExportAspectDef from "./ckanExportAspectDef";
import URI from "urijs";
// const _ = require("lodash");

interface PlainObjectType {
    [key: string]: any;
}

export interface CkanExportAspectType {
    status: "retain" | "withdraw";
    exportUserId?: string;
    ckanId?: string;
    hasCreated: boolean;
    exportRequired: boolean;
    exportAttempted: boolean;
    lastExportAttemptTime?: string;
    exportError?: string;
}

async function recordSuccessCkanExportAction(
    recordId: string,
    tenantId: number,
    registry: AuthorizedRegistryClient,
    ckanExportData: CkanExportAspectType,
    ckanId?: string
) {
    console.log("Recording successful export");
    const data: CkanExportAspectType = {
        ...ckanExportData,
        exportRequired: false,
        exportAttempted: true,
        lastExportAttemptTime: new Date().toISOString(),
        exportError: ""
    };
    if (ckanId) {
        data.ckanId = ckanId;
        data.hasCreated = true;
    } else {
        data.ckanId = undefined;
        data.hasCreated = false;
    }
    // console.log("Here is the data that I'm putting in the record-aspects table: ", data);
    const res = await registry.putRecordAspect(
        recordId,
        ckanExportAspectDef.id,
        data,
        tenantId
    );
    // console.log("Here is the result: ", res);
    if (res instanceof Error) {
        throw Error;
    }
}

async function recordFailCkanExportAction(
    recordId: string,
    tenantId: number,
    registry: AuthorizedRegistryClient,
    ckanExportData: CkanExportAspectType,
    error: Error | string
) {
    const data: CkanExportAspectType = {
        ...ckanExportData,
        exportAttempted: true,
        lastExportAttemptTime: new Date().toISOString(),
        exportError: `${error}`
    };
    const res = await registry.putRecordAspect(
        recordId,
        ckanExportAspectDef.id,
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
    // --- to do: export resource by id
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

    return data;
}

async function createCkanPackage(
    ckanClient: CkanClient,
    record: Record,
    externalUrl: string
): Promise<string> {
    console.log("Creating ckan package from dataset...")
    const data = await createCkanPackageDataFromDataset(
        ckanClient,
        externalUrl,
        record
    );

    // console.log("Done! Here is the data: ", data)
    console.log("Now creating ckan distribution from dataset...")
    const distributions = await createCkanDistributionsFromDataset(
        ckanClient,
        externalUrl,
        record
    );
    // console.log("Done! Here are the distributions: ", distributions);

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
    console.log("\nstarting onRecordFound")
    try {
        const tenantId = record.tenantId;
        const recordData = await registry.getRecord(
            record.id,
            ["dcat-dataset-strings"],
            [
                "ckan-export",
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

        const ckanExportData = record.aspects["ckan-export"] as CkanExportAspectType;
        if (!ckanExportData) {
            console.log(
                "The dataset record has no ckan-export aspect. Ignore webhook request."
            );
            return;
        }

        if (!ckanExportData.exportRequired) {
            console.log(
                `Ignore as no export is required for dataset id ${recordData.id} and name ${recordData.name}. ckanExportData `,
                ckanExportData
            );
            return;
        }

        // console.log("Exporting is required. ckanExportData: ", ckanExportData);

        if (ckanExportData.status === "withdraw") {
            console.log("withdrawing this.");
            if (!ckanExportData.hasCreated || !ckanExportData.ckanId) {
                console.log("good news. it's not been created. or it doesn't have a ckanId. either way, nothing to do here.");
                return;
            }
            const pkgData = await ckanClient.getPackage(ckanExportData.ckanId);
            // console.log("withdrawing package. pkgData: ", pkgData);
            if (pkgData) {
                try {
                    await ckanClient.callCkanFunc("package_delete", {
                        id: ckanExportData.ckanId
                    });
                } catch (e) {
                    await recordFailCkanExportAction(
                        recordData.id,
                        tenantId,
                        registry,
                        ckanExportData,
                        e
                    );
                }
            }

            await recordSuccessCkanExportAction(
                recordData.id,
                tenantId,
                registry,
                ckanExportData
            );
        } else if (ckanExportData.status === "retain") {
            let ckanId: string;
            let error: Error;
            // console.log("Retaining record ", record.name)
            try {
                if (ckanExportData.hasCreated && ckanExportData.ckanId) {
                    console.log("it's been created and has an id")
                    const pkgData = await ckanClient.getPackage(
                        ckanExportData.ckanId
                    );
                    // console.log("here is the pkgData: ", pkgData);
                    if (pkgData) {
                        console.log("updating ckan package")
                        ckanId = ckanExportData.ckanId;
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
                    console.log("package never existed. starting from scratch");
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
                console.log("Error while exporting: ", error)
                await recordFailCkanExportAction(
                    recordData.id,
                    tenantId,
                    registry,
                    ckanExportData,
                    error
                );
            } else {
                console.log("success while exporting")
                await recordSuccessCkanExportAction(
                    recordData.id,
                    tenantId,
                    registry,
                    ckanExportData,
                    ckanId
                );
            }
        } else {
            // Shouldn't get here
            throw new Error(`Unknow ckan export status: ${ckanExportData.status}`);
        }
    } catch (e) {
        console.error(
            `Error occured when processing event for record ${
                record.id
            }: ${e}`
            // \n Record Data: ${JSON.stringify(record)}`
        );
    }
}
