import mockRequire from "mock-require";
import * as typeorm from "typeorm";

const defaultCreateConnection = typeorm.createConnection;

async function createConnectionMock(opt: typeorm.ConnectionOptions) {
    await defaultCreateConnection({
        ...opt,
        type: "sqlite"
    } as typeorm.ConnectionOptions);
}

(typeorm.createConnection as any) = createConnectionMock;

mockRequire("typeorm", typeorm);

