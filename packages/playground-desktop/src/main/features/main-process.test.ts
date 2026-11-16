// @vitest-environment node
import { describe, expect, test, vi } from "vitest";

// the modules under test import electron for their wiring, not for these helpers
vi.mock("electron", () => ({ ipcMain: {}, shell: {}, app: {}, screen: {} }));

const { isTrustedSender } = await import("./ipc/handle-ipc");
const { isExternalLink, isSignInPopup } = await import(
	"./app-window/window-security"
);
const { toLocalModuleUrl } = await import("./auth/sign-in-redirect");
const { parseSettings } = await import("./server-connection/settings-file");
const { checkServer } = await import("./server-connection/check-server");

const APP = "http://127.0.0.1:4321";
const SERVER = { url: "https://semoss.example", module: "/Monolith" };

describe("isTrustedSender", () => {
	test("accepts only the app's own origin", () => {
		expect(isTrustedSender(`${APP}/#/new`, APP)).toBe(true);
		expect(isTrustedSender("http://127.0.0.1:9999/", APP)).toBe(false);
		expect(isTrustedSender("https://login.example/", APP)).toBe(false);
		expect(isTrustedSender(undefined, APP)).toBe(false);
		expect(isTrustedSender("not a url", APP)).toBe(false);
	});
});

describe("window policy", () => {
	test("sends web and mail links out, and nothing else", () => {
		expect(isExternalLink("https://docs.example/a")).toBe(true);
		expect(isExternalLink("mailto:a@b.example")).toBe(true);
		expect(isExternalLink("file:///etc/passwd")).toBe(false);
		expect(isExternalLink("javascript:alert(1)")).toBe(false);
	});

	test("knows the SDK's sign in popup", () => {
		expect(
			isSignInPopup(
				`${APP}/Monolith/api/auth/login/ms?disableRedirect=true`,
				APP,
				"/Monolith",
			),
		).toBe(true);
		expect(
			isSignInPopup(`${APP}/Monolith/api/config`, APP, "/Monolith"),
		).toBe(false);
		expect(
			isSignInPopup(
				"https://evil.example/Monolith/api/auth/login/ms",
				APP,
				"/Monolith",
			),
		).toBe(false);
		expect(
			isSignInPopup(`${APP}/Monolith/api/auth/login/ms`, APP, undefined),
		).toBe(false);
	});
});

describe("toLocalModuleUrl", () => {
	test("brings the provider's callback back through the app", () => {
		expect(
			toLocalModuleUrl(
				"https://semoss.example/Monolith/api/auth/login/ms?code=1&state=2",
				SERVER,
				APP,
			),
		).toBe(`${APP}/Monolith/api/auth/login/ms?code=1&state=2`);
	});

	test("leaves everything else alone", () => {
		expect(
			toLocalModuleUrl(
				"https://login.microsoftonline.com/x",
				SERVER,
				APP,
			),
		).toBeNull();
		expect(
			toLocalModuleUrl(
				"https://semoss.example/SemossWeb/app",
				SERVER,
				APP,
			),
		).toBeNull();
		expect(
			toLocalModuleUrl("https://semoss.example/MonolithX/a", SERVER, APP),
		).toBeNull();
		expect(
			toLocalModuleUrl("https://semoss.example/Monolith/a", null, APP),
		).toBeNull();
	});
});

describe("parseSettings", () => {
	test("falls back to defaults for a corrupt or tampered file", () => {
		expect(parseSettings("{nope").server).toBeNull();
		expect(
			parseSettings(
				JSON.stringify({ server: { url: "http://evil.example" } }),
			).server,
		).toBeNull();
		expect(parseSettings(JSON.stringify({ port: 99_999 })).port).toBeNull();
	});

	test("reads a valid file", () => {
		const settings = parseSettings(
			JSON.stringify({
				server: SERVER,
				port: 4321,
				window: { width: 900, height: 700, isMaximized: true },
			}),
		);
		expect(settings.server).toEqual(SERVER);
		expect(settings.port).toBe(4321);
		expect(settings.window).toEqual({
			x: undefined,
			y: undefined,
			width: 900,
			height: 700,
			isMaximized: true,
		});
	});
});

describe("checkServer", () => {
	const respond = (response: Response) =>
		vi.fn<typeof fetch>().mockResolvedValue(response);

	test("accepts a server that answers with a config", async () => {
		const fetchImpl = respond(new Response(JSON.stringify({ logins: {} })));
		await expect(checkServer(SERVER, fetchImpl)).resolves.toEqual({
			ok: true,
		});
		expect(fetchImpl.mock.calls[0]?.[0]).toBe(
			"https://semoss.example/Monolith/api/config",
		);
	});

	test("explains a wrong address", async () => {
		const notFound = await checkServer(
			SERVER,
			respond(new Response("nope", { status: 404 })),
		);
		expect(notFound).toEqual({
			ok: false,
			message: expect.stringContaining("404"),
		});
		const notJson = await checkServer(
			SERVER,
			respond(new Response("<html>")),
		);
		expect(notJson.ok).toBe(false);
		const unreachable = await checkServer(
			SERVER,
			vi
				.fn<typeof fetch>()
				.mockRejectedValue(new TypeError("fetch failed")),
		);
		expect(unreachable).toEqual({
			ok: false,
			message: expect.stringContaining("could not be reached"),
		});
	});
});
