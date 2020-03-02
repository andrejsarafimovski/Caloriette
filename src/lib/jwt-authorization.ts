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

export function authorize() {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authorization = req.get("Authorization");
        if (!authorization) {
            return res
                .status(HTTP.UNAUTHORIZED)
                .send(codedError(HTTP.UNAUTHORIZED, "Missing authorization header"));
        }
        const accessToken = authorization.split("Bearer ")[1];
        if (!accessToken) {
            return res
                .status(HTTP.UNAUTHORIZED)
                .send(codedError(HTTP.UNAUTHORIZED, "Missing authorization token"));
        }
        try {
            jwt.verify(accessToken, config.jwt.secret);
        } catch (err) {
            return res
                .status(HTTP.UNAUTHORIZED)
                .send(codedError(HTTP.UNAUTHORIZED, "Invalid authorization token"));
        }
        return next();
    };
}

export function authenticate(param: PathParameter) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authorization = req.get("Authorization")!;
        const { authUserEmail, authUserRole } = extractUserRoleFromAccessToken(authorization);
        switch (param) {
            case "email": {
                if (authUserRole === "user" && authUserEmail !== req.params[param]) {
                    return res
                        .status(HTTP.FORBIDDEN)
                        .send(codedError(HTTP.FORBIDDEN, "User not authorized to perform this action"));
                }
                break;
            }
            case "id": {
                const record = await getConnection().getRepository(Record).findOne(req.params[param]);
                if (!record) {
                    return res
                        .status(HTTP.NOT_FOUND)
                        .send(codedError(HTTP.NOT_FOUND, `Record with id ${param} not found`));
                }
                if (
                    (authUserRole === "user" || authUserRole === "moderator") &&
                    record.userEmail !== authUserEmail
                ) {
                    return res
                        .status(HTTP.FORBIDDEN)
                        .send(codedError(HTTP.FORBIDDEN, "User not authorized to perform this action"));
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
