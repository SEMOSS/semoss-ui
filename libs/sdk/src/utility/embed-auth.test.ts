// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resetEnv = async () => {
	const { Env } = await import("../env");
	Env.update({
		ACCESS_KEY: "",
		SECRET_KEY: "",
		BEARER_TOKEN: "",
		BEARER_PROVIDER: "",
		CSRF: false,
		MODULE: "",
	});
};

const createMockWindow = (options?: {
	search?: string;
	hash?: string;
	iframe?: boolean;
}) => {
	const handlers = new Set<(event: MessageEvent) => void>();
	const parent = {
		postMessage: vi.fn(),
	};

	const topRef = {};
	const selfRef = options?.iframe === false ? topRef : {};

	const mockWindow = {
		self: selfRef,
		top: topRef,
		parent,
		location: {
			search: options?.search ?? "",
			hash: options?.hash ?? "",
		},
		addEventListener: vi.fn(
			(type: string, handler: (event: MessageEvent) => void) => {
				if (type === "message") {
					handlers.add(handler);
				}
			},
		),
		removeEventListener: vi.fn(
			(type: string, handler: (event: MessageEvent) => void) => {
				if (type === "message") {
					handlers.delete(handler);
				}
			},
		),
	};

	return {
		mockWindow,
		parent,
		handlers,
	};
};

describe("waitForEmbedAuth", () => {
	beforeEach(async () => {
		vi.useFakeTimers();
		vi.resetModules();
		await resetEnv();

		Object.defineProperty(document, "referrer", {
			value: "",
			configurable: true,
		});
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("resolves immediately when not running in iframe", async () => {
		const { mockWindow, parent } = createMockWindow({
			search: "?SMSS_EMBED_AUTH=true",
			iframe: false,
		});
		vi.stubGlobal(
			"window",
			mockWindow as unknown as Window & typeof globalThis,
		);

		const { waitForEmbedAuth } = await import("./embed-auth");
		await waitForEmbedAuth();

		expect(parent.postMessage).not.toHaveBeenCalled();
		expect(mockWindow.addEventListener).not.toHaveBeenCalled();
	});

	it("rejects when EMBED_AUTH=false", async () => {
		const { mockWindow, parent } = createMockWindow({
			search: "?SMSS_EMBED_AUTH=false",
			iframe: true,
		});
		vi.stubGlobal("window", mockWindow);

		const { waitForEmbedAuth } = await import("./embed-auth");
		await waitForEmbedAuth();

		expect(parent.postMessage).not.toHaveBeenCalled();
		expect(mockWindow.addEventListener).not.toHaveBeenCalled();
	});

	it("posts ready message and applies auth from parent message", async () => {
		//Assumes that current page was opened at the https://host.example/path
		Object.defineProperty(document, "referrer", {
			value: "https://host.example/path",
			configurable: true,
		});

		const { mockWindow, parent, handlers } = createMockWindow({
			search: "?SMSS_EMBED_AUTH=true",
			iframe: true,
		});
		vi.stubGlobal(
			"window",
			mockWindow as unknown as Window & typeof globalThis,
		);

		const [{ waitForEmbedAuth }, { Env }] = await Promise.all([
			import("./embed-auth"),
			import("../env"),
		]);

		const pending = waitForEmbedAuth();
		expect(parent.postMessage).toHaveBeenCalledWith(
			{ type: "SMSS_EMBED_AUTH_READY" },
			"https://host.example",
		);

		const handler = [...handlers][0];
		handler({
			source: mockWindow.parent,
			origin: "https://host.example",
			data: {
				type: "SMSS_EMBED_AUTH",
				payload: {
					bearerToken: "token-123",
					loginProvider: "semoss",
				},
			},
		} as MessageEvent);

		await pending;
		expect(Env.BEARER_TOKEN).toBe("token-123");
		expect(Env.BEARER_PROVIDER).toBe("semoss");
		expect(mockWindow.removeEventListener).toHaveBeenCalledTimes(1);
	});

	it("ignores wrong-origin messages and resolves on timeout", async () => {
		Object.defineProperty(document, "referrer", {
			value: "https://host.example/path",
			configurable: true,
		});

		const { mockWindow, handlers } = createMockWindow({
			hash: "#/embed?SMSS_EMBED_AUTH=true",
			iframe: true,
		});
		vi.stubGlobal(
			"window",
			mockWindow as unknown as Window & typeof globalThis,
		);

		const [{ waitForEmbedAuth }, { Env }] = await Promise.all([
			import("./embed-auth"),
			import("../env"),
		]);

		const pending = waitForEmbedAuth();
		const handler = [...handlers][0];
		handler({
			source: mockWindow.parent,
			origin: "https://evil.example",
			data: {
				type: "SMSS_EMBED_AUTH",
				payload: {
					bearerToken: "malicious-token",
					loginProvider: "malicious",
				},
			},
		} as MessageEvent);

		expect(Env.BEARER_TOKEN).toBe("");
		expect(Env.BEARER_PROVIDER).toBe("");

		await vi.advanceTimersByTimeAsync(4000);
		await pending;

		expect(Env.BEARER_TOKEN).toBe("");
		expect(Env.BEARER_PROVIDER).toBe("");
	});

	it("reuses the same promise while waiting", async () => {
		const { mockWindow, parent } = createMockWindow({
			search: "?SMSS_EMBED_AUTH=true",
			iframe: true,
		});
		vi.stubGlobal(
			"window",
			mockWindow as unknown as Window & typeof globalThis,
		);

		const { waitForEmbedAuth } = await import("./embed-auth");

		const first = waitForEmbedAuth();
		const second = waitForEmbedAuth();

		expect(first).toBe(second);
		expect(parent.postMessage).toHaveBeenCalledTimes(1);
	});
});
