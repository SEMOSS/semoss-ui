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
		const headers = new Headers(requestInit?.headers);
		expect(requestInit?.method).toBe("POST");
		expect(headers.get("Content-Type")).toBe(
			"application/x-www-form-urlencoded",
		);
		expect(requestInit?.body).toBe("name=test%20user&count=2");
	});

	it.each<{ name: string; headers: HeadersInit }>([
		{
			name: "lowercase record",
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				"X-Request-ID": "request-1",
			},
		},
		{
			name: "mixed-case record",
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				"Content-Type": "application/x-www-form-urlencoded",
				"X-Request-ID": "request-1",
			},
		},
		{
			name: "Headers instance",
			headers: new Headers({
				"Content-Type": "application/json",
				"X-Request-ID": "request-1",
			}),
		},
		{
			name: "tuple list",
			headers: [
				["content-type", "application/json"],
				["Content-Type", "application/x-www-form-urlencoded"],
				["X-Request-ID", "request-1"],
			],
		},
	])(
		"normalizes POST headers from a $name without changing the input",
		async ({ headers: callerHeaders }) => {
			const originalHeaders = Array.from(new Headers(callerHeaders));
			Env.update({ BEARER_TOKEN: "token-123" });
			CSRF.isEnabled = true;
			CSRF.token = "csrf-token-1";

			const fetchMock = vi.mocked(fetch);
			fetchMock.mockResolvedValueOnce(
				createJsonResponse({ created: true }),
			);

			await post(
				"/api/create",
				{ name: "test user" },
				{
					headers: callerHeaders,
				},
			);

			const request = new Request(
				"https://semoss.example/api/create",
				fetchMock.mock.calls[0][1],
			);
			expect(request.headers.get("Content-Type")).toBe(
				"application/x-www-form-urlencoded",
			);
			expect(request.headers.get("X-Request-ID")).toBe("request-1");
			expect(request.headers.get("Authorization")).toBe(
				"Bearer token-123",
			);
			expect(request.headers.get("X-CSRF-Token")).toBe("csrf-token-1");
			expect(Array.from(new Headers(callerHeaders))).toEqual(
				originalHeaders,
			);
		},
	);

	it("lets Fetch generate the multipart boundary for FormData", async () => {
		const form = new FormData();
		form.append("name", "test user");
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockResolvedValueOnce(createJsonResponse({ created: true }));

		await post("/api/upload", form);

		const request = new Request(
			"https://semoss.example/api/upload",
			fetchMock.mock.calls[0][1],
		);
		expect(request.headers.get("Content-Type")).toMatch(
			/^multipart\/form-data; boundary=/,
		);
		expect((await request.formData()).get("name")).toBe("test user");
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
			count: 3,
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [, requestInit] = fetchMock.mock.calls[0];
		const headers = requestInit?.headers as Record<string, string>;
		expect(requestInit?.method).toBe("POST");
		expect(headers.authorization).toBe("Bearer posttkn");
		expect(headers["Bearer-Provider"]).toBe("postprv");
		expect(requestInit?.body).toBe("name=test%20user&count=3");
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
	});
});
