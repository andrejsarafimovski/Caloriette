process.env.NODE_ENV = "test";
process.env.PORT = "8000";
process.env.jwtSecret = "myJWTSecret";
process.env.hashSecret = "myHashSecret";
process.env.databaseType = "sqlite";
process.env.databaseHost = "localhost";
process.env.databasePort = "3306";
process.env.databaseName = ":memory:";
process.env.databaseUsername = "dbuser";
process.env.databasePassword = "dbpass";
process.env.nutritionxAppId = "nxTestAppId";
process.env.nutritionxAppKey = "nxTestAppKey";

import "./mocks/nutritionx";

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
