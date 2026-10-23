/**
 * AbstractError class
 */
class AbstractError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

/**
 * Error thrown when a user is not authorized anymore
 */
export class UnauthorizedError extends AbstractError {
	code: number;

	constructor(message: string, code = 401) {
		super(message);
		this.code = code;
	}
}

/** A failed POST response, including the backend data needed by API consumers. */
export class HttpError extends AbstractError {
	readonly status: number;
	readonly data: unknown;

	constructor(message: string, status: number, data: unknown) {
		super(message);
		this.status = status;
		this.data = data;
	}
}
