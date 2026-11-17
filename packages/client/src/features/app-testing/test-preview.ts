import { beginAppTestSession, endAppTestSession } from "@/api/app-testing";
import { getAppFrameTestMode, setAppFrameTestMode } from "./app-frame-registry";

const PARAMETER = "__semoss_app_test";
const EXIT = "__semoss_app_test_exit";

/** Reserved routing handles must never become saved start paths or test URLs. */
export const withoutTestRouting = (url: URL): URL => {
	const clean = new URL(url);
	clean.searchParams.delete(PARAMETER);
	clean.searchParams.delete(EXIT);
	return clean;
};

const workerMessage = (
	worker: ServiceWorker,
	message: Record<string, string>,
): Promise<Record<string, unknown>> =>
	new Promise((resolve, reject) => {
		const channel = new MessageChannel();
		const timer = window.setTimeout(() => {
			channel.port1.close();
			reject(new Error("Test browser routing did not respond"));
		}, 10_000);
		channel.port1.onmessage = (event: MessageEvent<unknown>) => {
			window.clearTimeout(timer);
			channel.port1.close();
			if (event.data && typeof event.data === "object")
				resolve(event.data as Record<string, unknown>);
			else reject(new Error("Invalid test browser routing response"));
		};
		worker.postMessage(message, [channel.port2]);
	});

const prepareWorker = async (normal: URL): Promise<ServiceWorker> => {
	if (!window.isSecureContext || !("serviceWorker" in navigator))
		throw new Error(
			"Test database recording requires HTTPS or localhost with service worker support",
		);
	if (normal.origin !== window.location.origin)
		throw new Error("The test preview must have the same origin as SEMOSS");
	const index = normal.pathname.indexOf("/public_home/");
	if (index < 0) throw new Error("The preview is not a SEMOSS app portal");
	const modulePath = `${normal.pathname.slice(0, index)}/`;
	const script = new URL(`${modulePath}app-test-worker.js`, normal.origin)
		.href;
	for (const registration of await navigator.serviceWorker.getRegistrations()) {
		const existing =
			registration.active ||
			registration.waiting ||
			registration.installing;
		if (
			normal.href.startsWith(registration.scope) &&
			existing &&
			existing.scriptURL !== script
		)
			throw new Error(
				"This app has another service worker. Test database recording cannot replace it safely.",
			);
	}
	const registration = await navigator.serviceWorker.register(script, {
		scope: modulePath,
		updateViaCache: "none",
	});
	const worker = await new Promise<ServiceWorker>((resolve, reject) => {
		if (registration.active) {
			resolve(registration.active);
			return;
		}
		const candidate = registration.installing || registration.waiting;
		if (!candidate) {
			reject(new Error("Test routing worker was not installed"));
			return;
		}
		const timer = window.setTimeout(() => {
			candidate.removeEventListener("statechange", check);
			reject(new Error("Test routing worker activation timed out"));
		}, 15_000);
		function check(): void {
			if (candidate?.state === "activated") {
				window.clearTimeout(timer);
				candidate.removeEventListener("statechange", check);
				resolve(candidate);
			} else if (candidate?.state === "redundant") {
				window.clearTimeout(timer);
				candidate.removeEventListener("statechange", check);
				reject(new Error("Test routing worker installation failed"));
			}
		}
		candidate.addEventListener("statechange", check);
		check();
	});
	const response = await workerMessage(worker, {
		type: "SEMOSS_APP_TEST_READY",
	});
	if (response.ready !== true)
		throw new Error(
			"Browser storage or navigation tracking required for safe test routing is unavailable",
		);
	return worker;
};

const navigateFrame = (frame: HTMLIFrameElement, url: string): Promise<void> =>
	new Promise((resolve, reject) => {
		const previous = frame.contentDocument;
		const loaded = (): void => {
			if (
				frame.contentDocument === previous ||
				frame.contentDocument?.URL === "about:blank"
			)
				return;
			window.clearTimeout(timer);
			frame.removeEventListener("load", loaded);
			resolve();
		};
		const timer = window.setTimeout(() => {
			frame.removeEventListener("load", loaded);
			reject(new Error("Test preview did not finish loading"));
		}, 20_000);
		frame.addEventListener("load", loaded);
		frame.src = url;
	});

/** Install per-client routing, then reload into the context before the recorder can attach. */
export const enterTestPreview = async (
	appId: string,
	frame: HTMLIFrameElement,
	signal?: AbortSignal,
): Promise<void> => {
	const existing = getAppFrameTestMode(appId);
	if (existing) {
		if (
			existing.frame !== frame ||
			Date.parse(existing.session.expiresAt) <= Date.now()
		)
			throw new Error(
				"Exit the old test database mode before recording again",
			);
		return;
	}
	const normal = withoutTestRouting(new URL(frame.src, window.location.href));
	const worker = await prepareWorker(normal);
	const session = await beginAppTestSession(appId);
	if (signal?.aborted || !frame.isConnected) {
		await endAppTestSession(appId, session.sessionToken);
		throw new Error("The preview was closed before test mode started");
	}
	setAppFrameTestMode(appId, {
		frame,
		session,
		normalUrl: normal.href,
		dispose: () => {
			void endAppTestSession(appId, session.sessionToken).catch(
				() => undefined,
			);
		},
	});
	const target = new URL(normal);
	target.searchParams.set(PARAMETER, session.sessionToken);
	try {
		await navigateFrame(frame, target.href);
		const status = await workerMessage(worker, {
			type: "SEMOSS_APP_TEST_STATUS",
			token: session.sessionToken,
		});
		if (status.active !== true)
			throw new Error(
				"The backend did not confirm test database routing. No recording was started.",
			);
		if (signal?.aborted)
			throw new Error("Recording was cancelled while entering test mode");
	} catch (error: unknown) {
		frame.src = "about:blank";
		await endAppTestSession(appId, session.sessionToken).catch(
			() => undefined,
		);
		// Retain the mode marker so normal recording cannot resume on an unverified preview.
		throw error;
	}
};

/** Stop the old document before revoking routing; restore production only after an explicit exit action. */
export const exitTestPreview = async (appId: string): Promise<void> => {
	const mode = getAppFrameTestMode(appId);
	if (!mode) return;
	mode.frame.src = "about:blank";
	await endAppTestSession(appId, mode.session.sessionToken);
	const normal = new URL(mode.normalUrl);
	normal.searchParams.set(PARAMETER, mode.session.sessionToken);
	normal.searchParams.set(EXIT, mode.session.sessionToken);
	setAppFrameTestMode(appId, null);
	await navigateFrame(mode.frame, normal.href);
};
