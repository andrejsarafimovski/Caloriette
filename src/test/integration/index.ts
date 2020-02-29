import { assert } from "chai";
import { CalorietteApi } from "../../sdk/axios";

// tslint:disable:no-console
describe("Integration tests", () => {

    let service: CalorietteApi;

    // service should be initialized before
    before(() => {
        const serverAddress = `http://localhost:${process.env.PORT}`;
        service = new CalorietteApi({}, serverAddress);
    });

    it("Should be able to pass this test", async () => {
        assert.isTrue(true);
    });

});
