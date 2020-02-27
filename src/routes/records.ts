import { json as parseJSON } from "body-parser";
import express from "express";
import * as errorHandler from "../lib/async-response-handler";

const app = express();

/**
 * Creates a record
 */
app.post(
    "/",
    parseJSON(),
    errorHandler.wrap(req => {
        return { done: true };
    })
);

/**
 * Get a record
 */
app.get(
    "/:id",
    errorHandler.wrap(req => {
        const { id } = req.params;
        return { done: true };
    })
);

/**
 * Update a record
 */
app.put(
    "/:id",
    errorHandler.wrap(req => {
        const { id } = req.params;
        return { done: true };
    })
);

/**
 * Delete a record
 */
app.delete(
    "/:id",
    errorHandler.wrap(req => {
        const { id } = req.params;
        return { done: true };
    })
);

export const route = app;
