import express from "express";
import fs from "fs";
import morgan from "morgan";
import path from "path";
import { createConnection } from "typeorm";

import { config } from "./config";
import * as hero from "./entities";

// tslint:disable:no-console
const app = express();

// adds routes to the express server
console.info("[INFO] Setting up routes...");
const fileExtension = /\.js$/;
const routesDir = path.join(__dirname, "routes");
fs.readdirSync(routesDir)
    .filter(fileName => fileName[0] !== "." && fileExtension.test(fileName))
    .forEach(fileName => {
        const routePath = path.join(routesDir, fileName);
        const routeModule = require(routePath);
        const usepath = path.normalize(`/${fileName.replace(fileExtension, "")}`);
        console.info(`Loaded ${usepath}`);
        /* istanbul ignore if */ // this breaks the build process, no need to cover it
        if (!routeModule.route) {
            console.error(`Route module ${fileName} does not export itself properly`);
            throw new Error(`Unable to set up route ${fileName}. Check the route module for unexported route variables`);
        }
        app.use(usepath, routeModule.route);
    });

// morgan logs some useful data for each request and response
morgan("dev");

export async function startServer() {
    await createConnection({
        name: "default",
        type: "mysql",
        database: config.database.name,
        username: config.database.username,
        password: config.database.password,
        host: config.database.host,
        port: config.database.port,
        synchronize: true,
        entities: Object.values(hero),
    });
    app.listen(config.PORT, () => {
        console.log(`Server listening on port ${config.PORT}`);
    });
}

if (process.env.NODE_ENV !== "test") {
    startServer();
}
