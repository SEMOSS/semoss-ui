import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Config, CSRF, Env, Insight } from "@semoss/sdk";

// Exercise the real SDK lifecycle/transport against the preview's wire contract.
// The backend tests independently verify the matching config and SDK envelopes.
const previewConfig = {
	security: false,
	csrf: false,
	logins: { NATIVE: "Regression test preview" },
	loginDetails: {
		NATIVE: { id: "app-test-preview", name: "Regression test preview" },
	},
	primaryLogin: "NATIVE",
	availableProviders: [],
	databaseMetaKeys: [],
	projectMetaKeys: [],
	theme: {},
	insightConfig: {},
	python: false,
	r: false,
	anonymousUsers: false,
	notificationEnabled: false,
	timeout: 30,
};
const transport = vi.fn<typeof fetch>();
const calls: { expression: string; insightId: string | null }[] = [];
const envelope = (output: unknown, error = false) => ({
	insightID: "preview-insight",
	pixelReturn: [
		{
			isMeta: true,
			pixelId: "0",
			pixelExpression: "",
			timeToRun: 0,
			operationType: [error ? "ERROR" : "OPERATION"],
			output,
		},
	],
});

beforeEach(() => {
	Config.reset();
	Env.update({
		MODULE: "http://localhost/preview",
		APP: "app",
		ACCESS_KEY: "",
		SECRET_KEY: "",
		CSRF: false,
		TOOL: null,
	});
	CSRF.isEnabled = false;
	CSRF.token = "";
	calls.length = 0;
	transport.mockReset();
	vi.stubGlobal("fetch", transport);
	transport.mockImplementation(async (url, options) => {
		if (String(url).endsWith("/api/config"))
			return Response.json(previewConfig);
		if (!String(url).endsWith("/api/engine/runPixel"))
			throw new Error("Unexpected preview endpoint");
		const body = new URLSearchParams(String(options?.body));
		calls.push({
			expression: body.get("expression") ?? "",
			insightId: body.get("insightId"),
		});
		return Response.json(envelope(true));
	});
});
afterEach(() => {
	vi.unstubAllGlobals();
	Config.reset();
});

it("initializes through the real SDK without access keys and runs queries in the preview insight", async () => {
	const insight = new Insight();
	await insight.initialize();
	expect(insight.isAuthorized).toBe(true);
	expect(insight.isReady).toBe(true);
	expect(insight.insightId).toBe("preview-insight");
	expect(calls[0]).toEqual({
		expression: 'LoadApp("app");',
		insightId: null,
	});
	await insight.actions.run(
		'SqlQuery(database=["source"],query=["SELECT TITLE FROM ITEMS LIMIT 10"]);',
	);
	expect(calls[1].insightId).toBe("preview-insight");
	await insight.destroy();
	expect(calls[2].expression).toBe("DropInsight()");
	expect(insight.isReady).toBe(false);
});

it("keeps preview SQL diagnostics in the real SDK's error response", async () => {
	const insight = new Insight();
	await insight.initialize();
	const reason =
		"WORKFLOW: TEST_DATABASE_SQL_UNSUPPORTED: SqlQuery [SELECT ? FROM ?]: query is unavailable";
	transport.mockResolvedValueOnce(Response.json(envelope(reason, true)));
	await expect(
		insight.actions.run(
			'SqlQuery(database=["source"],query=["SELECT CURRENT_USER() FROM ITEMS"]);',
		),
	).rejects.toThrow(reason);
});
