// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { UnauthorizedError } from "./error";
import { CSRF, get, post } from "./fetch";

const createJsonResponse = (
	data: unknown,
	init?: {
		status?: number;
		headers?: HeadersInit;
		url?: string;
		redirected?: boolean;
	},
): Response => {
	const response = new Response(JSON.stringify(data), {
		status: init?.status ?? 200,
		headers: {
			"content-type": "application/json",
			...init?.headers,
		},
	});

	if (init?.url) {
		Object.defineProperty(response, "url", {
			value: init.url,
			configurable: true,
		});
	}

	if (typeof init?.redirected === "boolean") {
		Object.defineProperty(response, "redirected", {
			value: init.redirected,
			configurable: true,
		});
	}

	return response;
};

describe("fetch utility", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.stubGlobal("fetch", vi.fn());

		Env.update({
			ACCESS_KEY: "",
			SECRET_KEY: "",
			BEARER_TOKEN: "",
			BEARER_PROVIDER: "",
			CSRF: false,
			MODULE: "",
		});

		CSRF.isEnabled = false;
		CSRF.token = "";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("adds basic auth headers on GET when access/secret keys exist", async () => {
		Env.update({ ACCESS_KEY: "abc", SECRET_KEY: "xyz" });

		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(createJsonResponse({ ok: true }));

		await get<{ ok: boolean }>("/api/test");

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [, requestInit] = fetchMock.mock.calls[0];
		expect(requestInit?.method).toBe("GET");
		expect(
			(requestInit?.headers as Record<string, string>).authorization,
		).toBe(`Basic ${btoa("abc:xyz")}`);
	});

	it("prefers bearer token over basic auth when both are configured", async () => {
		Env.update({
			ACCESS_KEY: "abc",
			SECRET_KEY: "xyz",
			BEARER_TOKEN: "token-123",
			BEARER_PROVIDER: "random",
		});

		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(createJsonResponse({ ok: true }));

		await get<{ ok: boolean }>("/api/test");

		const [, requestInit] = fetchMock.mock.calls[0];
		const headers = requestInit?.headers as Record<string, string>;

		expect(headers.authorization).toBe("Bearer token-123");
		expect(headers["Bearer-Provider"]).toBe("random");
	});

	it("encodes POST body as x-www-form-urlencoded for object payloads", async () => {
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(createJsonResponse({ created: true }));

		await post<{ created: boolean }>("/api/create", {
			name: "test user",
			count: 2,
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [, requestInit] = fetchMock.mock.calls[0];
		const headers = requestInit?.headers as Record<string, string>;
		expect(requestInit?.method).toBe("POST");
		expect(headers["Content-Type"]).toBe(
			"application/x-www-form-urlencoded",
		);
		expect(requestInit?.body).toBe("name=test%20user&count=2");
	});

	it("checks if interceptors are working properly in POST operation", async () => {
		Env.update({
			ACCESS_KEY: "postrq",
			SECRET_KEY: "postscrt",
			BEARER_PROVIDER: "postprv",
			BEARER_TOKEN: "posttkn",
		});
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(createJsonResponse({ creatd: true }));

		await post<{ created: boolean }>("/api/create", {
			name: "test user",
			colunt: 3,
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [, requestInit] = fetchMock.mock.calls[0];
		const headers = requestInit?.headers as Record<string, string>;
		expect(requestInit?.method).toBe("POST");
		expect(headers.authorization).toBe("Bearer token-posttkn");
		expect(headers["Bearer-Provider"]).toBe("postprv");
		expect(requestInit?.body).toBe("name=test%20user&count=2");
	});

	it("fetches and applies CSRF token for POST when enabled", async () => {
		CSRF.isEnabled = true;
		Env.update({ MODULE: "/module" });

		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(
			createJsonResponse(
				{},
				{
					headers: {
						"x-csrf-token": "csrf-token-1",
					},
				},
			),
		);
		fetchMock.mockResolvedValueOnce(createJsonResponse({ saved: true }));

		await post<{ saved: boolean }>("/api/save", { id: 1 });

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[0][0]).toBe("/module/api/config/fetchCsrf");
		const postRequest = fetchMock.mock.calls[1][1];
		expect(
			(postRequest?.headers as Record<string, string>)["X-CSRF-Token"],
		).toBe("csrf-token-1");
	});

	it("throws UnauthorizedError when backend responds with redirect header", async () => {
		const replaceSpy = vi
			.spyOn(Location.prototype, "replace")
			.mockImplementation(() => undefined);

		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(
			createJsonResponse(
				{},
				{
					headers: {
						redirect: "/login",
					},
				},
			),
		);

		await expect(get("/api/private")).rejects.toBeInstanceOf(
			UnauthorizedError,
		);
		expect(replaceSpy).toHaveBeenCalledTimes(1);
	});
});
