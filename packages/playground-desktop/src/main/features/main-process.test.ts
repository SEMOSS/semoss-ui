// @vitest-environment node

import { describe, expect, test, vi } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isExternalLink, isSignInPopup } from "./app-window/window-security";
import { toLocalModuleUrl } from "./auth/sign-in-redirect";
import { isTrustedSender } from "./ipc/handle-ipc";
import { checkServer } from "./server-connection/check-server";
import {
	CONFIG_FILE_NAME,
	openDesktopConfig,
	parseDesktopConfig,
} from "./server-connection/desktop-config";
import { removeUnusedPartitions } from "./server-connection/server-sessions";

// the modules under test import electron for their wiring, not for these helpers
vi.mock("electron", () => ({
	ipcMain: {},
	shell: {},
	app: {},
	screen: {},
	session: {},
}));

/** The app's local origin. */
const APP = "http://127.0.0.1:4321";
/** The hosted server the app signs in to. */
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

describe("parseDesktopConfig", () => {
	/** A second hosted server. */
	const OTHER = { url: "https://other.example", module: "/team/Monolith" };
	/** Partitions the app would make. */
	const FIRST = "persist:server-00000000-0000-4000-8000-000000000001";
	const SECOND = "persist:server-00000000-0000-4000-8000-000000000002";

	test("falls back to defaults for a corrupt or tampered file", () => {
		expect(parseDesktopConfig("{nope").servers).toEqual([]);
		expect(
			parseDesktopConfig(
				JSON.stringify({
					servers: [{ url: "http://evil.example", partition: FIRST }],
				}),
			).servers,
		).toEqual([]);
		// only the app's own partitions; not the default session or another app's
		expect(
			parseDesktopConfig(
				JSON.stringify({
					servers: [
						{ ...SERVER, partition: "" },
						{ ...OTHER, partition: "persist:anything" },
					],
				}),
			).servers,
		).toEqual([]);
		expect(
			parseDesktopConfig(JSON.stringify({ port: 99_999 })).port,
		).toBeNull();
	});

	test("reads a valid file", () => {
		const config = parseDesktopConfig(
			JSON.stringify({
				version: 1,
				servers: [{ ...SERVER, partition: FIRST }],
				active: FIRST,
				port: 4321,
				window: { width: 900, height: 700, isMaximized: true },
			}),
		);
		expect(config.servers).toEqual([{ ...SERVER, partition: FIRST }]);
		expect(config.active).toBe(FIRST);
		expect(config.port).toBe(4321);
		expect(config.window).toEqual({
			x: undefined,
			y: undefined,
			width: 900,
			height: 700,
			isMaximized: true,
		});
	});

	test("drops duplicates, and a lost active falls back to the first", () => {
		const config = parseDesktopConfig(
			JSON.stringify({
				servers: [
					{ ...SERVER, partition: FIRST },
					{ ...OTHER, partition: SECOND },
					{ ...OTHER, partition: FIRST },
				],
				active: "persist:server-gone",
			}),
		);
		expect(config.servers).toEqual([
			{ ...SERVER, partition: FIRST },
			{ ...OTHER, partition: SECOND },
		]);
		expect(config.active).toBe(FIRST);
	});
});

describe("openDesktopConfig", () => {
	test("keeps a sign in per server, and forgetting one hands over", () => {
		const folder = mkdtempSync(join(tmpdir(), "smss-desktop-"));
		const config = openDesktopConfig(folder);
		const first = config.useServer(SERVER);
		const second = config.useServer({
			url: "https://other.example",
			module: "/Monolith",
		});
		expect(first.partition).toMatch(/^persist:server-/);
		expect(second.partition).not.toBe(first.partition);
		expect(config.server).toEqual(second);
		// switching back reuses the first server's partition
		expect(config.useServer(SERVER)).toEqual(first);
		expect(config.servers).toHaveLength(2);

		expect(config.forgetServer(SERVER)).toEqual(first);
		expect(config.server).toEqual(second);
		expect(config.forgetServer(SERVER)).toBeNull();
		// what was saved is what the next launch reads
		expect(
			JSON.parse(readFileSync(join(folder, CONFIG_FILE_NAME), "utf8")),
		).toMatchObject({ version: 1, active: second.partition });
		expect(openDesktopConfig(folder).servers).toEqual([second]);
	});
});

describe("removeUnusedPartitions", () => {
	test("deletes only forgotten servers' folders", () => {
		const folder = mkdtempSync(join(tmpdir(), "smss-desktop-"));
		const kept = "server-00000000-0000-4000-8000-000000000001";
		const gone = "server-00000000-0000-4000-8000-000000000002";
		for (const name of [kept, gone, "other-app"]) {
			mkdirSync(join(folder, "Partitions", name), { recursive: true });
		}
		removeUnusedPartitions(folder, ["", `persist:${kept}`]);
		expect(existsSync(join(folder, "Partitions", kept))).toBe(true);
		expect(existsSync(join(folder, "Partitions", gone))).toBe(false);
		expect(existsSync(join(folder, "Partitions", "other-app"))).toBe(true);
	});

	test("does nothing before any server has a partition", () => {
		const folder = mkdtempSync(join(tmpdir(), "smss-desktop-"));
		expect(() => removeUnusedPartitions(folder, [])).not.toThrow();
	});
});

describe("checkServer", () => {
	/** A fetch that always answers with this response. */
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
