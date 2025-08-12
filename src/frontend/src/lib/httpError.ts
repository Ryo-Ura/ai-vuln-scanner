export class HttpError extends Error {
    status: number;
    code?: string;
    body?: unknown;
    constructor(
        status: number,
        message: string,
        code?: string,
        body?: unknown
    ) {
        super(message);
        this.status = status;
        this.code = code;
        this.body = body;
    }
}
