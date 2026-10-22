import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Stubs the one DOM call readDocumentEnv makes. The suite runs in the node
 * environment, so there is no real document to build a tag in.
 */
const stubEnvTag = (contents: string | null) => {
	vi.stubGlobal("document", {
		getElementById: (id: string) =>
			id === "semoss-env" && contents !== null
				? { textContent: contents }
				: null,
	});
};

/** Imports a fresh copy of env.ts so its load-time read runs against the stub. */
const loadEnv = async () => {
	vi.resetModules();
	const { Env } = await import("./env");
	return Env;
};

/** Imports fresh copies of env.ts and the ApiClient the monolith routes use. */
const loadConnection = async () => {
	const Env = await loadEnv();
	const { ApiClient } = await import("@semoss/monolith");
	return { Env, ApiClient };
};

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("Env", () => {
	describe("reading semoss-env when the module loads", () => {
		it("applies APP and MODULE without anyone calling initialize", async () => {
			// The case this exists for: an app that imports runPixel and never
			// constructs an Insight. Without the load-time read MODULE stays empty
			// and every request goes to the page origin instead of the backend.
			stubEnvTag(
				JSON.stringify({ APP: "app-from-tag", MODULE: "/Monolith" }),
			);
			const Env = await loadEnv();
			expect(Env.APP).toBe("app-from-tag");
			expect(Env.MODULE).toBe("/Monolith");
		});

		it("leaves values empty when there is no tag", async () => {
			stubEnvTag(null);
			const Env = await loadEnv();
			expect(Env.APP).toBe("");
			expect(Env.MODULE).toBe("");
		});

		it("leaves values empty when there is no document at all", async () => {
			vi.unstubAllGlobals();
			const Env = await loadEnv();
			expect(Env.MODULE).toBe("");
		});

		it("lets a later update override the tag, so .env still wins in dev", async () => {
			stubEnvTag(JSON.stringify({ MODULE: "/Monolith" }));
			const Env = await loadEnv();
			expect(Env.MODULE).toBe("/Monolith");

			Env.update({ MODULE: "http://localhost:9090/Monolith" });
			expect(Env.MODULE).toBe("http://localhost:9090/Monolith");
		});
	});

	describe("refreshFromDocument", () => {
		it("picks up a tag that appears after load", async () => {
			stubEnvTag(null);
			const Env = await loadEnv();
			expect(Env.MODULE).toBe("");

			stubEnvTag(JSON.stringify({ MODULE: "/Monolith" }));
			Env.refreshFromDocument();
			expect(Env.MODULE).toBe("/Monolith");
		});

		it("ignores a tag that is not valid JSON", async () => {
			stubEnvTag(null);
			const Env = await loadEnv();
			Env.update({ MODULE: "/Monolith" });

			vi.spyOn(console, "warn").mockImplementation(() => undefined);
			stubEnvTag("{not json");
			Env.refreshFromDocument();
			expect(Env.MODULE).toBe("/Monolith");
		});

		it("ignores a tag that is not a JSON object", async () => {
			stubEnvTag(null);
			const Env = await loadEnv();
			Env.update({ MODULE: "/Monolith" });

			vi.spyOn(console, "warn").mockImplementation(() => undefined);
			stubEnvTag('"just a string"');
			Env.refreshFromDocument();
			expect(Env.MODULE).toBe("/Monolith");
		});

		it("keeps the existing MODULE when the tag omits it", async () => {
			stubEnvTag(null);
			const Env = await loadEnv();
			Env.update({ MODULE: "/Monolith" });

			stubEnvTag(JSON.stringify({ APP: "app-only" }));
			Env.refreshFromDocument();
			expect(Env.APP).toBe("app-only");
			expect(Env.MODULE).toBe("/Monolith");
		});

		it("keeps the existing MODULE when the tag carries a blank one", async () => {
			stubEnvTag(null);
			const Env = await loadEnv();
			Env.update({ MODULE: "/Monolith" });

			stubEnvTag(JSON.stringify({ APP: "app-id", MODULE: "   " }));
			Env.refreshFromDocument();
			expect(Env.MODULE).toBe("/Monolith");
		});
	});

	describe("configuring the monolith routes' ApiClient", () => {
		it("sends routes to MODULE from the start, the page origin until one is set", async () => {
			stubEnvTag(null);
			const { Env, ApiClient } = await loadConnection();
			expect(ApiClient.settings.basePath).toBe("");

			Env.update({ MODULE: "/Monolith" });
			expect(ApiClient.settings.basePath).toBe("/Monolith");
		});

		it("follows the semoss-env tag read at load", async () => {
			stubEnvTag(JSON.stringify({ APP: "app", MODULE: "/Monolith" }));
			const { ApiClient } = await loadConnection();
			expect(ApiClient.settings.basePath).toBe("/Monolith");
		});

		it("keeps the routes' CSRF token across updates that change no connection setting", async () => {
			stubEnvTag(null);
			const fetchMock = vi.fn(async (url: string) =>
				url.endsWith("/api/config/fetchCsrf")
					? new Response(null, {
							headers: { "X-CSRF-Token": "token" },
						})
					: new Response(
							JSON.stringify({ insightID: "i", pixelReturn: [] }),
							{
								headers: { "content-type": "application/json" },
							},
						),
			);
			vi.stubGlobal("fetch", fetchMock);
			const Env = await loadEnv();
			const { runPixel } = await import("@semoss/monolith/api/engine");
			Env.update({
				MODULE: "/Monolith",
				ACCESS_KEY: "a",
				SECRET_KEY: "s",
			});

			await runPixel({ expression: "1+1;" });
			// the semoss-env tag again on initialize, a tool message, a repeated key
			Env.update({ MODULE: "/Monolith" });
			Env.update({ TOOL: null });
			Env.update({ ACCESS_KEY: "a" });
			await runPixel({ expression: "1+1;" });

			const csrfFetches = fetchMock.mock.calls.filter(([url]) =>
				url.endsWith("/api/config/fetchCsrf"),
			);
			expect(csrfFetches).toHaveLength(1);
		});

		it("sends a key pair as basic auth, and an embed host's bearer token over it", async () => {
			stubEnvTag(null);
			const { Env, ApiClient } = await loadConnection();

			Env.update({ ACCESS_KEY: "abc", SECRET_KEY: "xyz" });
			expect(ApiClient.settings.auth).toEqual({
				type: "basic",
				accessKey: "abc",
				secretKey: "xyz",
			});

			Env.update({ BEARER_TOKEN: "token", BEARER_PROVIDER: "ms" });
			expect(ApiClient.settings.auth).toEqual({
				type: "bearer",
				token: "token",
				provider: "ms",
			});

			Env.update({
				ACCESS_KEY: "",
				SECRET_KEY: "",
				BEARER_TOKEN: "",
				BEARER_PROVIDER: "",
			});
			expect(ApiClient.settings.auth).toBeNull();
		});

		it("calls a route at MODULE with the environment's credentials", async () => {
			stubEnvTag(null);
			const fetchMock = vi.fn(
				async () =>
					new Response(JSON.stringify({ permission: "OWNER" }), {
						headers: { "content-type": "application/json" },
					}),
			);
			vi.stubGlobal("fetch", fetchMock);
			const Env = await loadEnv();
			const { getUserProjectPermission } = await import(
				"@semoss/monolith/api/auth/project"
			);
			Env.update({
				MODULE: "/Monolith",
				ACCESS_KEY: "abc",
				SECRET_KEY: "xyz",
			});

			await expect(
				getUserProjectPermission({ projectId: "p 1" }),
			).resolves.toEqual({ permission: "OWNER" });

			const [url, init] = fetchMock.mock.calls[0] as unknown as [
				string,
				RequestInit,
			];
			expect(url).toBe(
				"/Monolith/api/auth/project/getUserProjectPermission?projectId=p+1",
			);
			expect(new Headers(init.headers).get("Authorization")).toBe(
				`Basic ${btoa("abc:xyz")}`,
			);
		});
	});
});
