import onRecordFound from "../onRecordFound";
import {} from "mocha";
import sinon from "sinon";
import nock from "nock";
// import ckanPublishAspectDef from "./ckanPublishAspectDef";
import CkanClient from "../CkanClient";
import _ from "lodash";
const partial = require("lodash/partial");

import { AuthorizedRegistryClient } from "@magda/minion-sdk";
const CKAN_SERVER_URL = 'demo.ckan.org'
const CKAN_API_KEY = '2fbecb5d-dc63-45db-9a90-32a6c4a49e73';
const USER_ID = "b1fddd6f-e230-4068-bd2c-1a21844f1598";
const ckanClient = new CkanClient(CKAN_SERVER_URL, CKAN_API_KEY);
const EXTERNAL_URL = 'minikube.data.gov.au:301000'

const registryUrl = "http://example.com";
const registry = new AuthorizedRegistryClient({
    baseUrl: registryUrl,
    jwtSecret: "squirrelsquirrelsquirrelsquirrel4s",
    userId: USER_ID,
    tenantId: 1
});

const curriedOnRecordFound = partial(onRecordFound, ckanClient, EXTERNAL_URL);

const testRecord = {
    aspects:{
        "ckan-publish":{
            hasCreated: false,
            publishAttempted: false,
            publishRequired: false,
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
    // this.timeout(10000);
    // nock.disableNetConnect();
    let registryScope: nock.Scope;

    before(() => {
        sinon.stub(console, "info");
    });

    after(() => {
        (console.info as any).restore();
    });

    // beforeEach(() => {
    //     console.log("registryScope is: ", registryScope);
    //     registryScope = nock(registryUrl);
    // });

    // afterEach(() => {
    //     registryScope.done();
    //     nock.cleanAll();
    // });


    describe("Creating a CKAN package", () => {
        // const record = buildRecordWithDist();
        registryScope = nock(registryUrl);
        // console.log("registryScope is: ", registryScope);
        it("curried record", () => {
            registryScope
            .get("/records/ckan-publish-create-pkg-test-success")
            .reply(200, testRecord);
            return curriedOnRecordFound(testRecord, registry);
        })
    });

    // describe("licenses", () => {
    //     describe("endorsed by OKFN should get 1 star:", () => {
    //         OKFN_LICENSES.forEach((license: string) => {
    //             it(license, () => {
    //                 const record = buildRecordWithDist({ license });

    //                 expectStarCount({ record, starCount: 1 });

    //                 return onRecordFound(record, registry);
    //             });
    //         });
    //     });

    //     it("should give fuzzily generated open licenses a star", () => {
    //         return runPropertyTest({
    //             licenseArb: openLicenseArb,
    //             formatArb: jsc.constant(undefined),
    //             beforeTest: (record: Record) => {
    //                 expectStarCount({ record, starCount: 1 });
    //             }
    //         });
    //     });

    //     it("should give distribtuions with a broken source-link 0 stars", () => {
    //         return runPropertyTest({
    //             recordArb: jsc.suchthat(
    //                 recordArbWithDistArbs(
    //                     {
    //                         license: jsc.oneof([
    //                             openLicenseArb,
    //                             jsc.oneof(
    //                                 ZERO_STAR_LICENSES.map(lic =>
    //                                     jsc.constant(lic)
    //                                 )
    //                             )
    //                         ]),
    //                         format: jsc.oneof([
    //                             formatArb(0),
    //                             formatArb(1),
    //                             formatArb(2),
    //                             formatArb(3),
    //                             formatArb(4)
    //                         ])
    //                     },
    //                     {
    //                         status: jsc.constant("broken")
    //                     },
    //                     {
    //                         format: jsc.oneof([
    //                             formatArb(0),
    //                             formatArb(1),
    //                             formatArb(2),
    //                             formatArb(3),
    //                             formatArb(4)
    //                         ])
    //                     }
    //                 ),
    //                 record =>
    //                     record.aspects["dataset-distributions"].distributions
    //                         .length > 0
    //             ),
    //             beforeTest: (record: Record) => {
    //                 expectStarCount({ record, starCount: 0 });
    //             }
    //         });
    //     });

    //     it("should give distribtuions with a active source-link > 0 stars", () => {
    //         return runPropertyTest({
    //             recordArb: jsc.suchthat(
    //                 recordArbWithDistArbs(
    //                     {
    //                         license: openLicenseArb,
    //                         format: jsc.oneof([
    //                             formatArb(1),
    //                             formatArb(2),
    //                             formatArb(3),
    //                             formatArb(4)
    //                         ])
    //                     },
    //                     {
    //                         status: jsc.constant("active")
    //                     },
    //                     {
    //                         format: jsc.oneof([
    //                             formatArb(1),
    //                             formatArb(2),
    //                             formatArb(3),
    //                             formatArb(4)
    //                         ])
    //                     }
    //                 ),
    //                 record =>
    //                     record.aspects["dataset-distributions"].distributions
    //                         .length > 0
    //             ),
    //             beforeTest: (record: Record) => {
    //                 expectStarCount({ record, starCountFn: num => num > 0 });
    //             }
    //         });
    //     });

    //     describe(`should give 0 stars to datasets with non-open license`, () => {
    //         ZERO_STAR_LICENSES.forEach(license => {
    //             it(`${license}`, () => {
    //                 const record = buildRecordWithDist({ license });

    //                 expectStarCount({ record, starCount: 0 });

    //                 return onRecordFound(record, registry);
    //             });
    //         });
    //     });
    // });

    // describe("formats", () => {
    //     for (let starCount = 2; starCount <= 4; starCount++) {
    //         describe(`should set ${starCount} stars`, () => {
    //             FORMAT_EXAMPLES[starCount].forEach(format => {
    //                 it(`for ${format}`, () => {
    //                     const record = buildRecordWithDist({
    //                         format,
    //                         license: OKFN_LICENSES[0]
    //                     });

    //                     expectStarCount({ record, starCount });

    //                     return onRecordFound(record, registry);
    //                 });
    //             });

    //             const formatArbForStarCount = formatArb(starCount);
    //             const sample = jsc.sampler(formatArbForStarCount)(1);
    //             it(`for fuzzily generated ${starCount} star formats, e.g. "${sample}"`, () => {
    //                 return runPropertyTest({
    //                     licenseArb: openLicenseArb,
    //                     formatArb: formatArbForStarCount,
    //                     beforeTest: (record: Record) => {
    //                         expectStarCount({ record, starCount });
    //                     }
    //                 });
    //             });
    //         });
    //     }
    // });

    // it(`if there's an equivalent format in dcat-distribution-strings and dataset format, the star rating should be the same whether the dataset-format aspect is defined or undefined`, () => {
    //     const recordArb = jsc.suchthat(
    //         recordArbWithDistArbs(),
    //         record =>
    //             record.aspects["dataset-distributions"].distributions.length > 0
    //     );

    //     return jsc.assert(
    //         jsc.forall(recordArb, (record: Record) => {
    //             const distsWithoutFormatAspect = record.aspects[
    //                 "dataset-distributions"
    //             ].distributions.map((dist: any) => {
    //                 const newDist = { ...dist };
    //                 newDist.aspects["dataset-format"] = undefined;
    //                 return newDist;
    //             });

    //             const recordWithoutFormatAspect = {
    //                 ...record,
    //                 id: record.id + "not"
    //             };
    //             recordWithoutFormatAspect.aspects[
    //                 "dataset-distributions"
    //             ].distributions = distsWithoutFormatAspect;

    //             let starCount1: number, starCount2: number;

    //             expectStarCount({
    //                 record,
    //                 starCountFn: num => {
    //                     starCount1 = num;
    //                     return true;
    //                 }
    //             });
    //             expectStarCount({
    //                 record: recordWithoutFormatAspect,
    //                 starCountFn: num => {
    //                     starCount2 = num;
    //                     return true;
    //                 }
    //             });

    //             const bothResults = Promise.all([
    //                 onRecordFound(record, registry),
    //                 onRecordFound(recordWithoutFormatAspect, registry)
    //             ]);

    //             return bothResults
    //                 .then(() => {
    //                     afterEachProperty();

    //                     return starCount1 === starCount2;
    //                 })
    //                 .catch((e: Error) => {
    //                     afterEachProperty();
    //                     throw e;
    //                 });
    //         })
    //     );
    // });

    // it(`If format is in dcat-distribution-strings, dataset-format takes precedence`, () => {
    //     const starNumberArb = jsc.oneof([1, 2, 3, 4].map(x => jsc.constant(x)));

    //     const starsArb = jsc.record({
    //         distStrings: starNumberArb,
    //         formatAspect: starNumberArb
    //     });

    //     const everythingArb = arbFlatMap(
    //         starsArb,
    //         starsObj => {
    //             const thisRecordArb = jsc.suchthat(
    //                 recordArbWithDistArbs(
    //                     {
    //                         license: openLicenseArb,
    //                         format: formatArb(starsObj.distStrings)
    //                     },
    //                     undefined,
    //                     {
    //                         format: formatArb(starsObj.formatAspect)
    //                     }
    //                 ),
    //                 record =>
    //                     record.aspects["dataset-distributions"].distributions
    //                         .length > 0
    //             );

    //             return jsc.record({
    //                 record: thisRecordArb,
    //                 numbers: jsc.constant(starsObj)
    //             });
    //         },
    //         x => x.numbers
    //     );

    //     return jsc.assert(
    //         jsc.forall(everythingArb, everything => {
    //             expectStarCount({
    //                 record: everything.record,
    //                 starCount: everything.numbers.formatAspect
    //             });

    //             return onRecordFound(everything.record, registry)
    //                 .then(() => {
    //                     afterEachProperty();
    //                     return true;
    //                 })
    //                 .catch(e => {
    //                     afterEachProperty();
    //                     throw e;
    //                 });
    //         })
    //     );
    // });

    // describe("should always record the result of the best distribution", () => {
    //     for (
    //         let highestStarCount = 0;
    //         highestStarCount <= 4;
    //         highestStarCount++
    //     ) {
    //         it(`when highest star count is ${highestStarCount}`, () => {
    //             return jsc.assert(
    //                 jsc.forall(
    //                     recordForHighestStarCountArb(highestStarCount),
    //                     (record: Record) => {
    //                         beforeEachProperty();

    //                         expectStarCount({
    //                             record,
    //                             starCount: highestStarCount
    //                         });

    //                         return onRecordFound(record, registry)
    //                             .then(() => {
    //                                 afterEachProperty();
    //                                 return true;
    //                             })
    //                             .catch(e => {
    //                                 afterEachProperty();
    //                                 throw e;
    //                             });
    //                     }
    //                 )
    //             );
    //         });
    //     }
    // });

    // function runPropertyTest({
    //     licenseArb = openLicenseArb,
    //     formatArb = stringArb,
    //     recordArb = jsc.suchthat(
    //         recordArbWithDistArbs(
    //             {
    //                 license: licenseArb,
    //                 format: formatArb
    //             },
    //             undefined,
    //             {
    //                 format: formatArb
    //             }
    //         ),
    //         record =>
    //             record.aspects["dataset-distributions"].distributions.length > 0
    //     ),
    //     beforeTest = () => {},
    //     afterTest = () => {}
    // }: {
    //     licenseArb?: jsc.Arbitrary<string>;
    //     formatArb?: jsc.Arbitrary<string>;
    //     recordArb?: jsc.Arbitrary<Record>;
    //     beforeTest?: (record: Record) => void;
    //     afterTest?: () => void;
    //     testCount?: number;
    // }) {
    //     return jsc.assert(
    //         jsc.forall(recordArb, (record: Record) => {
    //             beforeEachProperty();

    //             beforeTest(record);

    //             return onRecordFound(record, registry)
    //                 .then(() => {
    //                     afterEachProperty();
    //                     afterTest();
    //                     return true;
    //                 })
    //                 .catch(e => {
    //                     afterEachProperty();
    //                     throw e;
    //                 });
    //         })
    //     );
    // }

    // type StarCountArgs = {
    //     record: Record;
    //     starCount?: number;
    //     starCountFn?: (num: number) => boolean;
    // };

    // function expectStarCount({
    //     record,
    //     starCount,
    //     starCountFn = x => x === starCount
    // }: StarCountArgs) {
    //     if (!starCount && !starCountFn) {
    //         throw new Error("Must provide starCount or starCountFn");
    //     }

    //     registryScope
    //         .put(
    //             `/records/${encodeURIComponentWithApost(
    //                 record.id
    //             )}/aspects/dataset-linked-data-rating`,
    //             (obj: any) => starCountFn(obj.stars)
    //         )
    //         .reply(201);

    //     registryScope
    //         .put(
    //             `/records/${encodeURIComponentWithApost(
    //                 record.id
    //             )}/aspects/dataset-quality-rating`,
    //             (obj: any) =>
    //                 starCountFn(obj["dataset-linked-data-rating"].score * 5)
    //         )
    //         .reply(201);
    // }

    // function buildRecordWithDist(dist?: any): any {
    //     return {
    //         id: "1",
    //         name: "name",
    //         aspects: {
    //             "dataset-distributions": {
    //                 distributions: _.isUndefined(dist)
    //                     ? []
    //                     : [
    //                           {
    //                               aspects: {
    //                                   "dcat-distribution-strings": dist
    //                               }
    //                           }
    //                       ]
    //             }
    //         },
    //         sourceTag: undefined,
    //         tenantId: 0
    //     };
    // }
});
