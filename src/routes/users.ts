import { json as parseJSON } from "body-parser";
import express from "express";

import * as errorHandler from "../lib/async-response-handler";
import { authorize } from "../lib/authorization";
import { validation } from "../lib/validation-schema";
import { UserManager } from "../models/user-manager";

const app = express();

/**
 * Creates a user - SIGNUP
 */
app.post(
    "/",
    parseJSON(),
    validation("signupUserRequest").middleware,
    errorHandler.wrap(req => {
        const { body } = req;
        return new UserManager().signup(body);
    })
);

/**
 * Logs in a user - LOGIN
 */
app.post(
    "/login",
    parseJSON(),
    validation("loginUserRequest").middleware,
    errorHandler.wrap(req => {
        const { body } = req;
        return new UserManager().login(body);
    })
);

/**
 * Get All Users Data
 */
app.get(
    "/",
    authorize(),
    validation("getAllUsersRequest").middleware,
    errorHandler.wrap(req => {
        const { page } = req.query;
        return new UserManager().getAll(page);
    })
);

/**
 * Get User data
 */
app.get(
    "/:email",
    authorize(),
    validation("getUserRequest").middleware,
    errorHandler.wrap(req => {
        const { email } = req.params;
        return new UserManager().get(email);
    })
);

/**
 * Update User data
 */
app.put(
    "/:email",
    authorize(),
    parseJSON(),
    validation("updateUserRequest").middleware,
    errorHandler.wrap(req => {
        const { email } = req.params;
        const { body } = req;
        return new UserManager().update(email, body);
    })
);

/**
 * Delete User data
 */
app.delete(
    "/:email",
    authorize(),
    validation("deleteUserRequest").middleware,
    errorHandler.wrap(req => {
        const { email } = req.params;
        return new UserManager().delete(email);
    })
);

export const route = app;
