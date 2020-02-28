import { NextFunction, Request, Response } from "express";
import HTTP from "http-status-codes";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { codedError } from "./coded-error";


export function authorize() {
    return (req: Request, _res: Response, next: NextFunction) => {
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

