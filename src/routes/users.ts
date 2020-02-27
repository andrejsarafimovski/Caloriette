import { json as parseJSON } from "body-parser";
import express from "express";
import * as errorHandler from "../lib/async-response-handler";
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
        return new UserManager().signup(req.body);
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
        return new UserManager().login(req.body);
    })
);

/**
 * Fetch User data
 */
app.get(
    "/:email",
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
    parseJSON(),
    validation("updateUserRequest").middleware,
    errorHandler.wrap(req => {
        const { email } = req.params;
        return new UserManager().update(email, req.body);
    })
);

/**
 * Update User data
 */
app.delete(
    "/:email",
    validation("deleteUserRequest").middleware,
    errorHandler.wrap(req => {
        const { email } = req.params;
        return new UserManager().delete(email);
    })
);

export const route = app;
