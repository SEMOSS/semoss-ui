// @vitest-environment node

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createServer, request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ServerConfig } from "../../../contract/server-connection";
import {
	type LocalServer,
	localizeCookie,
	startLocalServer,
} from "./local-server";

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
			res.writeHead(200, {
				"Content-Type": "application/json",
				"Set-Cookie":
					"JSESSIONID=abc; Domain=semoss.example; Path=/Monolith; Secure; HttpOnly; SameSite=None",
			});
			res.end(JSON.stringify({ path: req.url, host: req.headers.host }));
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
 * @returns The response.
 */
const get = (origin: string, path: string): Promise<Reply> =>
	new Promise((resolve, reject) => {
		const req = request(`${origin}${path}`, (res) => {
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

	beforeEach(async () => {
		upstream = await startUpstream();
		const { port } = upstream.address() as AddressInfo;
		server = { url: `http://127.0.0.1:${port}`, module: "/Monolith" };
		rootDir = mkdtempSync(join(tmpdir(), "desktop-renderer-"));
		writeFileSync(join(rootDir, "index.html"), "<html>app</html>");
		writeFileSync(join(rootDir, "app.js"), "console.log(1)");
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
			getServer: () => server,
			contentSecurityPolicy: "default-src 'self'",
		});
		return local;
	};

	test("serves the renderer, with its policy on the page", async () => {
		const { origin } = await start();
		const page = await get(origin, "/");
		expect(page.status).toBe(200);
		expect(page.body).toBe("<html>app</html>");
		expect(page.headers["content-security-policy"]).toBe(
			"default-src 'self'",
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

	test("brings the server's redirects back to the app's origin", async () => {
		const { origin } = await start();
		const reply = await get(origin, "/Monolith/redirect");
		expect(reply.status).toBe(302);
		expect(reply.headers.location).toBe(`${origin}/Monolith/after`);
	});

	test("answers 503 for the module until a server is saved", async () => {
		server = null;
		const { origin } = await start();
		expect((await get(origin, "/Monolith/api/config")).status).toBe(503);
		expect((await get(origin, "/")).status).toBe(200);
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
			getServer: () => server,
		});
		expect(other.port).not.toBe(port);
		await other.close();
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
