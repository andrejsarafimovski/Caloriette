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
    encryptionSecret
} = process.env;

/* istanbul ignore if */ // won't test the throw
if (
    !encryptionSecret ||
    !jwtSecret
) {
    throw new Error("Fatal Error: missing required configurations in environment");
}

export const config = {
    PORT: parseInt(PORT!) || 80,
    encryption: {
        secret: encryptionSecret
    },
    pagination: {
        resultsPerPage: 10
    },
    jwt: {
        secret: jwtSecret,
        duration: 3600
    }
};
