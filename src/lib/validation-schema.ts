import { NextFunction, Request, Response } from "express";
import HTTP from "http-status-codes";

import schema from "../schema";
import { codedError } from "./coded-error";


/**
 * Validates an object against schema
 *
 * @export
 * @param {string} schemaId ID of the schema schema://```<schemaId>```.json
 * @param {unknown} target Object which should be validated
 * @throws CodedError 400 Validation failed
 * @throws CodedError 500 Unable to validate with the provided parameters
 */

function validate(schemaId: string, target: unknown, def = false) {
    const prefix = def ? "default:" : "";
    const fullSchemaURI = `${prefix}schema://${schemaId}.json`;

    const validator = schema.getSchema(fullSchemaURI);

    if (!validator) /* istanbul ignore next */ { // edge case
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


/**
 * Accepts schemaId which will be used for validation of the HTTP request input (params, body, query)
 *
 * @export
 * @param {string} schemaId ID of the schema schema://```<schemaId>```.json
 * @returns Object containing wrap function which should be used for wrapping around your request handlers
 * and a middleware function which should be used before your request handlers
 */
export function validation(schemaId: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const payload: {} = { ...req.body, ...req.query, ...req.params };
        try {
            validate(schemaId, payload);
        } catch (err) /* istanbul ignore next */ {
            return res.status(err.code || HTTP.INTERNAL_SERVER_ERROR).send(err);
        }
        return next();
    };
}
