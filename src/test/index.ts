process.env.NODE_ENV = "test";
process.env.PORT = "8000";

// tslint:disable
import { startServer } from "../";

before(async () => {
    console.info("BEFORE");
    await startServer();
    // await new Promise(res => {
    //     setTimeout(() => {
    //         res();
    //     }, 20000)
    // });
    // server.name
    // the setup function of the server will do everything
    // server.app.listen(
    //     parseInt(process.env.PORT!)
    // );
    // broadcast the new port to all stakeholders
});

after(() => {
    console.info("AFTER");
    process.exit(1);
});
