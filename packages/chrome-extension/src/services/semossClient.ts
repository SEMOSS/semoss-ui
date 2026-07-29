const DEFAULT_SEMOSS_BASE = "http://localhost:9090/Monolith";
const SEMOSS_BASE_STORAGE_KEY = "semossBaseUrl";

type PixelReturn = {
	output?: unknown;
	operationType?: string | string[];
};

type PixelResponse = {
	pixelReturn?: PixelReturn[];
};

export function escapePixelString(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function unwrapPixelResponse<T = unknown>(rawData: unknown): T {
	const pixelResponse = rawData as PixelResponse;
	const first = pixelResponse?.pixelReturn?.[0];
	if (!first) {
		return rawData as T;
	}

	const operationType = first.operationType;
	const isError = Array.isArray(operationType)
		? operationType.includes("ERROR")
		: operationType === "ERROR";

	if (isError) {
		throw new Error(String(first.output || "Pixel execution failed"));
	}

	return first.output as T;
}

export class SemossClient {
	private static csrfToken = "";

	private constructor() {
		// Utility class
	}

	static async getBaseUrl(): Promise<string> {
		const data = await chrome.storage.local.get([SEMOSS_BASE_STORAGE_KEY]);
		const stored = data[SEMOSS_BASE_STORAGE_KEY];
		const baseUrl =
			typeof stored === "string" && stored.trim()
				? stored.trim()
				: DEFAULT_SEMOSS_BASE;

		return baseUrl.replace(/\/$/, "");
	}

	static async getUiLoginUrl(): Promise<string> {
		const baseUrl = await SemossClient.getBaseUrl();
		const url = new URL(baseUrl);
		// Point to the actual deployed client UI (not the legacy redirect)
		return `${url.protocol}//${url.host}/SemossWeb/packages/client/dist/`;
	}

	static async setBaseUrl(baseUrl: string): Promise<void> {
		SemossClient.csrfToken = "";
		await chrome.storage.local.set({
			[SEMOSS_BASE_STORAGE_KEY]: baseUrl.replace(/\/$/, ""),
		});
	}

	static async fetchCsrfToken(force = false): Promise<string> {
		if (SemossClient.csrfToken && !force) {
			return SemossClient.csrfToken;
		}

		const response = await SemossClient.request("/api/config/fetchCsrf", {
			method: "GET",
			headers: {
				"X-CSRF-Token": "fetch",
			},
			skipCsrf: true,
		});

		const token =
			response.headers.get("X-CSRF-Token") ||
			response.headers.get("x-csrf-token") ||
			"";

		if (!token) {
			throw new Error("Unable to fetch SEMOSS CSRF token");
		}

		SemossClient.csrfToken = token;
		return token;
	}

	static async request(
		path: string,
		options: RequestInit & { skipCsrf?: boolean } = {},
	): Promise<Response> {
		const { skipCsrf = false, ...fetchOptions } = options;
		const baseUrl = await SemossClient.getBaseUrl();
		const method = (fetchOptions.method || "GET").toUpperCase();
		const headers = new Headers(fetchOptions.headers);

		if (method === "POST" && !skipCsrf) {
			headers.set("X-CSRF-Token", await SemossClient.fetchCsrfToken());
		}

		const response = await fetch(`${baseUrl}${path}`, {
			...fetchOptions,
			method,
			headers,
			credentials: "include",
		});

		if (response.status === 403 && method === "POST" && !skipCsrf) {
			headers.set(
				"X-CSRF-Token",
				await SemossClient.fetchCsrfToken(true),
			);
			return fetch(`${baseUrl}${path}`, {
				...fetchOptions,
				method,
				headers,
				credentials: "include",
			});
		}

		return response;
	}

	static async runPixel<T = unknown>(expression: string): Promise<T> {
		const body = new URLSearchParams({ expression }).toString();
		const response = await SemossClient.request("/api/engine/runPixel", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`HTTP ${response.status}: ${errorText.substring(0, 300)}`,
			);
		}

		const rawData = await response.json();
		return unwrapPixelResponse<T>(rawData);
	}
}
