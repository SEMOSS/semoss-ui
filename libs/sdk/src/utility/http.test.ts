import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { ApiError, UnauthorizedError } from "../lib/api-error";
import {
	HttpError,
	UnauthorizedError as LegacyUnauthorizedError,
} from "../lib/error";
import { CSRF, get as legacyGet, post as legacyPost } from "../lib/fetch";
import { repeat } from "./body";
import { del, get, post, put } from "./http";
import { clearSession } from "./session";
import { path } from "./url";

/** A response that can carry multiple Set-Cookie headers in Node. */
const answer = (body: unknown, headers?: HeadersInit, status = 200): Response =>
	Response.json(body, { headers, status });

/** Hold a response while exercising cancellation or an environment change. */
const deferredResponse = () => {
	let resolve: (value: Response) => void = () => undefined;
	const promise = new Promise<Response>((accept) => {
		resolve = accept;
	});
	return { promise, resolve };
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	vi.stubGlobal("fetch", fetchMock);
	fetchMock.mockReset();
	Env.update({
		MODULE: "/Monolith/",
		ACCESS_KEY: "",
		SECRET_KEY: "",
		BEARER_TOKEN: "",
		BEARER_PROVIDER: "",
		CSRF: false,
		HEADLESS: false,
		REDIRECT_URL: "",
	});
	clearSession();
	CSRF.isEnabled = false;
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("typed route adapter", () => {
	it("encodes path parameters and repeated queries without changing the caller's headers", async () => {
		fetchMock.mockResolvedValueOnce(answer({ permission: "OWNER" }));
		Env.update({ BEARER_TOKEN: "token", BEARER_PROVIDER: "ms" });
		const signal = new AbortController().signal;
		const headers = {
			"X-Request-ID": "one",
			authorization: "ignored",
			"X-CSRF-Token": "ignored",
		};
		await expect(
			get(
				path`/api/project-${"a/b? c"}/type`,
				{ tag: ["one", "two"], missing: null },
				{ signal, headers },
			),
		).resolves.toEqual({ permission: "OWNER" });
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toBe(
			"/Monolith/api/project-a%2Fb%3F%20c/type?tag=one&tag=two",
		);
		expect(options?.signal).toBe(signal);
		const sent = new Headers(options?.headers);
		expect(sent.get("authorization")).toBe("Bearer token");
		expect(sent.get("Bearer-Provider")).toBe("ms");
		expect(sent.get("X-Request-ID")).toBe("one");
		expect(sent.has("X-CSRF-Token")).toBe(false);
		expect(headers.authorization).toBe("ignored");
	});

	it("keeps JSON arrays distinct from repeated form fields", async () => {
		fetchMock.mockResolvedValueOnce(answer(true));
		await post("/api/form", {
			names: ["a", "b"],
			ids: repeat([1, 2]),
			omitted: undefined,
			removed: null,
		});
		expect(fetchMock.mock.calls[0][1]?.body).toBe(
			"names=%5B%22a%22%2C%22b%22%5D&ids=1&ids=2&removed=null",
		);
	});

	it("sends JSON bodies and lets Fetch set multipart boundaries", async () => {
		fetchMock
			.mockResolvedValueOnce(answer(true))
			.mockResolvedValueOnce(answer(true));
		await post("/api/json", { value: [1], omitted: undefined }, undefined, {
			bodyType: "json",
		});
		expect(fetchMock.mock.calls[0][1]?.body).toBe('{"value":[1]}');
		await post(
			"/api/upload",
			{ file: new Blob(["file"]), name: "a" },
			{ headers: { "Content-Type": "wrong" } },
			{ bodyType: "multipart" },
		);
		const request = new Request(
			"https://backend.example/upload",
			fetchMock.mock.calls[1][1],
		);
		expect(request.headers.get("Content-Type")).toMatch(
			/^multipart\/form-data; boundary=/,
		);
		expect((await request.formData()).get("name")).toBe("a");
	});

	it("sends SQL as unencoded text without adding it to the query", async () => {
		fetchMock.mockResolvedValueOnce(answer({ data: [] }));
		const sql = "SELECT 'a & b' FROM example WHERE value > 3";
		await post("/api/project-session/jdbc_json", sql, undefined, {
			bodyType: "text",
			query: { insightId: "i" },
		});
		expect(fetchMock.mock.calls[0][0]).toBe(
			"/Monolith/api/project-session/jdbc_json?insightId=i",
		);
		expect(fetchMock.mock.calls[0][1]?.body).toBe(sql);
		expect(
			new Headers(fetchMock.mock.calls[0][1]?.headers).get(
				"Content-Type",
			),
		).toBe("text/plain;charset=UTF-8");
	});

	it("preserves text, binary, stream and raw response modes", async () => {
		fetchMock.mockResolvedValueOnce(new Response("NULL"));
		await expect(get("/api/result")).resolves.toBe("NULL");
		fetchMock.mockResolvedValueOnce(new Response("csv,text"));
		await expect(
			get("/api/csv", undefined, undefined, { responseType: "text" }),
		).resolves.toBe("csv,text");
		fetchMock.mockResolvedValueOnce(new Response(new Uint8Array([0, 255])));
		const blob = await get<Blob>("/api/file", undefined, undefined, {
			responseType: "blob",
		});
		expect(new Uint8Array(await blob.arrayBuffer())).toEqual(
			new Uint8Array([0, 255]),
		);
		const streaming = new Response("data: hello\n\n");
		fetchMock.mockResolvedValueOnce(streaming);
		await expect(
			get("/api/stream", undefined, undefined, {
				responseType: "stream",
			}),
		).resolves.toBe(streaming.body);
		const raw = answer(true);
		fetchMock.mockResolvedValueOnce(raw);
		await expect(
			get("/api/raw", undefined, undefined, { responseType: "response" }),
		).resolves.toBe(raw);
	});

	it.each([
		{
			data: { errorMessage: "backend reason", message: "secondary" },
			message: "backend reason",
			headers: undefined,
		},
		{ data: "plain failure", message: "plain failure", headers: undefined },
		{
			data: "<html>Failure</html>",
			message: "Request failed with status 500",
			headers: { "Content-Type": "text/html" },
		},
	])(
		"keeps structured route errors for $message",
		async ({ data, message, headers }) => {
			fetchMock.mockResolvedValueOnce(
				typeof data === "string"
					? new Response(data, { status: 500, headers })
					: answer(data, headers, 500),
			);
			await expect(get("/api/failure")).rejects.toMatchObject({
				name: "ApiError",
				status: 500,
				data,
				endpoint: "GET /api/failure",
				message,
			});
		},
	);

	it("keeps legacy helper response shapes and error classes", async () => {
		const response = answer({ ok: true });
		fetchMock.mockResolvedValueOnce(response);
		await expect(legacyPost("/custom", { name: "a b" })).resolves.toEqual({
			response,
			data: { ok: true },
		});
		expect(fetchMock.mock.calls[0][1]?.body).toBe("name=a%20b");
		fetchMock.mockResolvedValueOnce(
			answer({ errorMessage: "denied" }, undefined, 401),
		);
		await expect(legacyPost("/custom", {})).rejects.toBeInstanceOf(
			HttpError,
		);
		fetchMock.mockResolvedValueOnce(
			answer({ message: "denied" }, undefined, 401),
		);
		await expect(legacyGet("/custom")).rejects.not.toBeInstanceOf(ApiError);
	});

	it.each(["header", "followed HTML"])(
		"honors REDIRECT_URL for %s while preserving both error identities",
		async (kind) => {
			const replace = vi.fn();
			vi.stubGlobal("window", {
				location: { origin: "https://app.example", replace },
			});
			Env.update({ REDIRECT_URL: "/signed-out" });
			const redirect = () => {
				if (kind === "header") {
					return answer({}, { redirect: "/login" });
				}
				const response = new Response("<html>Login</html>", {
					headers: { "Content-Type": "text/html" },
				});
				Object.defineProperties(response, {
					redirected: { value: true },
					url: { value: "https://backend.example/login" },
				});
				return response;
			};
			fetchMock.mockImplementation(async () => redirect());
			await expect(get("/api/private")).rejects.toBeInstanceOf(
				UnauthorizedError,
			);
			await expect(legacyGet("/api/private")).rejects.toBeInstanceOf(
				LegacyUnauthorizedError,
			);
			expect(replace).toHaveBeenNthCalledWith(
				1,
				"https://app.example/signed-out",
			);
			expect(replace).toHaveBeenNthCalledWith(
				2,
				"https://app.example/signed-out",
			);
		},
	);
});

describe("shared session sender", () => {
	it("shares the bootstrap token and session cookie between legacy helpers and routes", async () => {
		Env.update({
			CSRF: true,
			HEADLESS: true,
			ACCESS_KEY: "a",
			SECRET_KEY: "s",
		});
		const signal = new AbortController().signal;
		fetchMock
			.mockResolvedValueOnce(
				answer(true, {
					"X-CSRF-Token": "token",
					"Set-Cookie": "JSESSIONID=one; Path=/",
				}),
			)
			.mockResolvedValueOnce(
				answer(true, { "Set-Cookie": "route=two; Path=/" }),
			)
			.mockResolvedValueOnce(answer(true));
		await legacyPost(
			"/Monolith/api/write",
			{},
			{ credentials: "include", signal },
		);
		await post("/api/next", {});
		expect(fetchMock).toHaveBeenCalledTimes(3);
		const bootstrap = fetchMock.mock.calls[0][1];
		expect(bootstrap?.credentials).toBe("include");
		expect(bootstrap?.signal).toBe(signal);
		expect(new Headers(bootstrap?.headers).get("Authorization")).toBe(
			`Basic ${btoa("a:s")}`,
		);
		const firstWrite = new Headers(fetchMock.mock.calls[1][1]?.headers);
		expect(firstWrite.get("Cookie")).toBe("JSESSIONID=one");
		expect(firstWrite.get("X-CSRF-Token")).toBe("token");
		expect(
			new Headers(fetchMock.mock.calls[2][1]?.headers).get("Cookie"),
		).toBe("JSESSIONID=one; route=two");
	});

	it("leaves CSRF and manual cookies disabled by default", async () => {
		fetchMock
			.mockResolvedValueOnce(
				answer(true, { "Set-Cookie": "JSESSIONID=ignored" }),
			)
			.mockResolvedValueOnce(answer(true));
		await post("/api/one", {});
		await post("/api/two", {});
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(CSRF.cookie).toBe("");
		expect(
			new Headers(fetchMock.mock.calls[1][1]?.headers).has("Cookie"),
		).toBe(false);
	});

	it("applies an existing token to PUT and DELETE when legacy config enables CSRF", async () => {
		CSRF.isEnabled = true;
		CSRF.token = "existing";
		fetchMock.mockImplementation(async () => answer(true));
		await put("/api/one", {});
		await del("/api/two");
		expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual([
			"PUT",
			"DELETE",
		]);
		for (const [, init] of fetchMock.mock.calls) {
			expect(new Headers(init?.headers).get("X-CSRF-Token")).toBe(
				"existing",
			);
		}
	});

	it("refreshes a rejected token once and never retries a second rejection", async () => {
		Env.update({ CSRF: true });
		CSRF.token = "stale";
		fetchMock
			.mockResolvedValueOnce(
				answer(
					{ message: "stale" },
					{ "X-CSRF-Token": "Required" },
					403,
				),
			)
			.mockResolvedValueOnce(answer(true, { "X-CSRF-Token": "fresh" }))
			.mockResolvedValueOnce(
				answer(
					{ message: "still rejected" },
					{ "X-CSRF-Token": "Required" },
					403,
				),
			);
		await expect(post("/api/write", {})).rejects.toMatchObject({
			status: 403,
			message: "still rejected",
		});
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(
			new Headers(fetchMock.mock.calls[2][1]?.headers).get(
				"X-CSRF-Token",
			),
		).toBe("fresh");
	});

	it.each([false, true])(
		"does not retry an ordinary 403 when CSRF is %s",
		async (enabled) => {
			Env.update({ CSRF: enabled });
			CSRF.token = "token";
			fetchMock.mockResolvedValueOnce(
				answer({ message: "forbidden" }, undefined, 403),
			);
			await expect(post("/api/write", {})).rejects.toMatchObject({
				status: 403,
			});
			expect(fetchMock).toHaveBeenCalledTimes(1);
		},
	);

	it("does not send a write after a failed token bootstrap", async () => {
		Env.update({ CSRF: true });
		fetchMock.mockResolvedValueOnce(
			answer({ errorMessage: "signed out" }, undefined, 401),
		);
		await expect(post("/api/write", {})).rejects.toMatchObject({
			status: 401,
			message: "signed out",
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("preserves native cancellation during bootstrap without sending the write", async () => {
		Env.update({ CSRF: true });
		const pending = deferredResponse();
		const controller = new AbortController();
		fetchMock.mockReturnValueOnce(pending.promise);
		const request = post("/api/write", {}, { signal: controller.signal });
		const reason = new DOMException("cancelled", "AbortError");
		controller.abort(reason);
		pending.resolve(answer(true, { "X-CSRF-Token": "late" }));
		await expect(request).rejects.toBe(reason);
		expect(CSRF.token).toBe("");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it.each(["bootstrap", "request"])(
		"ignores late %s session headers after connection changes",
		async (phase) => {
			Env.update({ CSRF: phase === "bootstrap", HEADLESS: true });
			const pending = deferredResponse();
			fetchMock.mockReturnValueOnce(pending.promise);
			const request = post("/api/write", {});
			Env.update({ MODULE: "/other-server" });
			pending.resolve(
				answer(true, {
					"X-CSRF-Token": "old",
					"Set-Cookie": "JSESSIONID=old",
				}),
			);
			await expect(request).rejects.toMatchObject({ name: "AbortError" });
			expect(CSRF.token).toBe("");
			expect(CSRF.cookie).toBe("");
			expect(fetchMock).toHaveBeenCalledTimes(1);
		},
	);

	it("preserves abort failures while reading a route response body", async () => {
		const reason = new DOMException("cancelled", "AbortError");
		fetchMock.mockResolvedValueOnce(
			new Response(
				new ReadableStream({
					start(controller) {
						controller.error(reason);
					},
				}),
			),
		);
		await expect(get("/api/read")).rejects.toBe(reason);
	});
});
