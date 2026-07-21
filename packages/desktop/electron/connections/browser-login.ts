import { BrowserWindow, session as electronSession } from "electron";
import { randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT } from "../app-info";
import { ENVIRONMENT } from "../config/environment";
import { instanceBasePath, joinInstanceUrl } from "./instance-url";

const SIGN_IN_WINDOW_WIDTH = 480;
const SIGN_IN_WINDOW_HEIGHT = 720;
const SIGN_IN_WINDOW_TITLE = "Sign in";
const SESSION_PARTITION_PREFIX = "sso-login-";

/**
 * How often to re-check whether sign-in has completed while the window is
 * open. A poll (rather than relying only on navigation events) is what
 * makes this work regardless of how the login page is built — a real page
 * redirect fires `did-navigate`, but a React SPA that logs in via an XHR
 * call and swaps view state client-side, without ever changing the URL,
 * would never fire a navigation event at all.
 */
const AUTO_DETECT_POLL_INTERVAL_MS = 1500;

/** Matches static-server.ts's proxy path — the one endpoint we know both
 * requires auth and exists on every instance, so a non-redirect response
 * from it is real evidence of a signed-in session. */
const AUTH_PROBE_PATH = "/api/engine/runPixel";

/** An unauthenticated request to AUTH_PROBE_PATH is what we already
 * observed 302-redirecting to the instance's real login page, so any of
 * these statuses means "not signed in yet," not "signed in." */
const REDIRECT_OR_DENIED_STATUS_CODES = [301, 302, 303, 307, 308, 401, 403];

const SIGN_IN_ATTEMPT_EXPIRED_MESSAGE =
	"This sign-in attempt is no longer active — start over.";
const NO_SESSION_YET_MESSAGE =
	"No session found yet — finish signing in in the window that opened, then try again.";
const STILL_NOT_SIGNED_IN_MESSAGE =
	"Still not signed in — finish signing in in the window that opened, then try again.";
const SIGN_IN_CHECK_ALREADY_IN_PROGRESS_MESSAGE =
	"Already checking this sign-in attempt — try again in a moment.";

interface PendingLogin {
	window: BrowserWindow;
	sessionPartition: string;
	pollTimer: ReturnType<typeof setInterval>;
	/**
	 * Guards the read-cookies-then-probe check (an async gap) against
	 * running twice at once — from the poll and a manual "Continue" click
	 * landing at the same time, or two poll ticks overlapping if a probe
	 * takes longer than AUTO_DETECT_POLL_INTERVAL_MS.
	 */
	finalizing: boolean;
}

export interface BrowserLoginResult {
	cookie: string;
}

type VerifyOutcome =
	| { ok: true; result: BrowserLoginResult }
	| { ok: false; reason: "no-cookies" | "not-authenticated" };

const pending = new Map<string, PendingLogin>();

/**
 * Opens a real, visible sign-in window pointed at ENVIRONMENT's
 * AUTH_PROBE_PATH (the one build-time-configured SEMOSS instance — not
 * something this app asks the user for). This has to be a path we've
 * actually confirmed requires auth and 302-redirects when it doesn't have
 * it — the bare module path (e.g. ".../Monolith" with nothing after it)
 * isn't necessarily mapped to anything at all and can 404 instead of
 * redirecting, which is exactly what AUTH_PROBE_PATH avoids since
 * probeAuthenticated() already relies on the same endpoint. From there,
 * the instance's own redirect takes the window to whatever login page
 * it's actually configured with, and the user signs in there however they
 * normally would — native username/password or an OAuth provider button —
 * exactly like `libs/sdk/src/api/auth.ts`'s real `login()`/`oauth()` do,
 * just without us needing to know which method they'll pick. A dedicated,
 * non-persistent session partition keeps this attempt's cookies isolated
 * from anything else.
 *
 * `onAutoSignIn` fires as soon as sign-in is detected (polling plus
 * navigation events, see AUTO_DETECT_POLL_INTERVAL_MS above) — the window
 * closes itself, no manual "Continue" click required. `completeBrowserLogin`
 * below still exists as an explicit, user-triggered fallback for the rare
 * case where polling hasn't caught up yet.
 */
export function beginBrowserLogin(
	onAutoSignIn: (result: BrowserLoginResult) => void,
): string {
	const id = randomUUID();
	const sessionPartition = `${SESSION_PARTITION_PREFIX}${id}`;

	const win = new BrowserWindow({
		width: SIGN_IN_WINDOW_WIDTH,
		height: SIGN_IN_WINDOW_HEIGHT,
		title: SIGN_IN_WINDOW_TITLE,
		webPreferences: {
			session: electronSession.fromPartition(sessionPartition),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
		},
	});

	const pollTimer = setInterval(() => {
		void tryAutoComplete(id, onAutoSignIn);
	}, AUTO_DETECT_POLL_INTERVAL_MS);

	win.on("closed", () => {
		clearInterval(pollTimer);
		pending.delete(id);
	});
	// Snappier detection on an actual page redirect, on top of the interval
	// poll above (which is what covers an XHR-based login that never
	// navigates at all).
	win.webContents.on("did-navigate", () => {
		void tryAutoComplete(id, onAutoSignIn);
	});
	win.webContents.on("did-navigate-in-page", () => {
		void tryAutoComplete(id, onAutoSignIn);
	});

	void win.loadURL(
		joinInstanceUrl(
			ENVIRONMENT.instanceUrl,
			`${ENVIRONMENT.modulePath}${AUTH_PROBE_PATH}`,
		),
	);

	pending.set(id, {
		window: win,
		sessionPartition,
		pollTimer,
		finalizing: false,
	});
	return id;
}

/**
 * Manual fallback for the (expected to be rare) case where auto-detection
 * hasn't picked up a completed sign-in yet — same verification `beginBrowserLogin`'s
 * poll uses, just triggered on demand and surfacing a descriptive error
 * instead of silently retrying.
 */
export async function completeBrowserLogin(
	id: string,
): Promise<BrowserLoginResult> {
	const entry = pending.get(id);
	if (!entry) {
		throw new Error(SIGN_IN_ATTEMPT_EXPIRED_MESSAGE);
	}
	if (entry.finalizing) {
		throw new Error(SIGN_IN_CHECK_ALREADY_IN_PROGRESS_MESSAGE);
	}

	entry.finalizing = true;
	const outcome = await verify(entry);
	if (pending.get(id) !== entry) {
		// Auto-detection (or a cancel) already resolved this attempt while
		// the check above was in flight — nothing left to do here.
		throw new Error(SIGN_IN_ATTEMPT_EXPIRED_MESSAGE);
	}
	if (!outcome.ok) {
		entry.finalizing = false;
		throw new Error(
			outcome.reason === "no-cookies"
				? NO_SESSION_YET_MESSAGE
				: STILL_NOT_SIGNED_IN_MESSAGE,
		);
	}

	finalizePending(id, entry);
	return outcome.result;
}

export function cancelBrowserLogin(id: string): void {
	const entry = pending.get(id);
	if (!entry) {
		return;
	}
	clearInterval(entry.pollTimer);
	pending.delete(id);
	if (!entry.window.isDestroyed()) {
		entry.window.close();
	}
}

/** The poll/navigation-event-driven path — silent on failure, since "not
 * signed in yet" is the expected steady state until the user finishes. */
async function tryAutoComplete(
	id: string,
	onAutoSignIn: (result: BrowserLoginResult) => void,
): Promise<void> {
	const entry = pending.get(id);
	if (!entry || entry.finalizing) {
		return;
	}

	entry.finalizing = true;
	const outcome = await verify(entry);
	if (pending.get(id) !== entry) {
		// Cancelled, or already finalized by a concurrent "Continue" click,
		// while this check was in flight.
		return;
	}
	if (!outcome.ok) {
		entry.finalizing = false;
		return;
	}

	finalizePending(id, entry);
	onAutoSignIn(outcome.result);
}

function finalizePending(id: string, entry: PendingLogin): void {
	clearInterval(entry.pollTimer);
	pending.delete(id);
	if (!entry.window.isDestroyed()) {
		entry.window.close();
	}
}

/**
 * Reads whatever cookies the sign-in window's session picked up for
 * ENVIRONMENT, then verifies them with a real request (not just "cookies
 * exist" — the unauthenticated redirect itself already sets infra-level
 * cookies, e.g. a load-balancer affinity cookie, so their mere presence
 * isn't proof of a real session).
 */
async function verify(entry: PendingLogin): Promise<VerifyOutcome> {
	const sess = electronSession.fromPartition(entry.sessionPartition);
	const cookies = await sess.cookies.get({ url: ENVIRONMENT.instanceUrl });
	if (cookies.length === 0) {
		return { ok: false, reason: "no-cookies" };
	}
	const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

	const authenticated = await probeAuthenticated(cookieHeader);
	if (!authenticated) {
		return { ok: false, reason: "not-authenticated" };
	}

	return { ok: true, result: { cookie: cookieHeader } };
}

function probeAuthenticated(cookieHeader: string): Promise<boolean> {
	return new Promise((resolve) => {
		const target = new URL(ENVIRONMENT.instanceUrl);
		const isHttps = target.protocol === "https:";
		const requestFn = isHttps ? httpsRequest : httpRequest;
		const basePath = instanceBasePath(ENVIRONMENT.instanceUrl);

		const req = requestFn(
			{
				protocol: target.protocol,
				hostname: target.hostname,
				port:
					target.port ||
					(isHttps ? DEFAULT_HTTPS_PORT : DEFAULT_HTTP_PORT),
				path: `${basePath}${ENVIRONMENT.modulePath}${AUTH_PROBE_PATH}`,
				method: "GET",
				headers: { cookie: cookieHeader },
				// Matches static-server.ts's proxy — internal instances often
				// run self-signed certs for local/internal use today.
				rejectUnauthorized: false,
			},
			(res) => {
				res.resume();
				const status = res.statusCode ?? 0;
				resolve(!REDIRECT_OR_DENIED_STATUS_CODES.includes(status));
			},
		);
		req.on("error", () => resolve(false));
		req.end();
	});
}
