import minion, { commonYargs } from "@magda/minion-sdk";
import ckanPublishAspectDef from "./ckanPublishAspectDef";
import onRecordFound from "./onRecordFound";
import CkanClient from "./CkanClient";

const partial = require("lodash/partial");

const ID = "minion-ckan-publish";
const argv = commonYargs(6122, "http://localhost:6122", argv =>
    argv
        .option("ckanServerUrl", {
            describe: "the ckan server URL",
            type: "string",
            default:
                process.env.CKAN_SERVER_URL ||
                process.env.npm_package_config_ckanServerUrl
        })
        .option("defaultCkanAPIKey", {
            describe:
                "the default ckan server API key used if publish request users don't have a ckan account",
            type: "string",
            default:
                process.env.CKAN_DEFAULT_API_KEY ||
                process.env.npm_package_config_ckanAPIKey
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
    aspects: ["ckan-publish"],
    optionalAspects: [],
    writeAspectDefs: [ckanPublishAspectDef],
    onRecordFound: partial(onRecordFound, ckanClient, argv.externalUrl)
}).catch(e => {
    console.error("Error: " + e.message, e);
    process.exit(1);
});
