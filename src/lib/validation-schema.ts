import HTTP from "http-status-codes";
import schema from "../schema";
import { codedError } from "./coded-error";

interface JSONSchema {
    $id: string;
    [key: string]: any;
}

/**
 * Validates an object against schema
 *
 * @export
 * @param {string} schemaId ID of the schema schema://```<schemaId>```.json
 * @param {unknown} target Object which should be validated
 * @throws CodedError 400 Validation failed
 * @throws CodedError 500 Unable to validate with the provided parameters
 */

export default function validate(schemaId: string, target: unknown, def = false) {
    const prefix = def ? "default:" : "";
    const fullSchemaURI = `${prefix}schema://${schemaId}.json`;

    const validator = schema.getSchema(fullSchemaURI);

    if (!validator) {
        console.error(`Unable to find the provided "${schemaId}" schema`);
        throw codedError(HTTP.INTERNAL_SERVER_ERROR, "Unable to validate input");
    }

    validator(target);

    if (validator.errors) {
        const errors = validator.errors.map(err =>
            err.keyword === "additionalProperties" ?
                `${err.dataPath.slice(1)} ${err.message} '${Object.values(err.params)[0]}'` :
                `${err.dataPath.slice(1)} ${err.message}`
        );
        throw codedError(HTTP.BAD_REQUEST, `${schemaId} - ${errors.toString()}`);
    }
}
