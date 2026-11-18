// @vitest-environment node

import { describe, expect, test, vi } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	isAppPage,
	isConnectPopup,
	isExternalLink,
	isSignInPopup,
} from "./app-window/window-security";
import { pickLocalOrigin, toLocalModuleUrl } from "./auth/sign-in-redirect";
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
/** The local origin tool views are framed from. */
const TOOL_FRAMES = "http://127.0.0.1:4322";
/** The hosted server the app signs in to. */
const SERVER = { url: "https://semoss.example", module: "/Monolith" };

describe("isTrustedSender", () => {
	/**
	 * A calling frame, a top one unless it has a parent.
	 *
	 * @param url - The frame's URL.
	 * @param parent - Its parent frame, or null for a top frame.
	 * @returns The frame, as the check reads it.
	 */
	const frame = (url: string, parent: object | null = null) =>
		({ url, parent }) as Parameters<typeof isTrustedSender>[0];

	test("accepts only the app's own page, in its top frame", () => {
		expect(isTrustedSender(frame(`${APP}/#/new`), APP)).toBe(true);
		expect(isTrustedSender(frame(`${APP}/index.html`), APP)).toBe(true);
		expect(isTrustedSender(frame("http://127.0.0.1:9999/"), APP)).toBe(
			false,
		);
		expect(isTrustedSender(frame("https://login.example/"), APP)).toBe(
			false,
		);
		expect(isTrustedSender(frame("not a url"), APP)).toBe(false);
		expect(isTrustedSender(undefined, APP)).toBe(false);
		expect(isTrustedSender(null, APP)).toBe(false);
	});

	test("refuses a server page on the app's origin, and any child frame", () => {
		expect(
			isTrustedSender(
				frame(`${APP}/Monolith/public_home/app/portals/x.html`),
				APP,
			),
		).toBe(false);
		expect(isTrustedSender(frame(`${APP}/`, frame(`${APP}/`)), APP)).toBe(
			false,
		);
		expect(isTrustedSender(frame(`${TOOL_FRAMES}/`), APP)).toBe(false);
	});
});

describe("window policy", () => {
	test("sends web and mail links out, and nothing else", () => {
		expect(isExternalLink("https://docs.example/a")).toBe(true);
		expect(isExternalLink("mailto:a@b.example")).toBe(true);
		expect(isExternalLink("file:///etc/passwd")).toBe(false);
		expect(isExternalLink("javascript:alert(1)")).toBe(false);
	});

	test("keeps the window on the app's own page", () => {
		expect(isAppPage(`${APP}/`, APP)).toBe(true);
		expect(isAppPage(`${APP}/?x=1#/room/1`, APP)).toBe(true);
		expect(isAppPage(`${APP}/index.html`, APP)).toBe(true);
		expect(isAppPage(`${APP}/Monolith/public_home/a/portals/`, APP)).toBe(
			false,
		);
		expect(isAppPage(`${APP}/Monolith/api/auth/login/ms`, APP)).toBe(false);
		expect(isAppPage(`${TOOL_FRAMES}/`, APP)).toBe(false);
		expect(isAppPage("not a url", APP)).toBe(false);
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

	test("knows the SDK's connector popup, which opens blank", () => {
		expect(isConnectPopup("about:blank", "semoss-connect")).toBe(true);
		expect(isConnectPopup("", "semoss-connect")).toBe(true);
		expect(isConnectPopup("about:blank", "")).toBe(false);
		expect(isConnectPopup("about:blank", "other")).toBe(false);
		expect(isConnectPopup("https://evil.example/", "semoss-connect")).toBe(
			false,
		);
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

	test("keeps frames and tool views' calls on the tool frame origin", () => {
		const origins = { appOrigin: APP, toolFrameOrigin: TOOL_FRAMES };
		expect(pickLocalOrigin({ resourceType: "subFrame" }, origins)).toBe(
			TOOL_FRAMES,
		);
		expect(
			pickLocalOrigin(
				{ resourceType: "xhr", initiatorOrigin: TOOL_FRAMES },
				origins,
			),
		).toBe(TOOL_FRAMES);
		expect(pickLocalOrigin({ resourceType: "mainFrame" }, origins)).toBe(
			APP,
		);
		expect(
			pickLocalOrigin(
				{ resourceType: "xhr", initiatorOrigin: APP },
				origins,
			),
		).toBe(APP);
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
		expect(
			parseDesktopConfig(JSON.stringify({ toolFramePort: "4322" }))
				.toolFramePort,
		).toBeNull();
		for (const language of ["en-US", "<script>", 7, ""]) {
			expect(
				parseDesktopConfig(JSON.stringify({ language })).language,
			).toBeNull();
		}
		expect(
			parseDesktopConfig(JSON.stringify({ language: "ja" })).language,
		).toBe("ja");
	});

	test("reads a valid file", () => {
		const config = parseDesktopConfig(
			JSON.stringify({
				version: 1,
				servers: [{ ...SERVER, partition: FIRST }],
				active: FIRST,
				port: 4321,
				toolFramePort: 4322,
				window: { width: 900, height: 700, isMaximized: true },
			}),
		);
		expect(config.servers).toEqual([{ ...SERVER, partition: FIRST }]);
		expect(config.active).toBe(FIRST);
		expect(config.port).toBe(4321);
		expect(config.toolFramePort).toBe(4322);
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

	test("keeps the language for the next launch", () => {
		const folder = mkdtempSync(join(tmpdir(), "smss-desktop-"));
		const config = openDesktopConfig(folder);
		expect(config.language).toBeNull();
		config.setLanguage("fr");
		expect(config.language).toBe("fr");
		expect(openDesktopConfig(folder).language).toBe("fr");
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
