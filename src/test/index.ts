process.env.NODE_ENV = "test";
process.env.PORT = "8000";
process.env.PORT = "8000";
process.env.jwtSecret = "myJWTSecret";
process.env.hashSecret = "myHashSecret";
process.env.databaseHost = "localhost";
process.env.databasePort = "3306";
process.env.databaseName = "caloriettedb";
process.env.databaseUsername = "root";
process.env.databasePassword = "root12345";

import "./mocks/typeorm";
// tslint:disable
import { startServer } from "../";

before(async () => {
    console.info("BEFORE");
    await startServer();
});

after(() => {
    console.info("AFTER");
    process.exit(1);
});
