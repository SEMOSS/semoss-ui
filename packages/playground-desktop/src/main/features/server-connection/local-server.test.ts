// @vitest-environment node

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createServer, request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ServerConfig } from "../../../contract/server-connection";
import { TOOL_FRAME_KEY_HEADER } from "../trust-boundaries/web-requests";
import {
	isSignInPath,
	type LocalServer,
	localizeCookie,
	MODULE_PAGE_SANDBOX,
	startLocalServer,
	withoutFrameAncestors,
} from "./local-server";
import type { ToolCookieJar } from "./tool-cookies";

/** The tool frame key the tests' local server is started with. */
const KEY = "test-launch-key";

/** A stand-in SEMOSS server: echoes the path and host, sets a server cookie. */
const startUpstream = (): Promise<Server> =>
	new Promise((resolve) => {
		const upstream = createServer((req, res) => {
			if (req.url === "/Monolith/redirect") {
				const { port } = upstream.address() as AddressInfo;
				res.writeHead(302, {
					Location: `http://127.0.0.1:${port}/Monolith/after`,
				});
				res.end();
				return;
			}
			if (req.url === "/Monolith/public_home/strict/portals/") {
				res.writeHead(200, {
					"Content-Type": "text/html",
					"Content-Security-Policy":
						"img-src *; frame-ancestors 'self'",
				});
				res.end("<html>strict</html>");
				return;
			}
			if (req.url?.startsWith("/Monolith/public_home/")) {
				res.writeHead(200, {
					"Content-Type": "text/html",
					"Content-Security-Policy": "img-src *",
					"X-Frame-Options": "SAMEORIGIN",
				});
				res.end("<html>portal</html>");
				return;
			}
			res.writeHead(200, {
				"Content-Type": "application/json",
				"Set-Cookie":
					"JSESSIONID=abc; Domain=semoss.example; Path=/Monolith; Secure; HttpOnly; SameSite=None",
			});
			res.end(
				JSON.stringify({
					path: req.url,
					host: req.headers.host,
					cookie: req.headers.cookie,
					key: req.headers[TOOL_FRAME_KEY_HEADER],
				}),
			);
		});
		upstream.on("upgrade", (_req, socket) => {
			socket.end(
				"HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n\r\n",
			);
		});
		upstream.listen(0, "127.0.0.1", () => resolve(upstream));
	});

/** A response as the tests read it. */
interface Reply {
	/** The status code. */
	readonly status: number;
	/** The response headers. */
	readonly headers: Record<string, string | string[] | undefined>;
	/** The body, as text. */
	readonly body: string;
}

/**
 * GET a path from an origin.
 *
 * @param origin - The origin.
 * @param path - The path, with any query.
 * @param headers - Request headers, such as another `Host`.
 * @returns The response.
 */
const get = (
	origin: string,
	path: string,
	headers: Record<string, string> = {},
): Promise<Reply> =>
	new Promise((resolve, reject) => {
		const req = request(`${origin}${path}`, { headers }, (res) => {
			let body = "";
			res.on("data", (chunk) => {
				body += chunk;
			});
			res.on("end", () =>
				resolve({
					status: res.statusCode ?? 0,
					headers: res.headers,
					body,
				}),
			);
		});
		req.on("error", reject);
		req.end();
	});

describe("startLocalServer", () => {
	let upstream: Server;
	let local: LocalServer | undefined;
	let rootDir: string;
	let server: ServerConfig | null;
	/** What the fake jar was asked for and told to keep. */
	let jarCalls: { header: string[]; store: [string, readonly string[]][] };
	/** The app's cookies as the fake jar has them. */
	const toolCookies: ToolCookieJar = {
		header: async (url, pageHeader) => {
			jarCalls.header.push(url);
			return ["JSESSIONID=from-app-jar", pageHeader]
				.filter(Boolean)
				.join("; ");
		},
		store: async (url, setCookies) => {
			jarCalls.store.push([url, setCookies]);
		},
	};

	beforeEach(async () => {
		upstream = await startUpstream();
		const { port } = upstream.address() as AddressInfo;
		server = { url: `http://127.0.0.1:${port}`, module: "/Monolith" };
		rootDir = mkdtempSync(join(tmpdir(), "desktop-renderer-"));
		writeFileSync(join(rootDir, "index.html"), "<html>app</html>");
		writeFileSync(join(rootDir, "app.js"), "console.log(1)");
		jarCalls = { header: [], store: [] };
	});

	afterEach(async () => {
		await local?.close();
		local = undefined;
		await new Promise((resolve) => upstream.close(resolve));
	});

	/** Start the local server on the stand-in upstream, optionally on a port. */
	const start = async (preferredPort: number | null = null) => {
		local = await startLocalServer({
			rootDir,
			preferredPort,
			preferredToolFramePort: null,
			getServer: () => server,
			contentSecurityPolicy: ({ appOrigin, toolFrameOrigin }) =>
				`default-src 'self'; frame-src ${toolFrameOrigin}; x ${appOrigin}`,
			toolFrameKey: KEY,
			toolCookies,
		});
		return local;
	};

	/**
	 * GET a path from the tool frame origin as the app's window does: its own
	 * host, and this launch's key. `tools.localhost` is reached on 127.0.0.1,
	 * since Node does not resolve it the way Chromium does.
	 */
	const getTool = (
		path: string,
		headers: Record<string, string> = {},
	): Promise<Reply> => {
		const { toolFramePort } = local ?? { toolFramePort: 0 };
		return get(`http://127.0.0.1:${toolFramePort}`, path, {
			Host: `tools.localhost:${toolFramePort}`,
			[TOOL_FRAME_KEY_HEADER]: KEY,
			...headers,
		});
	};

	test("serves the renderer, with its policy on the page", async () => {
		const { origin } = await start();
		const page = await get(origin, "/");
		expect(page.status).toBe(200);
		expect(page.body).toBe("<html>app</html>");
		expect(page.headers["content-security-policy"]).toBe(
			`default-src 'self'; frame-src http://tools.localhost:${local?.toolFramePort}; x ${origin}`,
		);
		const script = await get(origin, "/app.js");
		expect(script.headers["content-type"]).toMatch(/javascript/);
		expect(script.headers["content-security-policy"]).toBeUndefined();
	});

	test("keeps file requests inside the renderer", async () => {
		const { origin } = await start();
		expect((await get(origin, "/..%2f..%2fetc%2fpasswd")).status).toBe(403);
		expect((await get(origin, "/missing.js")).status).toBe(404);
	});

	test("forwards the module to the server as the server's own host", async () => {
		const { origin } = await start();
		const reply = await get(origin, "/Monolith/api/config?x=1");
		expect(reply.status).toBe(200);
		const body = JSON.parse(reply.body) as { path: string; host: string };
		expect(body.path).toBe("/Monolith/api/config?x=1");
		expect(body.host).toBe(new URL(server?.url ?? "").host);
		expect(reply.headers["set-cookie"]).toEqual([
			"JSESSIONID=abc; Path=/Monolith; HttpOnly; SameSite=Lax; Max-Age=2592000",
		]);
	});

	test("runs the server's pages sandboxed on the app's origin, except its sign in", async () => {
		const { origin } = await start();
		const page = await get(
			origin,
			"/Monolith/public_home/app/portals/x.html",
		);
		expect(page.status).toBe(200);
		// the server's own policy still applies beside the sandbox
		expect(page.headers["content-security-policy"]).toBe(
			`img-src *, ${MODULE_PAGE_SANDBOX}`,
		);
		expect(page.headers["x-frame-options"]).toBe("SAMEORIGIN");
		const call = await get(origin, "/Monolith/api/config");
		expect(call.headers["content-security-policy"]).toBe(
			MODULE_PAGE_SANDBOX,
		);
		const signIn = await get(origin, "/Monolith/api/auth/login/ms");
		expect(signIn.headers["content-security-policy"]).toBeUndefined();
	});

	test("forwards only the module on the tool frame origin, unsandboxed", async () => {
		const { origin, toolFrameOrigin, port, toolFramePort } = await start();
		expect(toolFramePort).not.toBe(port);
		// another site than the app's 127.0.0.1, so another process
		expect(toolFrameOrigin).toBe(`http://tools.localhost:${toolFramePort}`);

		const page = await getTool("/Monolith/public_home/app/portals/x.html");
		expect(page.status).toBe(200);
		expect(page.body).toBe("<html>portal</html>");
		// only the app's page, another site, frames it
		expect(page.headers["x-frame-options"]).toBeUndefined();
		expect(page.headers["content-security-policy"]).toBe(
			`img-src *, frame-ancestors 'self' ${origin}`,
		);
		expect(page.headers["origin-agent-cluster"]).toBe("?1");
		// a server's own frame-ancestors would refuse the app's page, another site
		const strict = await getTool("/Monolith/public_home/strict/portals/");
		expect(strict.headers["content-security-policy"]).toBe(
			`img-src *, frame-ancestors 'self' ${origin}`,
		);
		const call = await getTool("/Monolith/api/config");
		expect(JSON.parse(call.body)).toMatchObject({
			path: "/Monolith/api/config",
		});
		// never the app's page, which holds the bridge
		expect((await getTool("/")).status).toBe(404);
		expect((await getTool("/app.js")).status).toBe(404);
	});

	test("answers only the app's window: its own host and this launch's key", async () => {
		const { toolFramePort } = await start();
		const tool = `http://127.0.0.1:${toolFramePort}`;
		const path = "/Monolith/api/config";
		// no key: another window, another program on this machine
		expect(
			(
				await get(tool, path, {
					Host: `tools.localhost:${toolFramePort}`,
				})
			).status,
		).toBe(403);
		expect(
			(await getTool(path, { [TOOL_FRAME_KEY_HEADER]: "guess" })).status,
		).toBe(403);
		// the app's own host is not the tool frame origin's
		expect(
			(await getTool(path, { Host: `127.0.0.1:${toolFramePort}` }))
				.status,
		).toBe(403);
		// the key never reaches the server
		const call = await getTool(path);
		expect(JSON.parse(call.body).key).toBeUndefined();
	});

	test("signs tool requests in with the app's cookies, which tools never get", async () => {
		const { origin } = await start();
		const call = await getTool("/Monolith/api/config", {
			Cookie: "tool-own=1",
		});
		// the app's cookies, then the tool's own
		expect(JSON.parse(call.body).cookie).toBe(
			"JSESSIONID=from-app-jar; tool-own=1",
		);
		expect(jarCalls.header).toEqual([`${origin}/Monolith/api/config`]);
		// the server's cookie goes to the app's jar, not to the tool's page
		expect(call.headers["set-cookie"]).toBeUndefined();
		expect(jarCalls.store).toEqual([
			[
				`${origin}/Monolith/api/config`,
				[
					"JSESSIONID=abc; Domain=semoss.example; Path=/Monolith; HttpOnly; SameSite=Lax; Max-Age=2592000",
				],
			],
		]);
	});

	test("refuses a tool's service worker, which would outlive it", async () => {
		await start();
		expect(
			(
				await getTool("/Monolith/public_home/app/portals/sw.js", {
					"Service-Worker": "script",
				})
			).status,
		).toBe(403);
	});

	test("turns tool views off for the rest of the run", async () => {
		const { origin } = await start();
		local?.disableToolFrames();
		const page = await getTool("/Monolith/public_home/app/portals/x.html");
		expect(page.status).toBe(503);
		expect(page.body).toContain("Tool views are off");
		// the app itself keeps working
		expect((await get(origin, "/Monolith/api/config")).status).toBe(200);
	});

	test("forwards the platform on the tool frame origin only", async () => {
		const { origin } = await start();
		const platform = await getTool(
			"/SemossWeb/packages/client/dist/index.html",
		);
		expect(JSON.parse(platform.body)).toMatchObject({
			path: "/SemossWeb/packages/client/dist/index.html",
		});
		// nothing else beside the module
		expect((await getTool("/SemossWeb/other")).status).toBe(404);
		// never on the app's origin, which serves its own files there
		expect(
			(await get(origin, "/SemossWeb/packages/client/dist/index.html"))
				.status,
		).toBe(404);
	});

	test("never forwards a path the server could read as another one", async () => {
		const { origin } = await start();
		for (const path of [
			"/Monolith/..;/manager/html",
			"/Monolith/%2e%2e/manager/html",
			"/Monolith/a%2f..%2f..%2fmanager",
			"/SemossWeb/packages/client/dist/..;/..;/x",
		]) {
			expect((await getTool(path)).status).toBe(404);
			expect((await get(origin, path)).body).not.toContain("manager");
		}
	});

	test("refuses requests for any host but its own", async () => {
		const { origin } = await start();
		expect(
			(
				await get(origin, "/Monolith/api/config", {
					Host: "attacker.example",
				})
			).status,
		).toBe(403);
		expect(
			(
				await getTool("/Monolith/api/config", {
					Host: "attacker.example",
				})
			).status,
		).toBe(403);
		expect((await get(origin, "/Monolith/api/config")).status).toBe(200);
	});

	test("brings the server's redirects back to the app's origin", async () => {
		const { origin } = await start();
		const reply = await get(origin, "/Monolith/redirect");
		expect(reply.status).toBe(302);
		expect(reply.headers.location).toBe(`${origin}/Monolith/after`);
		const { toolFrameOrigin } = local ?? { toolFrameOrigin: "" };
		const framed = await getTool("/Monolith/redirect");
		expect(framed.headers.location).toBe(
			`${toolFrameOrigin}/Monolith/after`,
		);
	});

	test("answers 503 for the module until a server is saved", async () => {
		server = null;
		const { origin } = await start();
		expect((await get(origin, "/Monolith/api/config")).status).toBe(503);
		expect((await get(origin, "/")).status).toBe(200);
		expect((await getTool("/Monolith/api/config")).status).toBe(503);
	});

	test("forwards WebSocket upgrades on the module", async () => {
		const { port } = await start();
		const status = await new Promise<number>((resolve, reject) => {
			const req = request({
				host: "127.0.0.1",
				port,
				path: "/Monolith/insightSocket",
				headers: {
					Connection: "Upgrade",
					Upgrade: "websocket",
					"Sec-WebSocket-Version": "13",
					"Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
				},
			});
			req.on("upgrade", (res, socket) => {
				socket.destroy();
				resolve(res.statusCode ?? 0);
			});
			req.on("error", reject);
			req.end();
		});
		expect(status).toBe(101);
	});

	test("reuses the saved port, and takes another when it is in use", async () => {
		const first = await start();
		const port = first.port;
		await first.close();
		local = undefined;
		const again = await start(port);
		expect(again.port).toBe(port);

		const other = await startLocalServer({
			rootDir,
			preferredPort: port,
			preferredToolFramePort: null,
			getServer: () => server,
			toolFrameKey: KEY,
			toolCookies,
		});
		expect(other.port).not.toBe(port);
		await other.close();
	});
});

describe("isSignInPath", () => {
	test("keeps the server's sign in on the app's origin", () => {
		expect(isSignInPath("/Monolith/api/auth/login/ms", "/Monolith")).toBe(
			true,
		);
		expect(
			isSignInPath(
				"/Monolith/api/auth/login/ms?code=1&state=2",
				"/Monolith",
			),
		).toBe(true);
	});

	test("refuses anything the server could read as another path", () => {
		for (const path of [
			"/Monolith/api/config",
			"/Monolith/public_home/app/portals/x.html",
			"/Monolith/api/auth/login/..;/..;/..;/public_home/app/portals/x.html",
			"/Monolith/api/auth/login/..%2f..%2fpublic_home/app/portals/x.html",
			"/Monolith/api/auth/login/%2e%2e/%2e%2e/public_home/x.html",
			"/Monolith/api/auth/login\\..\\x.html",
			"/MonolithX/api/auth/login/ms",
		]) {
			expect(isSignInPath(path, "/Monolith")).toBe(false);
		}
	});
});

describe("withoutFrameAncestors", () => {
	test("drops only the server's frame-ancestors, in every policy", () => {
		expect(
			withoutFrameAncestors("default-src 'self'; frame-ancestors 'self'"),
		).toBe("default-src 'self'");
		expect(
			withoutFrameAncestors([
				"FRAME-ANCESTORS 'none'",
				"img-src *; frame-ancestors https://a.example",
			]),
		).toBe("img-src *");
		expect(withoutFrameAncestors("frame-ancestors 'self'")).toBeUndefined();
		expect(withoutFrameAncestors(undefined)).toBeUndefined();
	});
});

describe("localizeCookie", () => {
	test("drops Secure and relaxes SameSite=None for the local origin", () => {
		expect(
			localizeCookie("a=1; Path=/; Secure; SameSite=None; Max-Age=60"),
		).toBe("a=1; Path=/; SameSite=Lax; Max-Age=60");
		expect(localizeCookie("a=1; SameSite=Strict; Max-Age=60")).toBe(
			"a=1; SameSite=Strict; Max-Age=60",
		);
	});

	test("keeps a session cookie across restarts, and leaves deletions alone", () => {
		expect(localizeCookie("monolith=abc; Path=/Monolith; HttpOnly")).toBe(
			"monolith=abc; Path=/Monolith; HttpOnly; Max-Age=2592000",
		);
		expect(localizeCookie("monolith=; Path=/Monolith; Max-Age=0")).toBe(
			"monolith=; Path=/Monolith; Max-Age=0",
		);
		expect(
			localizeCookie("a=; Expires=Thu, 01 Jan 1970 00:00:00 GMT"),
		).toBe("a=; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
	});
});
