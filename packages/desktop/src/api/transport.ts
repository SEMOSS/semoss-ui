import type { DesktopInstanceProfile } from "@/types";

interface TransportRequest {
	method?: "GET" | "POST";
	headers?: Record<string, string>;
	body?: string;
}

interface NativeHttpResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
}

const isTauriRuntime = (): boolean =>
	"__TAURI_INTERNALS__" in window || "__TAURI__" in window;

const shouldUseNativeTransport = (profile: DesktopInstanceProfile): boolean =>
	isTauriRuntime() && Boolean(profile.endpoint);

export const request = async (
	profile: DesktopInstanceProfile,
	url: string,
	options: TransportRequest = {},
): Promise<Response> => {
	if (!shouldUseNativeTransport(profile)) {
		return fetch(url, {
			method: options.method,
			headers: options.headers,
			body: options.body,
			credentials: "include",
		});
	}

	return nativeRequest(profile, url, options);
};

const nativeRequest = async (
	profile: DesktopInstanceProfile,
	url: string,
	options: TransportRequest,
): Promise<Response> => {
	const { invoke } = await import("@tauri-apps/api/core");
	const response = await invoke<NativeHttpResponse>("native_http_request", {
		request: {
			profileId: profile.id,
			url,
			method: options.method || "GET",
			headers: options.headers || {},
			body: options.body,
		},
	});

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});
};

const headersToRecord = (headers?: HeadersInit): Record<string, string> => {
	if (!headers) return {};
	return Object.fromEntries(new Headers(headers).entries());
};

export const installNativeFetchBridge = (
	profile: DesktopInstanceProfile,
): (() => void) => {
	if (!shouldUseNativeTransport(profile)) return () => undefined;

	const previousFetch = globalThis.fetch;
	globalThis.fetch = async (
		input: RequestInfo | URL,
		init: RequestInit = {},
	): Promise<Response> => {
		const sourceRequest = input instanceof Request ? input : null;
		const url = new URL(
			sourceRequest?.url || String(input),
			window.location.origin,
		);
		const allowedBase = `${profile.endpoint}${profile.module}`.replace(
			/\/+$/,
			"",
		);
		if (!url.toString().startsWith(`${allowedBase}/`)) {
			return previousFetch(input, init);
		}

		const method = (
			init.method ||
			sourceRequest?.method ||
			"GET"
		).toUpperCase();
		if (method !== "GET" && method !== "POST") {
			return previousFetch(input, init);
		}

		const headers = {
			...headersToRecord(sourceRequest?.headers),
			...headersToRecord(init.headers),
		};
		let body: string | undefined;
		if (typeof init.body === "string") {
			body = init.body;
		} else if (init.body instanceof URLSearchParams) {
			body = init.body.toString();
		} else if (!init.body && sourceRequest && method === "POST") {
			body = await sourceRequest.clone().text();
		} else if (init.body) {
			return previousFetch(input, init);
		}

		return nativeRequest(profile, url.toString(), {
			method,
			headers,
			body,
		});
	};

	return () => {
		globalThis.fetch = previousFetch;
	};
};
