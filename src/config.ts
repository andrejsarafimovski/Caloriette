/*
    This piece of code picks the needed variables from environment and exports them.
    The goal is not to read from environment `process.env.databaseUrl` from the other source code files
    With this you can control which configurations you have in the environment and use TypeScript
    to make reading from config more safe
*/

// tslint:disable

const {
    PORT,
    jwtSecret,
    hashSecret,
    databaseType,
    databaseHost,
    databasePort,
    databaseName,
    databaseUsername,
    databasePassword,
    nutritionxAppId,
    nutritionxAppKey
} = process.env;

/* istanbul ignore if */ // won't test the throw
if (
    !nutritionxAppId ||
    !nutritionxAppKey ||
    !databaseType ||
    !databaseHost ||
    !databasePort ||
    !databaseName ||
    !databaseUsername ||
    !databasePassword ||
    !hashSecret ||
    !jwtSecret
) {
    throw new Error("Fatal Error: missing required configurations in environment");
}

export const config = {
    PORT: parseInt(PORT!) || 80,
    hash: {
        secret: hashSecret
    },
    jwt: {
        secret: jwtSecret,
        duration: 3600
    },
    nutritionx: {
        appId: nutritionxAppId,
        appKey: nutritionxAppKey
    },
    database: {
        type: databaseType,
        host: databaseHost,
        port: parseInt(databasePort),
        password: databasePassword,
        username: databaseUsername,
        name: databaseName
    }
};
