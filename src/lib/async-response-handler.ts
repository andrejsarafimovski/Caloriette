import { Request, Response } from "express";
import HTTP from "http-status-codes";

import { CodedError } from "./coded-error";

/**
 * Wraps a request handler or middleware in a way that should ensure that any errors are propagated correctly to the caller.
 * @param handler the handler to wrap. Must return a promise.
 * @return {Function} the wrapped handler function.
 */
export function wrap(handler: (req: Request, res: Response) => any): (req: Request, res: Response) => Promise<any> {
    return async (req: Request, res: Response) => {
        try {
            try {
                let result = await handler(req, res);
                if (!result) { result = { done: true }; }
                const responseBody = JSON.stringify(result) || "";
                res.set({
                    "Content-Type": "application/json",
                    "Content-Length": responseBody.length
                });
                res.status(HTTP.OK);
                return res.send(result);
            } catch (err) {
                return getErrorHandler(res);
            }
        } catch (err) {
            return Promise.reject(err);
        }
    };
}

/**
 * Generates an error handler for a response.
 * @param res the response to use to propagate the error.
 * @return {Function} the error handler function.
 */
function getErrorHandler(res: Response) {
    return (err: CodedError) => {
        let code = parseInt((err as any).statusCode || err.code);
        if (typeof code !== "number" || isNaN(code)) {

            code = HTTP.INTERNAL_SERVER_ERROR;
            // tslint:disable-next-line:no-console
            console.error([
                "Unexpected error thrown",
                "Code 500",
                `Message ${err.message}`,
                `Stack ${err.stack}`,
                `Raw ${err}`,
            ].join("\n"));
        }
        res.status(code);
        res.send(err);
    };
}
