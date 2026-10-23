/**
 * INTERNAL pure helpers for request and response bodies. They hold no state;
 * The typed route helpers use them.
 */

import type { RequestShape } from "./api-types";

/**
 * Marks an array sent as repeated form keys (`id=a&id=b`) instead of JSON.
 *
 * @name Repeated
 */
class Repeated {
	/**
	 * @name constructor
	 * @param values - The values to send under one key.
	 */
	constructor(readonly values: ReadonlyArray<string | number | boolean>) {}
}

/**
 * Send an array as repeated form keys. Use it only where the Java reads
 * `request.getParameterValues` / `getParameterMap()` for that key.
 *
 * @name repeat
 * @param values - The values, or `undefined` to omit the field.
 * @returns A marker the form encoder expands, or `undefined`.
 */
export const repeat = (
	values: ReadonlyArray<string | number | boolean> | undefined,
): Repeated | undefined => (values ? new Repeated(values) : undefined);

/**
 * Encode a body and set its `Content-Type` (multipart lets `fetch` set it).
 * Non-string form values are `JSON.stringify`'d, as Monolith expects.
 *
 * @name encodeBody
 * @param body - Raw text, a `FormData`, or fields (`undefined` fields are skipped).
 * @param bodyType - `"form"` (default), `"json"`, `"multipart"` or `"text"`.
 * @param headers - The request headers.
 * @returns The `fetch` body.
 */
export const encodeBody = (
	body: FormData | Record<string, unknown> | string | undefined,
	bodyType: RequestShape["bodyType"],
	headers: Headers,
): BodyInit | undefined => {
	if (body === undefined) {
		return undefined;
	}
	if (bodyType === "text") {
		if (typeof body !== "string") {
			throw new TypeError("Text request bodies must be strings");
		}
		headers.set("Content-Type", "text/plain;charset=UTF-8");
		return body;
	}
	if (typeof body === "string") {
		throw new TypeError("Raw string bodies require bodyType: text");
	}
	if (body instanceof FormData) {
		headers.delete("Content-Type");
		return body;
	}
	const fields = Object.entries(body).filter(([, v]) => v !== undefined);
	const text = (v: unknown) =>
		typeof v === "string" ? v : JSON.stringify(v);

	if (bodyType === "json") {
		headers.set("Content-Type", "application/json");
		return JSON.stringify(Object.fromEntries(fields));
	}
	if (bodyType === "multipart") {
		headers.delete("Content-Type");
		const form = new FormData();
		for (const [key, value] of fields) {
			form.append(key, value instanceof Blob ? value : text(value));
		}
		return form;
	}

	headers.set("Content-Type", "application/x-www-form-urlencoded");
	const form = new URLSearchParams();
	for (const [key, value] of fields) {
		const items = value instanceof Repeated ? value.values : [text(value)];
		for (const item of items) {
			form.append(key, String(item));
		}
	}
	return form.toString();
};

/**
 * Parse a body as JSON, falling back to text. Body-read failures and aborts propagate.
 *
 * @name readBody
 * @param response - The response.
 * @returns The parsed body, the text, or `undefined` when empty.
 */
export const readBody = async (response: Response): Promise<unknown> => {
	const text = await response.text();
	try {
		return text ? JSON.parse(text) : undefined;
	} catch {
		return text;
	}
};
