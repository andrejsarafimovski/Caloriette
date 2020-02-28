import { json as parseJSON } from "body-parser";
import express from "express";

import * as errorHandler from "../lib/async-response-handler";
import { authorize } from "../lib/authorization";
import { validation } from "../lib/validation-schema";
import { RecordManager } from "../models/records-manager";

const app = express();

/**
 * Create a record
 */
app.post(
    "/",
    authorize(),
    parseJSON(),
    validation("createRecordRequest").middleware,
    errorHandler.wrap(req => {
        const { body } = req;
        return new RecordManager().create(body);
    })
);

/**
 * Get All Records
 */
app.get(
    "/",
    authorize(),
    validation("getAllRecordsRequest").middleware,
    errorHandler.wrap(req => {
        const { page, userEmail } = req.query;
        return new RecordManager().getAll(userEmail, page);
    })
);

/**
 * Get a record
 */
app.get(
    "/:id",
    authorize(),
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
    authorize(),
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
    authorize(),
    validation("deleteRecordRequest").middleware,
    errorHandler.wrap(req => {
        const { id } = req.params;
        return new RecordManager().delete(id);
    })
);

export const route = app;
