import { json as parseJSON } from "body-parser";
import express from "express";

import * as errorHandler from "../lib/async-response-handler";
import { authenticate, authorize, extractUserRoleFromAccessToken } from "../lib/jwt-authorization";
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
    validation("createRecordRequest"),
    errorHandler.wrap(req => {
        const { body } = req;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(req.get("Authorization")!);
        return new RecordManager(authUserEmail, authUserRole).create(body);
    })
);

/**
 * Get All Records
 */
app.get(
    "/",
    authorize(),
    validation("getAllRecordsRequest"),
    errorHandler.wrap(req => {
        const { limit, skip, userEmail, filter } = req.query;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(req.get("Authorization")!);
        return new RecordManager(authUserEmail, authUserRole).getAll(userEmail, limit, skip, filter);
    })
);

/**
 * Get a record
 */
app.get(
    "/:id",
    authorize(),
    authenticate("id"),
    validation("getRecordRequest"),
    errorHandler.wrap(req => {
        const { id } = req.params;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(req.get("Authorization")!);
        return new RecordManager(authUserEmail, authUserRole).get(id);
    })
);

/**
 * Update a record
 */
app.put(
    "/:id",
    authorize(),
    authenticate("id"),
    parseJSON(),
    validation("updateRecordRequest"),
    errorHandler.wrap(req => {
        const { id } = req.params;
        const { body } = req;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(req.get("Authorization")!);
        return new RecordManager(authUserEmail, authUserRole).update({ ...body, id });
    })
);

/**
 * Delete a record
 */
app.delete(
    "/:id",
    authorize(),
    authenticate("id"),
    validation("deleteRecordRequest"),
    errorHandler.wrap(req => {
        const { id } = req.params;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(req.get("Authorization")!);
        return new RecordManager(authUserEmail, authUserRole).delete(id);
    })
);

export const route = app;
