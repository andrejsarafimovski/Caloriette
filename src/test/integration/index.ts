import { assert } from "chai";
import { DefaultApi } from "../../sdk/axios";

// tslint:disable:no-console
describe("Integration tests", () => {

    let service: DefaultApi;

    // service should be initialized before
    before(() => {
        const serverAddress = `http://localhost:${process.env.PORT}`;
        service = new DefaultApi({}, serverAddress);
    });

    it("Should be able to pass this test", async () => {
        assert.isTrue(true);
    });

});
