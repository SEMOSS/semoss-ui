import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAppFrameTestMode, setAppFrameTestMode } from "./app-frame-registry";
import {
	enterTestPreview,
	exitTestPreview,
	withoutTestRouting,
} from "./test-preview";

const api = vi.hoisted(() => ({ begin: vi.fn(), end: vi.fn() }));
vi.mock("@/api/app-testing", () => ({
	beginAppTestSession: api.begin,
	endAppTestSession: api.end,
}));
const token = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
let isVerified = true;
let frame: HTMLIFrameElement;
let currentUrl: string;
let currentDocument: Document;
const worker = {
	scriptURL: `${window.location.origin}/Monolith/app-test-worker.js`,
	postMessage: vi.fn(
		(
			message: { type: string },
			ports: Array<{ deliver: (value: unknown) => void }>,
		) => {
			ports[0].deliver(
				message.type === "SEMOSS_APP_TEST_READY"
					? { ready: true }
					: { active: isVerified },
			);
		},
	),
};

beforeEach(() => {
	isVerified = true;
	api.begin.mockReset().mockResolvedValue({
		target: "app",
		sessionToken: token,
		configurationId: "profile",
		expiresAt: new Date(Date.now() + 60_000).toISOString(),
	});
	api.end.mockReset().mockResolvedValue(undefined);
	vi.stubGlobal(
		"MessageChannel",
		class {
			port1 = {
				onmessage: (_event: MessageEvent<unknown>) => {},
				close: vi.fn(),
			};
			port2 = {
				deliver: (value: unknown) =>
					this.port1.onmessage({
						data: value,
					} as MessageEvent<unknown>),
			};
		},
	);
	Object.defineProperty(window, "isSecureContext", {
		configurable: true,
		value: true,
	});
	Object.defineProperty(navigator, "serviceWorker", {
		configurable: true,
		value: {
			getRegistrations: vi.fn().mockResolvedValue([]),
			register: vi.fn().mockResolvedValue({ active: worker }),
		},
	});
	frame = document.createElement("iframe");
	document.body.append(frame);
	currentUrl = `${window.location.origin}/Monolith/public_home/app/portals/`;
	currentDocument = document.implementation.createHTMLDocument();
	Object.defineProperty(frame, "contentDocument", {
		configurable: true,
		get: () => currentDocument,
	});
	Object.defineProperty(frame, "src", {
		configurable: true,
		get: () => currentUrl,
		set: (url: string) => {
			currentUrl = url;
			currentDocument = document.implementation.createHTMLDocument();
			Object.defineProperty(currentDocument, "URL", { value: url });
			queueMicrotask(() => frame.dispatchEvent(new Event("load")));
		},
	});
});
afterEach(() => {
	setAppFrameTestMode("app", null);
	frame.remove();
	vi.unstubAllGlobals();
});

describe("test database preview", () => {
	it("installs routing before opening the test document and exits only on explicit request", async () => {
		await enterTestPreview("app", frame);
		expect(currentUrl).toContain(`__semoss_app_test=${token}`);
		expect(getAppFrameTestMode("app")?.session.configurationId).toBe(
			"profile",
		);
		expect(api.end).not.toHaveBeenCalled();
		await exitTestPreview("app");
		expect(api.end).toHaveBeenCalledWith("app", token);
		expect(currentUrl).toContain(`__semoss_app_test_exit=${token}`);
		expect(getAppFrameTestMode("app")).toBeNull();
	});
	it("does not load the app or open a session without a secure browser context", async () => {
		Object.defineProperty(window, "isSecureContext", {
			configurable: true,
			value: false,
		});
		await expect(enterTestPreview("app", frame)).rejects.toThrow(
			"HTTPS or localhost",
		);
		expect(api.begin).not.toHaveBeenCalled();
		expect(currentUrl).not.toContain(token);
	});
	it("does not replace another app service worker", async () => {
		vi.mocked(navigator.serviceWorker.getRegistrations).mockResolvedValue([
			{
				scope: `${window.location.origin}/Monolith/`,
				active: { scriptURL: "other-worker.js" },
			} as ServiceWorkerRegistration,
		]);
		await expect(enterTestPreview("app", frame)).rejects.toThrow(
			"another service worker",
		);
		expect(api.begin).not.toHaveBeenCalled();
	});
	it("blanks and revokes an unverified preview without restoring production", async () => {
		isVerified = false;
		await expect(enterTestPreview("app", frame)).rejects.toThrow(
			"No recording was started",
		);
		expect(currentUrl).toBe("about:blank");
		expect(api.end).toHaveBeenCalledWith("app", token);
		expect(getAppFrameTestMode("app")).not.toBeNull();
	});
	it("revokes a session if its caller unmounts while the session starts", async () => {
		const controller = new AbortController();
		controller.abort();
		await expect(
			enterTestPreview("app", frame, controller.signal),
		).rejects.toThrow("closed");
		expect(api.end).toHaveBeenCalledWith("app", token);
		expect(currentUrl).not.toContain(token);
	});
	it("never persists routing tokens in start URLs", () => {
		const clean = withoutTestRouting(
			new URL(
				`https://semoss/portal/?filter=one&__semoss_app_test=${token}&__semoss_app_test_exit=${token}#page`,
			),
		);
		expect(clean.href).toBe("https://semoss/portal/?filter=one#page");
	});
});
