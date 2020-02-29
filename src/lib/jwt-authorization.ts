import { NextFunction, Request, Response } from "express";
import HTTP from "http-status-codes";
import jwt from "jsonwebtoken";
import { getConnection } from "typeorm";
import { config } from "../config";
import { Record } from "../entities";
import { UserRole } from "../types";
import { codedError } from "./coded-error";

interface JWTPayload {
    authUserEmail: string;
    authUserRole: UserRole;
}

type PathParameter = "email" | "id";

export function authorize(param?: PathParameter) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const authorization = req.get("Authorization");
        if (!authorization) {
            throw codedError(HTTP.UNAUTHORIZED, "Missing authorization token");
        }
        const accessToken = authorization.split("Bearer ")[1];
        if (!accessToken) {
            throw codedError(HTTP.UNAUTHORIZED, "Missing authorization token");
        }
        try {
            jwt.verify(accessToken, config.jwt.secret);
        } catch (err) {
            throw codedError(HTTP.UNAUTHORIZED, "Invalid authorization token");
        }
        return next();
    };
}

export function authenticate(param: PathParameter) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        const authorization = req.get("Authorization")!;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(authorization);
        switch (param) {
            case "email": {
                if (authUserRole === "user" && authUserEmail !== req.params[param]) {
                    throw codedError(HTTP.FORBIDDEN, "User is not authorized to perform this action");
                }
                break;
            }
            case "id": {
                const record = await getConnection().getRepository(Record).findOne(req.params[param]);
                if (!record) {
                    break;
                }
                if (
                    (authUserRole === "user" || authUserRole === "moderator") &&
                    record.userEmail !== authUserEmail
                ) {
                    throw codedError(HTTP.FORBIDDEN, "User is not authorized to perform this action");
                }
                break;
            }
        }
        return next();
    };
}

export function extractUserRoleFromAccessToken(authorization: string): JWTPayload {
    const accessToken = authorization.split("Bearer ")[1];
    return jwt.decode(accessToken, { json: true }) as JWTPayload;
}

export function createAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.duration });
}
