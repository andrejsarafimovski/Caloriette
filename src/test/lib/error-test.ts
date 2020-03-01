import chai from "chai";

export async function errorTest(
    action: Promise<any>,
    expected: number | object | string,
    message: string
): Promise<void> {
    try {
        await action;
    } catch (err) {
        switch (typeof expected) {
            case "number":
                chai.assert.equal(err.response.status, expected, `${message}: ${err.message}`);
                return;
            case "object":
                if (expected) {
                    const badKey = Object.keys(expected).find(key => {
                        return err[key] !== (expected as any)[key];
                    });
                    if (badKey) {
                        chai.assert.equal(err[badKey], (expected as any)[badKey], message);
                    } else {
                        chai.assert.ok(true, `${message}: ${err.message}`);
                    }
                } else {
                    chai.assert.ok(true, `${message}: ${err.message}`);
                }
                return;
            case "string":
                chai.assert.equal(err.message, expected, `${message}: ${err.message}`);
                return;
            default:
                chai.assert.notOk(true, `${message}: Unexpected Type in errorTest "${typeof expected}"`);
                return;
        }
    }
    chai.assert.notOk(true, "Action succeeded unexpectedly");
}
