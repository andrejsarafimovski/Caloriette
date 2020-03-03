import { assert } from "chai";
import e from "express";
import HTTP from "http-status-codes";
import { CodedError } from "../../lib/coded-error";
import { authorize } from "../../lib/jwt-authorization";

// tslint:disable
describe("Authorize Library Unit tests", () => {
    const failNext = () => {
        assert.fail("Should not reach this");
    };
    function generateRequest(auth?: string): e.Request {
        return {
            get: () => {
                return auth;
            }
        } as any;
    }
    function generateResponse(expectedMessage: string): e.Response {
        const expectedCode = HTTP.UNAUTHORIZED;
        return {
            status: (code: number) => {
                assert.equal(code, expectedCode)
                return {
                    send: (codedError: CodedError) => {
                        assert.equal(codedError.code, expectedCode);
                        assert.equal(codedError.message, expectedMessage);
                    }
                };
            }
        } as any;
    }

    it("Should fail with no auth header", async () => {
        const req = generateRequest();
        const res = generateResponse("Missing authorization header");
        authorize()(req, res, failNext);
    });

    it("Should fail with empty access token", async () => {
        const req = generateRequest("Bearer ");
        const res = generateResponse("Missing authorization token");
        authorize()(req, res, failNext);
    });

    it("Should fail with no access token", async () => {
        const req = generateRequest("Bearer invalidtoken");
        const res = generateResponse("Invalid authorization token");
        authorize()(req, res, failNext);
    });

});
