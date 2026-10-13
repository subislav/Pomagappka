export class AppError extends Error {
    constructor(readonly statusCode: number, readonly code: string, message: string) {
        super(message);
        this.name = "AppError";
    }
}
export function toErrorBody(error: AppError) {
    return {
        error: {
            code: error.code,
            message: error.message,
        },
    };
}
