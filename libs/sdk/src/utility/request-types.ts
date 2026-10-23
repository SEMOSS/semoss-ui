/**
 * Query-string parameters. Arrays become repeated keys; `null` / `undefined` are dropped.
 *
 * @name QueryParams
 */
export type QueryParams = Record<
	string,
	| string
	| number
	| boolean
	| null
	| undefined
	| ReadonlyArray<string | number | boolean>
>;

/**
 * How a request is sent and read, when it differs from the defaults
 * (form body, JSON response).
 *
 * @name RequestShape
 */
export interface RequestShape {
	/** Body encoding. `form` JSON-stringifies non-string values, as Monolith expects. */
	bodyType?: "form" | "json" | "multipart" | "text";
	/** How to read the response. */
	responseType?: "json" | "text" | "blob" | "stream" | "response";
	/** Query parameters on a request that also has a body. */
	query?: QueryParams;
}
