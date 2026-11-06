import {
	decodeBase64ToBytes,
	encodeBytesToBase64,
} from "@semoss/utility/encoding";
import { invokeCommand } from "./tauri";

/** A request as `native_http_request` takes it. */
export interface NativeHttpRequest {
	url: string;
	method: "GET" | "POST";
	headers: Record<string, string>;
	/** The body's bytes, base64 encoded; null for none. */
	bodyBase64: string | null;
}

/** A response as `native_http_request` returns it. */
export interface NativeHttpResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	/** The body's bytes, base64 encoded, so binary downloads survive. */
	bodyBase64: string;
}

/** Sends one request through the app's Rust HTTP client. */
export type NativeHttpSender = (
	request: NativeHttpRequest,
) => Promise<NativeHttpResponse>;

/** The Rust command every bridged request goes through. */
export const sendNativeRequest: NativeHttpSender = (request) =>
	invokeCommand<NativeHttpResponse>("native_http_request", {
		request: request,
	});

/**
 * Encode any `fetch` body to bytes, with the content type it implies. A
 * `FormData` becomes a multipart body with its boundary, the way the
 * browser would send it, so uploads (`uploadInsight`) cross the bridge
 * unchanged.
 *
 * @param body - The request body.
 * @returns The bytes, base64 encoded, and the implied content type.
 */
export const encodeRequestBody = async (
	body: BodyInit | null | undefined,
): Promise<{ bodyBase64: string | null; contentType: string | null }> => {
	if (body === null || body === undefined) {
		return { bodyBase64: null, contentType: null };
	}
	const encoded = new Response(body);
	const bytes = new Uint8Array(await encoded.arrayBuffer());
	return {
		bodyBase64: encodeBytesToBase64(bytes),
		contentType: encoded.headers.get("content-type"),
	};
};

/**
 * Make a `fetch` Response from the bridge's answer.
 *
 * @param response - What the Rust client returned.
 * @returns The response.
 */
export const toFetchResponse = (response: NativeHttpResponse): Response => {
	// a null-body status cannot carry a body, even an empty one
	const hasBody = ![101, 204, 205, 304].includes(response.status);
	return new Response(
		hasBody ? decodeBase64ToBytes(response.bodyBase64) : null,
		{
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		},
	);
};

/**
 * Route every `fetch` to the instance through the app's Rust HTTP client, so
 * cookies, CORS and the page's CSP are no concern: the Rust side keeps the
 * session's cookies in the webview's jar, which the sign in window shares.
 * Requests anywhere else, and methods other than GET and POST, use the
 * page's own `fetch`.
 *
 * @param base - The instance's module address, such as
 * `https://host/Monolith`.
 * @param send - Sends a request; the Rust command by default.
 * @returns Restores the page's own `fetch`.
 */
export const installNativeFetchBridge = (
	base: string,
	send: NativeHttpSender = sendNativeRequest,
): (() => void) => {
	const allowedBase = base.replace(/\/+$/, "");
	const pageFetch = globalThis.fetch;

	globalThis.fetch = async (
		input: RequestInfo | URL,
		init: RequestInit = {},
	): Promise<Response> => {
		const source = input instanceof Request ? input : null;
		// a relative address resolves against the page, as `fetch` resolves it
		const url = new URL(
			source?.url ?? String(input),
			globalThis.location?.href ?? allowedBase,
		);
		const method = (init.method ?? source?.method ?? "GET").toUpperCase();
		const isInstance =
			url.href === allowedBase || url.href.startsWith(`${allowedBase}/`);
		if (!isInstance || (method !== "GET" && method !== "POST")) {
			return pageFetch(input, init);
		}

		const headers: Record<string, string> = Object.fromEntries(
			new Headers(source?.headers).entries(),
		);
		for (const [name, value] of new Headers(init.headers).entries()) {
			headers[name] = value;
		}
		const body =
			init.body ??
			(source && method === "POST" ? await source.clone().blob() : null);
		const { bodyBase64, contentType } = await encodeRequestBody(body);
		if (contentType && !headers["content-type"]) {
			headers["content-type"] = contentType;
		}

		const response = await send({
			url: url.href,
			method: method,
			headers: headers,
			bodyBase64: bodyBase64,
		});
		return toFetchResponse(response);
	};

	return () => {
		globalThis.fetch = pageFetch;
	};
};
