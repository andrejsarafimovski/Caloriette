export interface CodedError extends Error {
    errorCode: string;
    errorMessage: string;
    errorSource: string;
    name: string;
    message: string;
    code: number;
    innerError: CodedError;
    stack: string;
}

export function codedError(code: number, message: string, err?: any, errorCode?: string): CodedError {
    let self = {} as CodedError;
    /* istanbul ignore if */    // This specific case never appears.
    if (err) {
        self = err as CodedError;
        self.innerError = JSON.parse(JSON.stringify(err)) as CodedError;
        self.errorMessage = (err as { errorMessage?: string }).errorMessage || (err as { message: string }).message;
    }
    if (errorCode) { self.errorCode = errorCode; }
    self.code = code;
    self.message = message;
    return self;
}

/* istanbul ignore next */    // This specific case never appears.
export namespace codedError {
    export function is(code: number) {
        return (err: CodedError) => err.code === code;
    }
}
