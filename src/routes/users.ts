import { json as parseJSON } from "body-parser";
import express from "express";

import * as errorHandler from "../lib/async-response-handler";
import { authenticate, authorize, extractUserRoleFromAccessToken } from "../lib/jwt-authorization";
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
        return UserManager.signup(body);
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
        return UserManager.login(body);
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
        const { limit, skip, filter } = req.query;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(req.get("Authorization")!);
        return new UserManager(authUserEmail, authUserRole).getAll(limit, skip, filter);
    })
);

/**
 * Get User data
 */
app.get(
    "/:email",
    authorize(),
    authenticate("email"),
    validation("getUserRequest").middleware,
    errorHandler.wrap(req => {
        const { email } = req.params;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(req.get("Authorization")!);
        return new UserManager(authUserEmail, authUserRole).get(email);
    })
);

/**
 * Update User data
 */
app.put(
    "/:email",
    authorize(),
    authenticate("email"),
    parseJSON(),
    validation("updateUserRequest").middleware,
    errorHandler.wrap(req => {
        const { email } = req.params;
        const { body } = req;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(req.get("Authorization")!);
        return new UserManager(authUserEmail, authUserRole).update({ ...body, email });
    })
);

/**
 * Delete User data
 */
app.delete(
    "/:email",
    authorize(),
    authenticate("email"),
    validation("deleteUserRequest").middleware,
    errorHandler.wrap(req => {
        const { email } = req.params;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(req.get("Authorization")!);
        return new UserManager(authUserEmail, authUserRole).delete(email);
    })
);

export const route = app;
