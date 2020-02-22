import { json as parseJSON } from "body-parser";
import express from "express";
import * as errorHandler from "../lib/async-response-handler";

const app = express();

app.post(
    "/",
    parseJSON(),
    errorHandler.wrap(req => {
        return { done: true };
    })
);

app.get(
    "/:id",
    errorHandler.wrap(req => {
        const { id } = req.params;
        return { done: true };
    })
);

export const route = app;
