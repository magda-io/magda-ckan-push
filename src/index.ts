import minion, { commonYargs } from "@magda/minion-sdk";
import ckanExportAspectDef from "./ckanExportAspectDef";
import onRecordFound, { CkanServerApiKeyMap } from "./onRecordFound";

const partial = require("lodash/partial");

const ID = "minion-ckan-exporter";
const coerceJson = (path?: string) => path && require(path);

const argv = commonYargs(6122, "http://localhost:6122", argv =>
    argv
        .option("ckanServerKeyMap", {
            describe: "JSON File that contains CKAN server url to CKAN Api key mapping",
            type: "string",
            required: true,
            coerce: coerceJson
        })
        .option("externalUrl", {
            describe:
                "the magda web ui external access URL. Used for generating dataset source url",
            type: "string",
            default:
                process.env.EXTERNAL_URL ||
                process.env.npm_package_config_externalUrl
        })
);

const ckanClient = new CkanClient(argv.ckanServerUrl, argv.defaultCkanAPIKey);
minion({
    argv,
    id: ID,
    aspects: ["ckan-export"],
    optionalAspects: [],
    writeAspectDefs: [ckanExportAspectDef],
    onRecordFound: partial(onRecordFound, argv.externalUrl, ckanServerApiKeyMap as CkanServerApiKeyMap)
}).catch(e => {
    console.error("Error: " + e.message, e);
    process.exit(1);
});
