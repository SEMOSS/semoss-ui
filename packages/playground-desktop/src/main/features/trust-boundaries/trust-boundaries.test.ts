// @vitest-environment node

import { describe, expect, test, vi } from "vitest";
import { EventEmitter } from "node:events";
import { isToolFrameOrigin } from "../../../contract/ipc-contract";
import { appPagePolicy } from "./content-security-policy";
import { isAppMainFrame } from "./ipc-sender";
import { isPermissionAllowed, lockPermissions } from "./permissions";
import {
	guardToolFrameIsolation,
	sharesAppProcess,
} from "./tool-frame-isolation";
import {
	answerRequest,
	headersFor,
	TOOL_FRAME_KEY_HEADER,
} from "./web-requests";
import { isLoopbackFrameUrl } from "./zones";

/** The app's local origin. */
const APP = "http://127.0.0.1:4321";
/** The local origin tool views are framed from. */
const TOOLS = "http://tools.localhost:4322";
/** The hosted server the app signs in to. */
const SERVER = { url: "https://semoss.example", module: "/Monolith" };

describe("isAppMainFrame (IPC sender)", () => {
	/** What the check reads of a frame and of a window's contents. */
	type Frame = NonNullable<
		Parameters<typeof isAppMainFrame>[0]["senderFrame"]
	>;
	type Contents = Parameters<typeof isAppMainFrame>[0]["sender"];

	/** A frame, a top one unless it has a parent. */
	const frame = (url: string, parent: Frame | null = null): Frame =>
		({ url, parent }) as Frame;
	/** A window's contents with this top frame. */
	const contents = (mainFrame: Frame): Contents =>
		({ mainFrame }) as unknown as Contents;

	const appFrame = frame(`${APP}/#/new`);
	const app = contents(appFrame);

	test("accepts the app page, the top frame of the app's window", () => {
		expect(
			isAppMainFrame({ sender: app, senderFrame: appFrame }, app, APP),
		).toBe(true);
		const indexFrame = frame(`${APP}/index.html`);
		const index = contents(indexFrame);
		expect(
			isAppMainFrame(
				{ sender: index, senderFrame: indexFrame },
				index,
				APP,
			),
		).toBe(true);
	});

	test("refuses every other window, frame and page", () => {
		// another window, such as a sign in popup, even on the app's page
		const popupFrame = frame(`${APP}/`);
		const popup = contents(popupFrame);
		expect(
			isAppMainFrame(
				{ sender: popup, senderFrame: popupFrame },
				app,
				APP,
			),
		).toBe(false);
		// a frame inside the app's window
		expect(
			isAppMainFrame(
				{ sender: app, senderFrame: frame(`${APP}/`, appFrame) },
				app,
				APP,
			),
		).toBe(false);
		// a tool view, a server page on the app's origin, a gone frame
		for (const url of [
			`${TOOLS}/`,
			`${APP}/Monolith/public_home/a/portals/x.html`,
		]) {
			const other = frame(url);
			const otherContents = contents(other);
			expect(
				isAppMainFrame(
					{ sender: otherContents, senderFrame: other },
					otherContents,
					APP,
				),
			).toBe(false);
		}
		expect(
			isAppMainFrame({ sender: app, senderFrame: null }, app, APP),
		).toBe(false);
		// the window is closed
		expect(
			isAppMainFrame(
				{ sender: app, senderFrame: appFrame },
				undefined,
				APP,
			),
		).toBe(false);
	});
});

describe("permissions", () => {
	/** A request from the app page's top frame, in the app's window. */
	const fromApp = {
		requestingUrl: `${APP}/#/room/1`,
		isMainFrame: true,
		isAppWindow: true,
	};

	test("gives the app page its few permissions, and the microphone only", () => {
		for (const permission of [
			"clipboard-read",
			"clipboard-sanitized-write",
			"fullscreen",
		]) {
			expect(isPermissionAllowed({ ...fromApp, permission }, APP)).toBe(
				true,
			);
		}
		expect(
			isPermissionAllowed(
				{ ...fromApp, permission: "media", mediaTypes: ["audio"] },
				APP,
			),
		).toBe(true);
		expect(
			isPermissionAllowed(
				{
					...fromApp,
					permission: "media",
					mediaTypes: ["audio", "video"],
				},
				APP,
			),
		).toBe(false);
		expect(
			isPermissionAllowed({ ...fromApp, permission: "media" }, APP),
		).toBe(false);
	});

	test("denies everything else, and everyone else", () => {
		for (const permission of [
			"openExternal",
			"geolocation",
			"notifications",
			"hid",
			"usb",
			"serial",
			"display-capture",
		]) {
			expect(isPermissionAllowed({ ...fromApp, permission }, APP)).toBe(
				false,
			);
		}
		const permission = "clipboard-read";
		// a tool view, a frame in the app's window, a popup, a server page
		expect(
			isPermissionAllowed(
				{ ...fromApp, permission, requestingUrl: `${TOOLS}/x` },
				APP,
			),
		).toBe(false);
		expect(
			isPermissionAllowed(
				{ ...fromApp, permission, isMainFrame: false },
				APP,
			),
		).toBe(false);
		expect(
			isPermissionAllowed(
				{ ...fromApp, permission, isAppWindow: false },
				APP,
			),
		).toBe(false);
		expect(
			isPermissionAllowed(
				{
					...fromApp,
					permission,
					requestingUrl: `${APP}/Monolith/api/auth/login/ms`,
				},
				APP,
			),
		).toBe(false);
	});

	test("locks a session's requests, checks and devices", () => {
		const session = {
			setPermissionRequestHandler: vi.fn(),
			setPermissionCheckHandler: vi.fn(),
			setDevicePermissionHandler: vi.fn(),
		};
		const appContents = { id: 1 };
		lockPermissions(
			session as unknown as Parameters<typeof lockPermissions>[0],
			APP,
			() => appContents as never,
		);
		const [request] =
			session.setPermissionRequestHandler.mock.calls[0] ?? [];
		const callback = vi.fn();
		request(appContents, "clipboard-read", callback, {
			requestingUrl: `${APP}/`,
			isMainFrame: true,
		});
		request({ id: 2 }, "clipboard-read", callback, {
			requestingUrl: `${APP}/`,
			isMainFrame: true,
		});
		expect(callback.mock.calls).toEqual([[true], [false]]);
		const [check] = session.setPermissionCheckHandler.mock.calls[0] ?? [];
		expect(
			check(appContents, "clipboard-read", APP, { isMainFrame: true }),
		).toBe(true);
		expect(check(null, "clipboard-read", APP, { isMainFrame: true })).toBe(
			false,
		);
		expect(
			check(appContents, "clipboard-read", TOOLS, { isMainFrame: true }),
		).toBe(false);
		const [devices] =
			session.setDevicePermissionHandler.mock.calls[0] ?? [];
		expect(devices()).toBe(false);
	});
});

describe("web requests", () => {
	const guards = {
		appOrigin: APP,
		toolFrameOrigin: TOOLS,
		toolFrameKey: "launch-key",
		getServer: () => SERVER,
		getAppWebContentsId: () => 7,
	};

	test("never frames this machine's loopback but the tool frame origin", () => {
		for (const url of [
			`${APP}/`,
			`${APP}/SemossWeb/browser-automation/dist/`,
			"http://127.0.0.1:5181/",
			"http://localhost:8080/",
			"http://evil.localhost:4322/",
			"http://[::1]:4321/",
			"http://127.1.2.3/",
			"http://localhost./",
			"http://tools.localhost.:4322/",
			"http://[::ffff:127.0.0.1]/",
			"http://2130706433/",
			"http://[::]/",
		]) {
			for (const resourceType of ["subFrame", "object"] as const) {
				expect(answerRequest({ url, resourceType }, guards)).toEqual({
					cancel: true,
				});
			}
		}
		expect(
			answerRequest(
				{
					url: `${TOOLS}/Monolith/public_home/a/portals/`,
					resourceType: "subFrame",
				},
				guards,
			),
		).toEqual({});
		expect(
			answerRequest(
				{ url: "https://preview.example/x", resourceType: "subFrame" },
				guards,
			),
		).toEqual({});
		// the app's own calls and its window are not frames
		expect(
			answerRequest(
				{ url: `${APP}/Monolith/api/config`, resourceType: "xhr" },
				guards,
			),
		).toEqual({});
		expect(
			answerRequest(
				{ url: `${APP}/`, resourceType: "mainFrame" },
				guards,
			),
		).toEqual({});
	});

	test("brings a server on this machine back too, rather than refusing it", () => {
		const local = { url: "http://localhost:8080", module: "/Monolith" };
		expect(
			answerRequest(
				{
					url: "http://localhost:8080/Monolith/public_home/a/portals/",
					resourceType: "subFrame",
				},
				{ ...guards, getServer: () => local },
			),
		).toEqual({ redirectURL: `${TOOLS}/Monolith/public_home/a/portals/` });
	});

	test("brings the server's own URLs back through the local origins", () => {
		expect(
			answerRequest(
				{
					url: "https://semoss.example/Monolith/api/auth/login/ms?code=1",
					resourceType: "mainFrame",
				},
				guards,
			),
		).toEqual({ redirectURL: `${APP}/Monolith/api/auth/login/ms?code=1` });
		expect(
			answerRequest(
				{
					url: "https://semoss.example/Monolith/public_home/a/portals/",
					resourceType: "subFrame",
				},
				guards,
			),
		).toEqual({ redirectURL: `${TOOLS}/Monolith/public_home/a/portals/` });
	});

	test("gives the tool frame key to tool views in the app's window only", () => {
		const url = `${TOOLS}/Monolith/api/config`;
		/** A request to the tool frame origin. */
		const request = (
			overrides: Partial<Parameters<typeof headersFor>[0]>,
		): Parameters<typeof headersFor>[0] => ({
			url,
			webContentsId: 7,
			initiatorOrigin: TOOLS,
			resourceType: "xhr",
			requestHeaders: {},
			...overrides,
		});
		const keyed = { [TOOL_FRAME_KEY_HEADER]: "launch-key" };
		// a tool view's own call, its worker's (no window), the app page loading a tool frame
		expect(
			headersFor(request({ requestHeaders: { Accept: "*/*" } }), guards),
		).toEqual({ Accept: "*/*", ...keyed });
		expect(
			headersFor(request({ webContentsId: undefined }), guards),
		).toEqual(keyed);
		expect(
			headersFor(
				request({ initiatorOrigin: APP, resourceType: "subFrame" }),
				guards,
			),
		).toEqual(keyed);
		// another window or popup; another frame in the window, such as a model
		// preview; the app page calling the tool frame origin itself; a guessed header
		for (const other of [
			request({ webContentsId: 8 }),
			request({ initiatorOrigin: "https://preview.example" }),
			request({ initiatorOrigin: APP, resourceType: "xhr" }),
			request({
				initiatorOrigin: APP,
				resourceType: "subFrame",
				webContentsId: 8,
			}),
			request({
				webContentsId: 8,
				requestHeaders: { "X-Semoss-Desktop-Key": "guess" },
			}),
		]) {
			expect(headersFor(other, guards)).toEqual({});
		}
		// stripped from any other host, so a redirect never carries it away
		expect(
			headersFor(
				request({
					url: "https://login.example/",
					requestHeaders: { [TOOL_FRAME_KEY_HEADER]: "launch-key" },
				}),
				guards,
			),
		).toEqual({});
		// nor while the app's window is closed
		expect(
			headersFor(request({}), {
				...guards,
				getAppWebContentsId: () => undefined,
			}),
		).toEqual({});
	});
});

describe("tool frame isolation", () => {
	test("finds a tool view in the app page's process", () => {
		const toolFrame = {
			url: `${TOOLS}/x`,
			isMainFrame: false,
			processId: 5,
		};
		expect(sharesAppProcess(toolFrame, 5, TOOLS)).toBe(true);
		expect(sharesAppProcess({ ...toolFrame, processId: 6 }, 5, TOOLS)).toBe(
			false,
		);
		expect(
			sharesAppProcess(
				{ ...toolFrame, url: "https://x.example/" },
				5,
				TOOLS,
			),
		).toBe(false);
		expect(
			sharesAppProcess(
				{ url: `${APP}/`, isMainFrame: true, processId: 5 },
				5,
				TOOLS,
			),
		).toBe(false);
	});

	test("calls the breach for a tool frame that loads in the app's process", () => {
		const contents = Object.assign(new EventEmitter(), {
			mainFrame: { processId: 5 },
		});
		const onBreach = vi.fn();
		guardToolFrameIsolation(contents as never, TOOLS, onBreach);
		contents.emit(
			"did-frame-navigate",
			{},
			`${TOOLS}/a`,
			200,
			"OK",
			false,
			9,
			1,
		);
		contents.emit(
			"did-frame-navigate",
			{},
			`${APP}/`,
			200,
			"OK",
			true,
			5,
			1,
		);
		expect(onBreach).not.toHaveBeenCalled();
		contents.emit(
			"did-frame-navigate",
			{},
			`${TOOLS}/b`,
			200,
			"OK",
			false,
			5,
			2,
		);
		expect(onBreach).toHaveBeenCalledWith({
			url: `${TOOLS}/b`,
			isMainFrame: false,
			processId: 5,
		});
	});
});

describe("zones and origins", () => {
	test("the preload hands the page only a tool frame origin", () => {
		expect(isToolFrameOrigin(TOOLS)).toBe(true);
		for (const origin of [
			"http://127.0.0.1:4322",
			"https://tools.localhost:4322",
			"http://tools.localhost",
			"http://tools.localhost:4322/",
			"http://evil.tools.localhost:4322",
			"",
		]) {
			expect(isToolFrameOrigin(origin)).toBe(false);
		}
	});

	test("knows this machine's loopback", () => {
		expect(isLoopbackFrameUrl(`${APP}/`, TOOLS)).toBe(true);
		expect(isLoopbackFrameUrl(`${TOOLS}/`, TOOLS)).toBe(false);
		expect(
			isLoopbackFrameUrl("blob:http://127.0.0.1:4321/abc", TOOLS),
		).toBe(false);
		expect(isLoopbackFrameUrl("data:text/html,x", TOOLS)).toBe(false);
		expect(isLoopbackFrameUrl("https://semoss.example/", TOOLS)).toBe(
			false,
		);
	});
});

describe("appPagePolicy", () => {
	const policy = appPagePolicy({ appOrigin: APP, toolFrameOrigin: TOOLS });
	/** One directive's sources. */
	const directive = (name: string) =>
		policy
			.split("; ")
			.find((part) => part.startsWith(`${name} `))
			?.split(" ")
			.slice(1) ?? [];

	test("runs only the app's own built scripts", () => {
		expect(directive("script-src")).toEqual([
			`${APP}/assets/`,
			"'unsafe-eval'",
			"'wasm-unsafe-eval'",
			"blob:",
		]);
		expect(directive("script-src")).not.toContain("'self'");
		expect(directive("worker-src")).not.toContain("'self'");
	});

	test("frames tool views and https only, and is never framed", () => {
		expect(directive("frame-src")).toEqual([
			TOOLS,
			"blob:",
			"data:",
			"https:",
		]);
		expect(directive("frame-ancestors")).toEqual(["'none'"]);
		expect(directive("form-action")).toEqual(["'self'"]);
	});
});
