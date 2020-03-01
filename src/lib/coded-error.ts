export interface CodedError {
    message: string;
    code: number;
}

export function codedError(code: number, message: string, err?: any, errorCode?: string): CodedError {
    return { code, message } as CodedError;
}

/* istanbul ignore next */    // This specific case never appears.
export namespace codedError {
    export function is(code: number) {
        return (err: CodedError) => err.code === code;
    }
}
