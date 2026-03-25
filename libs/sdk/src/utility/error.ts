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
