import HTTP from "http-status-codes";
import mockRequire from "mock-require";
import * as nf from "node-fetch";

const request = nf.default;

async function requestMock(urlObject: nf.RequestInfo, options: nf.RequestInit) {
    const response = {
        foods: [
            {
                food_name: "mashed potatoes",
                nf_calories: 113
            },
            {
                food_name: "chicken breast",
                nf_calories: 412.5
            },
            {
                food_name: "coke",
                nf_calories: 436
            }
        ]
    };
    return Promise.resolve({
        status: HTTP.OK,
        json: () => {
            return Promise.resolve(response);
        }
    });
}

(nf.default as any) = requestMock;
mockRequire("node-fetch", nf);
