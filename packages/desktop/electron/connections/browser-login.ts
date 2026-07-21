import { BrowserWindow, session as electronSession } from "electron";
import { randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { instanceBasePath, joinInstanceUrl } from "./instance-url";

interface PendingLogin {
	alias: string;
	instanceUrl: string;
	modulePath: string;
	window: BrowserWindow;
	sessionPartition: string;
}

export interface BrowserLoginResult {
	alias: string;
	instanceUrl: string;
	modulePath: string;
	cookie: string;
}

const pending = new Map<string, PendingLogin>();

/**
 * Opens a real, visible sign-in window pointed at the instance itself (not
 * a hardcoded login-page path — deployments name their web client
 * differently, e.g. this repo's own "semoss-ui" vs. "SemossWeb" elsewhere).
 * The server's own redirect takes the window to whatever login page it's
 * actually configured with, and the user signs in there however they
 * normally would — native username/password or an OAuth provider button —
 * exactly like `libs/sdk/src/api/auth.ts`'s real `login()`/`oauth()` do,
 * just without us needing to know which method they'll pick. A dedicated,
 * non-persistent session partition keeps this attempt's cookies isolated
 * from anything else.
 */
export function beginBrowserLogin(
	alias: string,
	instanceUrl: string,
	modulePath: string,
): string {
	const id = randomUUID();
	const sessionPartition = `sso-login-${id}`;

	const win = new BrowserWindow({
		width: 480,
		height: 720,
		title: "Sign in",
		webPreferences: {
			session: electronSession.fromPartition(sessionPartition),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});
	win.on("closed", () => {
		pending.delete(id);
	});
	void win.loadURL(joinInstanceUrl(instanceUrl, modulePath));

	pending.set(id, {
		alias,
		instanceUrl,
		modulePath,
		window: win,
		sessionPartition,
	});
	return id;
}

/**
 * Called when the user clicks "Continue" after signing in. Reads whatever
 * cookies the sign-in window's session picked up for the instance, then
 * verifies them with a real request (not just "cookies exist" — the
 * unauthenticated redirect itself already sets infra-level cookies, e.g. a
 * load-balancer affinity cookie, so their mere presence isn't proof of a
 * real session).
 */
export async function completeBrowserLogin(
	id: string,
): Promise<BrowserLoginResult> {
	const entry = pending.get(id);
	if (!entry) {
		throw new Error(
			"This sign-in attempt is no longer active — start over.",
		);
	}

	const sess = electronSession.fromPartition(entry.sessionPartition);
	const cookies = await sess.cookies.get({ url: entry.instanceUrl });
	if (cookies.length === 0) {
		throw new Error(
			"No session found yet — finish signing in in the window that opened, then try again.",
		);
	}
	const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

	const authenticated = await probeAuthenticated(
		entry.instanceUrl,
		entry.modulePath,
		cookieHeader,
	);
	if (!authenticated) {
		throw new Error(
			"Still not signed in — finish signing in in the window that opened, then try again.",
		);
	}

	pending.delete(id);
	if (!entry.window.isDestroyed()) {
		entry.window.close();
	}

	return {
		alias: entry.alias,
		instanceUrl: entry.instanceUrl,
		modulePath: entry.modulePath,
		cookie: cookieHeader,
	};
}

export function cancelBrowserLogin(id: string): void {
	const entry = pending.get(id);
	if (!entry) {
		return;
	}
	pending.delete(id);
	if (!entry.window.isDestroyed()) {
		entry.window.close();
	}
}

/**
 * A bare, unauthenticated request to this path is what we already observed
 * 302-redirecting to the instance's real login page — so "not a redirect,
 * not a 401/403" is real evidence of an authenticated session, not a guess.
 */
function probeAuthenticated(
	instanceUrl: string,
	modulePath: string,
	cookieHeader: string,
): Promise<boolean> {
	return new Promise((resolve) => {
		const target = new URL(instanceUrl);
		const isHttps = target.protocol === "https:";
		const requestFn = isHttps ? httpsRequest : httpRequest;
		const basePath = instanceBasePath(instanceUrl);

		const req = requestFn(
			{
				protocol: target.protocol,
				hostname: target.hostname,
				port: target.port || (isHttps ? 443 : 80),
				path: `${basePath}${modulePath}/api/engine/runPixel`,
				method: "GET",
				headers: { cookie: cookieHeader },
				// Matches static-server.ts's proxy — internal instances often
				// run self-signed certs for local/internal use today.
				rejectUnauthorized: false,
			},
			(res) => {
				res.resume();
				const status = res.statusCode ?? 0;
				const isRedirectOrDenied = [
					301, 302, 303, 307, 308, 401, 403,
				].includes(status);
				resolve(!isRedirectOrDenied);
			},
		);
		req.on("error", () => resolve(false));
		req.end();
	});
}
