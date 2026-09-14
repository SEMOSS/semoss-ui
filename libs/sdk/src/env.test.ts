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
});
