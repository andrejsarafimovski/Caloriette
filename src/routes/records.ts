import { json as parseJSON } from "body-parser";
import express from "express";

import * as errorHandler from "../lib/async-response-handler";
import { validation } from "../lib/validation-schema";
import { RecordManager } from "../models/records-manager";

const app = express();

/**
 * Creates a record
 */
app.post(
    "/",
    parseJSON(),
    validation("createRecordRequest").middleware,
    errorHandler.wrap(req => {
        const { body } = req;
        return new RecordManager().create(body);
    })
);

/**
 * Get a record
 */
app.get(
    "/:id",
    validation("getRecordRequest").middleware,
    errorHandler.wrap(req => {
        const { id } = req.params;
        return new RecordManager().get(id);
    })
);

/**
 * Update a record
 */
app.put(
    "/:id",
    validation("updateRecordRequest").middleware,
    errorHandler.wrap(req => {
        const { id } = req.params;
        const { body } = req.body;
        return new RecordManager().update(id, body);
    })
);

/**
 * Delete a record
 */
app.delete(
    "/:id",
    validation("deleteRecordRequest").middleware,
    errorHandler.wrap(req => {
        const { id } = req.params;
        return new RecordManager().delete(id);
    })
);

export const route = app;
