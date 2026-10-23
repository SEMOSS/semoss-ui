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

	describe("configuring typed routes directly", () => {
		it.each(["", "/Monolith/", "https://backend.example/Monolith/"])(
			"uses MODULE %s for route calls and URL builders",
			async (module) => {
				stubEnvTag(null);
				const Env = await loadEnv();
				const { url } = await import("./utility/url");
				const { getUserProjectPermission } = await import(
					"./api/monolith/auth/project"
				);
				const fetchMock = vi.fn<typeof fetch>(async () =>
					Response.json({ permission: "OWNER" }),
				);
				vi.stubGlobal("fetch", fetchMock);
				Env.update({ MODULE: module });
				const base = module.replace(/\/+$/, "");
				expect(url("/api/config")).toBe(`${base}/api/config`);
				await getUserProjectPermission({ projectId: "p 1" });
				expect(fetchMock.mock.calls[0][0]).toBe(
					`${base}/api/auth/project/getUserProjectPermission?projectId=p+1`,
				);
			},
		);

		it("loads semoss-env when a route is imported without the SDK root", async () => {
			stubEnvTag(
				JSON.stringify({ APP: "app", MODULE: "/from-document" }),
			);
			vi.resetModules();
			const fetchMock = vi.fn<typeof fetch>(async () =>
				Response.json({ permission: "OWNER" }),
			);
			vi.stubGlobal("fetch", fetchMock);
			const { getUserProjectPermission } = await import(
				"./api/monolith/auth/project"
			);
			await getUserProjectPermission({ projectId: "project" });
			expect(fetchMock.mock.calls[0][0]).toBe(
				"/from-document/api/auth/project/getUserProjectPermission?projectId=project",
			);
		});

		it("keeps the shared token across updates that do not change the connection", async () => {
			stubEnvTag(null);
			const Env = await loadEnv();
			const { CSRF } = await import("./lib/fetch");
			const { runPixel } = await import("./api/monolith/engine");
			const fetchMock = vi.fn<typeof fetch>(async (input) =>
				String(input).endsWith("/api/config/fetchCsrf")
					? new Response(null, {
							headers: { "X-CSRF-Token": "token" },
						})
					: Response.json({ insightID: "i", pixelReturn: [] }),
			);
			vi.stubGlobal("fetch", fetchMock);
			Env.update({
				MODULE: "/Monolith",
				ACCESS_KEY: "a",
				SECRET_KEY: "s",
				CSRF: true,
			});
			await runPixel({ expression: "1+1;" });
			CSRF.cookie = "JSESSIONID=session";
			Env.update({ MODULE: "/Monolith", ACCESS_KEY: "a", TOOL: null });
			await runPixel({ expression: "1+1;" });
			expect(
				fetchMock.mock.calls.filter(([input]) =>
					String(input).endsWith("/api/config/fetchCsrf"),
				),
			).toHaveLength(1);
			expect(CSRF.cookie).toBe("JSESSIONID=session");
		});

		it("uses basic credentials, prefers bearer, and removes cleared credentials", async () => {
			stubEnvTag(null);
			const Env = await loadEnv();
			const { getUserProjectPermission } = await import(
				"./api/monolith/auth/project"
			);
			const fetchMock = vi.fn<typeof fetch>(async () =>
				Response.json({ permission: "OWNER" }),
			);
			vi.stubGlobal("fetch", fetchMock);
			Env.update({ ACCESS_KEY: "abc", SECRET_KEY: "xyz" });
			await getUserProjectPermission({ projectId: "p" });
			expect(
				new Headers(fetchMock.mock.calls[0][1]?.headers).get(
					"Authorization",
				),
			).toBe(`Basic ${btoa("abc:xyz")}`);
			Env.update({ BEARER_TOKEN: "token", BEARER_PROVIDER: "ms" });
			await getUserProjectPermission({ projectId: "p" });
			const bearerHeaders = new Headers(
				fetchMock.mock.calls[1][1]?.headers,
			);
			expect(bearerHeaders.get("Authorization")).toBe("Bearer token");
			expect(bearerHeaders.get("Bearer-Provider")).toBe("ms");
			Env.update({
				ACCESS_KEY: "",
				SECRET_KEY: "",
				BEARER_TOKEN: "",
				BEARER_PROVIDER: "",
			});
			await getUserProjectPermission({ projectId: "p" });
			expect(
				new Headers(fetchMock.mock.calls[2][1]?.headers).has(
					"Authorization",
				),
			).toBe(false);
		});

		it("clears the session when the backend, effective identity, or headless mode changes", async () => {
			stubEnvTag(null);
			const Env = await loadEnv();
			const { CSRF } = await import("./lib/fetch");
			for (const update of [
				{ MODULE: "/other" },
				{ ACCESS_KEY: "a", SECRET_KEY: "s" },
				{ BEARER_TOKEN: "token" },
				{ BEARER_PROVIDER: "ms" },
				{ HEADLESS: true },
			]) {
				CSRF.token = "old-token";
				CSRF.cookie = "JSESSIONID=old-session";
				Env.update(update);
				expect(CSRF.token).toBe("");
				expect(CSRF.cookie).toBe("");
			}
			CSRF.token = "bearer-session";
			Env.update({ ACCESS_KEY: "ignored-while-bearer-is-set" });
			expect(CSRF.token).toBe("bearer-session");
		});
	});
});
