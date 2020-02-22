import * as fs from "fs";
import * as path from "path";

import Ajv from "ajv";

const ajv = new Ajv({
    allErrors: true,
    format: "full",
    useDefaults: true,
    jsonPointers: true
});
console.debug("Initializing schema");

const schemaDir = path.join(__dirname, "../../schema");

console.debug("Adding definitions");

// read the schema directory
const allFileNames = fs.readdirSync(schemaDir);

// Here all the files will be indexed and cached to ajv
// and then they can be used by reference (id)
allFileNames.filter(fileName => fileName.endsWith(".json")).forEach(schemaFileName => {
    console.debug(`Adding schema file ${schemaFileName} to ajv`);
    const file = require(`${schemaDir}/${schemaFileName}`);
    ajv.addSchema(file, file.$id);

    // Add second set of schema for each one we have defined
    // The second schema is basically Partial<T>
    // we utilize the default property, and are making everything optional
    const optionalSchema = JSON.parse(JSON.stringify(file));
    optionalSchema.$id = `default:${optionalSchema.$id}`;
    delete optionalSchema.required;
    ajv.addSchema(optionalSchema, optionalSchema.$id);
});

// THE ajv instance is exported
// so that can be used and not instantiated everywhere
// because it has cached the compiled javascript validation function
export default ajv;
