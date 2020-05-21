import onRecordFound, { CkanPublishAspectType } from "../onRecordFound";
import { expect } from "chai";
import sinon from "sinon";
import nock from "nock";
import CkanClient from "../CkanClient";
import _ from "lodash";
const partial = require("lodash/partial");

import { AuthorizedRegistryClient } from "@magda/minion-sdk";
const CKAN_SERVER_URL = 'http://test.demo.ckan.org'
const CKAN_API_KEY = '2fbecb5d-dc63-45db-9a90-32a6c4a49e73';
const USER_ID = "b1fddd6f-e230-4068-bd2c-1a21844f1598";
const ckanClient = new CkanClient(CKAN_SERVER_URL, CKAN_API_KEY);
const EXTERNAL_URL = 'minikube.data.gov.au'

const curriedOnRecordFound = partial(onRecordFound, ckanClient, EXTERNAL_URL);

const registryUrl = "http://example.com";
const registry = new AuthorizedRegistryClient({
    baseUrl: registryUrl,
    jwtSecret: "squirrelsquirrelsquirrelsquirrel4s",
    userId: USER_ID,
    tenantId: 1
});

// Response, test data, etc

const ckanLicenseList = [
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"not reviewed",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"License not specified",
        "url":"",
        "is_generic":"True",
        "is_okd_compliant":false,
        "is_osi_compliant":false,
        "domain_content":"False",
        "domain_software":"False",
        "id":"notspecified"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"True",
        "title":"Open Data Commons Public Domain Dedication and License (PDDL)",
        "url":"http://www.opendefinition.org/licenses/odc-pddl",
        "is_generic":"False",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"False",
        "domain_software":"False",
        "id":"odc-pddl"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"True",
        "title":"Open Data Commons Open Database License (ODbL)",
        "url":"http://www.opendefinition.org/licenses/odc-odbl",
        "is_generic":"False",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"False",
        "domain_software":"False",
        "id":"odc-odbl"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"True",
        "title":"Open Data Commons Attribution License",
        "url":"http://www.opendefinition.org/licenses/odc-by",
        "is_generic":"False",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"False",
        "domain_software":"False",
        "id":"odc-by"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"True",
        "title":"Creative Commons CCZero",
        "url":"http://www.opendefinition.org/licenses/cc-zero",
        "is_generic":"False",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"True",
        "domain_software":"False",
        "id":"cc-zero"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"Creative Commons Attribution",
        "url":"http://www.opendefinition.org/licenses/cc-by",
        "is_generic":"False",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"False",
        "domain_software":"False",
        "id":"cc-by"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"Creative Commons Attribution Share-Alike",
        "url":"http://www.opendefinition.org/licenses/cc-by-sa",
        "is_generic":"False",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"True",
        "domain_software":"False",
        "id":"cc-by-sa"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"GNU Free Documentation License",
        "url":"http://www.opendefinition.org/licenses/gfdl",
        "is_generic":"False",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"True",
        "domain_software":"False",
        "id":"gfdl"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"Other (Open)",
        "url":"",
        "is_generic":"True",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"True",
        "domain_software":"False",
        "id":"other-open"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"Other (Public Domain)",
        "url":"",
        "is_generic":"True",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"True",
        "domain_software":"False",
        "id":"other-pd"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"Other (Attribution)",
        "url":"",
        "is_generic":"True",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"True",
        "domain_software":"False",
        "id":"other-at"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"approved",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"UK Open Government Licence (OGL)",
        "url":"http://reference.data.gov.uk/id/open-government-licence",
        "is_generic":"False",
        "is_okd_compliant":true,
        "is_osi_compliant":false,
        "domain_content":"True",
        "domain_software":"False",
        "id":"uk-ogl"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"not reviewed",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"Creative Commons Non-Commercial (Any)",
        "url":"http://creativecommons.org/licenses/by-nc/2.0/",
        "is_generic":"False",
        "is_okd_compliant":false,
        "is_osi_compliant":false,
        "domain_content":"False",
        "domain_software":"False",
        "id":"cc-nc"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"not reviewed",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"Other (Non-Commercial)",
        "url":"",
        "is_generic":"True",
        "is_okd_compliant":false,
        "is_osi_compliant":false,
        "domain_content":"False",
        "domain_software":"False",
        "id":"other-nc"
    },
    {
        "status":"active",
        "maintainer":"",
        "od_conformance":"not reviewed",
        "family":"",
        "osd_conformance":"not reviewed",
        "domain_data":"False",
        "title":"Other (Not Open)",
        "url":"",
        "is_generic":"True",
        "is_okd_compliant":false,
        "is_osi_compliant":false,
        "domain_content":"False",
        "domain_software":"False",
        "id":"other-closed"
    },
]

const tokenCkanResponse: any = {
    "license_title":null,
    "maintainer":null,
    "relationships_as_object":[

    ],
    "private":false,
    "maintainer_email":null,
    "num_tags":2,
    "id":"a6afbd27-189b-4cd1-b58f-7810b1f7d3d8",
    "metadata_created":"2020-05-18T03:46:02.968709",
    "metadata_modified":"2020-05-18T03:46:02.968717",
    "author":null,
    "author_email":null,
    "state":"active",
    "version":null,
    "creator_user_id":"6e9f8ca8-ac67-45bb-a490-6dfde530a402",
    "type":"dataset",
    "resources":[
        [
            "Object"
        ]
    ],
    "num_resources":1,
    "tags":[
        [
            "Object"
        ],
        [
            "Object"
        ]
    ],
    "groups":[],
    "license_id":null,
    "relationships_as_subject":[

    ],
    "organization":null,
    "name":"mars-bar",
    "isopen":false,
    "url":"http://minikube.data.gov.au:30100/dataset/magda-ds-accf9508-3fc2-43c6-8620-dceab761c000/details",
    "notes":"A good dataset description clearly and succinctly explains the contents, purpose and value of the dataset. This is how users primarily identify and select your dataset from others. Here you can also include information that you have not already covered in the metadata.",
    "owner_org":null,
    "extras":[

    ],
    "title":"Mars Bar",
    "revision_id":"27f80eef-f11f-4487-bb32-fceff5a88776"
}

function createCkanResp (data: any, success = true) {
    return {
        success,
        result: data,
    }
}

tokenCkanResponse;

const testRecord = {
    aspects:{
        "ckan-publish":{
            hasCreated: false,
            publishAttempted: false,
            publishRequired: true,
            status: "retain"
        },
        "dcat-dataset-strings":{
            accrualPeriodicity: "asNeeded",
            defaultLicense: "world",
            description: "A good dataset description clearly and succinctly explains the contents, purpose and value of the dataset. This is how users primarily identify and select your dataset from others. Here you can also include information that you have not already covered in the metadata.",
            keywords: ["Sit", "outside", "your", "door"],
            languages:["English"],
            modified:"2020-01-20T01:21:23.724Z",
            publisher:"Org",
            themes:["t", "h", "e", "m", "e"],
            title:"Mars Bar"
        },
        "temporal-coverage":{
            "intervals":[
                "2020-01-10T01:21:23.724Z",
                "2020-01-20T01:21:23.724Z",
            ]
        },
        "dataset-publisher":{
            publisher:["not sure what this is"]
        },
        provenance:{
            mechanism:"Briefly describe the methodology of producing this dataset or any other information that might assist consumers of the dataset.\n",
            sourceSystem:"For example, internal systems, external sources, etc.\n"
        },
        "dataset-distributions":{
            "distributions":["Array"]
        }
    },
    id: "ckan-publish-create-pkg-test-success",
    name: "Mars Bar",
    tenantId: 0
}

describe("Magda ckan-publisher minion", function(this: Mocha.ISuiteCallbackContext) {
    this.timeout(10000);
    nock.disableNetConnect();
    let registryScope: nock.Scope;
    let ckanScope: nock.Scope;

    before(() => {
        sinon.stub(console, "info");
    });
    
    after(() => {
        (console.info as any).restore();
    });
    
    beforeEach(() => {
        registryScope = nock(registryUrl);
        ckanScope = nock(CKAN_SERVER_URL, {reqheaders: { authorization: CKAN_API_KEY}})
            .persist();
    });

    afterEach(() => {
        registryScope.done();
        ckanScope.done();
        nock.cleanAll();
    });

    describe("Creating a CKAN package", () => {
        it("Successful creation", async () => {
            // If all the mocks are satisfied,
            // we can assume a successful creation of a ckan package
            registryScope
                .get("/records/ckan-publish-create-pkg-test-success")
                .query({
                    "aspect": "dcat-dataset-strings",
                    "dereference": true,
                    "optionalAspect": [
                        "ckan-publish", "dataset-distributions", "temporal-coverage", "dataset-publisher", "provenance"
                    ],
                })
                .reply(200, testRecord);
            registryScope
                .put("/records/ckan-publish-create-pkg-test-success/aspects/ckan-publish")
                .reply(200);
            ckanScope
                .post("/api/3/action/package_show")
                .reply(200, {success: true, result: "yes"});
            ckanScope
                .post("/api/3/action/license_list")
                .reply(200, createCkanResp(ckanLicenseList));
            ckanScope
                .post("/api/3/action/package_create")
                .reply(200, createCkanResp(tokenCkanResponse));

            await curriedOnRecordFound(testRecord, registry);
        })
    });

    describe("Updating a CKAN package", () => {
        it("Successful update", async () => {
            // If all the mocks are satisfied,
            // we can assume a successful creation of a ckan package
            const newCkanPublishAspect: CkanPublishAspectType = {
                hasCreated: true,
                publishAttempted: true,
                publishRequired: true,
                status: "retain",
                ckanId: "0",
            };
            var newTestRecord = testRecord;
            newTestRecord.aspects["ckan-publish"] = newCkanPublishAspect;
            newTestRecord.id = "ckan-publish-update-pkg-test-success"

            registryScope
                .get("/records/ckan-publish-update-pkg-test-success")
                .query({
                    "aspect": "dcat-dataset-strings",
                    "dereference": true,
                    "optionalAspect": [
                        "ckan-publish", "dataset-distributions", "temporal-coverage", "dataset-publisher", "provenance"
                    ],
                })
                .reply(200, newTestRecord);
            registryScope
                .put("/records/ckan-publish-update-pkg-test-success/aspects/ckan-publish")
                .reply(200);
            ckanScope
                .post("/api/3/action/package_show")
                .reply(200, {success: true, result: "yes"});
            ckanScope
                .post("/api/3/action/license_list")
                .reply(200, createCkanResp(ckanLicenseList));
            ckanScope
                .post("/api/3/action/package_update")
                .reply(200, createCkanResp(tokenCkanResponse));

            await curriedOnRecordFound(newTestRecord, registry);
        })
    });

    describe("Deleting a CKAN package", () => {
        it.only("Successful deletion", async () => {
            // If all the mocks are satisfied,
            // we can assume a successful creation of a ckan package

            const newCkanPublishAspect: CkanPublishAspectType = {
                hasCreated: true,
                publishAttempted: true,
                publishRequired: true,
                status: "withdraw",
                ckanId: "0",
            };
            var newTestRecord = testRecord;
            newTestRecord.aspects["ckan-publish"] = newCkanPublishAspect;
            newTestRecord.id = "ckan-publish-delete-pkg-test-success"

            registryScope
                .get("/records/ckan-publish-delete-pkg-test-success")
                .query({
                    "aspect": "dcat-dataset-strings",
                    "dereference": true,
                    "optionalAspect": [
                        "ckan-publish", "dataset-distributions", "temporal-coverage", "dataset-publisher", "provenance"
                    ],
                })
                .reply(200, newTestRecord);
            registryScope
                .put("/records/ckan-publish-delete-pkg-test-success/aspects/ckan-publish")
                .reply(200);
            ckanScope
                .post("/api/3/action/package_show")
                .reply(200, {success: true, result: "yes"});
            ckanScope.post("/api/3/action/package_delete")
                .reply(200, createCkanResp(tokenCkanResponse));

            await curriedOnRecordFound(newTestRecord, registry);
        })
    });
});
