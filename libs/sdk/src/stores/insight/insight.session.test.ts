import { beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../../env";

const { mockGetSystemConfig, mockLogin, mockLogout, mockRunPixel, session } =
	vi.hoisted(() => {
		/** A stand-in for the page's `Session`, whose status the test moves. */
		const listeners = new Set<() => void>();
		let status = "INITIALIZING";
		return {
			mockGetSystemConfig: vi.fn(),
			mockLogin: vi.fn(),
			mockLogout: vi.fn(),
			mockRunPixel: vi.fn(),
			session: {
				getSnapshot: () => ({ status: status }),
				subscribe: (listener: () => void) => {
					listeners.add(listener);
					return () => listeners.delete(listener);
				},
				refresh: vi.fn(async () => ({ status: status })),
				logins: { seed: vi.fn(), reset: vi.fn(), refresh: vi.fn() },
				/** Move the session to a status and tell its listeners. */
				move: (next: string) => {
					status = next;
					for (const listener of listeners) {
						listener();
					}
				},
			},
		};
	});

vi.mock("../../api", () => ({
	getSystemConfig: mockGetSystemConfig,
	login: mockLogin,
	logout: mockLogout,
	runPixel: mockRunPixel,
}));

vi.mock("../session/session.store", () => ({ Session: session }));

import { Config } from "../config/config.store";
import { InsightStore } from "./insight.store";

/** A config as the backend sends it, signed in to the given logins. */
const backendConfig = (logins: Record<string, string>) => ({
	logins: logins,
	availableProviders: [],
	theme: {},
	databaseMetaKeys: [
		{ metakey: "b", display_order: 2 },
		{ metakey: "a", display_order: 1 },
	],
});

/** Let the store's background work settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("InsightStore and Session", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
		Config.reset();
		session.move("INITIALIZING");
		Env.update({
			MODULE: "http://localhost/Monolith",
			APP: "",
			ACCESS_KEY: "",
			SECRET_KEY: "",
			TOOL: null,
		});
		mockRunPixel.mockResolvedValue({
			insightId: "insight-1",
			errors: [],
			pixelReturn: [],
		});
	});

	it("shares one config read, keeping the meta keys as sent", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));

		const first = new InsightStore();
		const second = new InsightStore();
		await Promise.all([first.initialize(), second.initialize()]);

		expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
		expect(first.system?.config.databaseMetaKeys).toEqual([
			{ metakey: "b", display_order: 2 },
			{ metakey: "a", display_order: 1 },
		]);
	});

	it("sets itself up after a sign in made through the session", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({}));
		const insight = new InsightStore();
		const listener = vi.fn();
		insight.subscribe(listener);
		session.move("UNAUTHENTICATED");
		await insight.initialize();
		expect(insight.isAuthorized).toBe(false);

		// the session signs in, and reads the config again as the new user
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		await Config.load({ force: true });
		session.move("AUTHENTICATED");
		await settle();

		expect(insight.isAuthorized).toBe(true);
		expect(insight.isReady).toBe(true);
		expect(insight.insightId).toBe("insight-1");
		expect(insight.system?.config.logins).toEqual({ NATIVE: "Ada" });
		expect(listener).toHaveBeenCalled();
	});

	it("is signed out with the session", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		session.move("AUTHENTICATED");
		const insight = new InsightStore();
		await insight.initialize();
		expect(insight.isReady).toBe(true);

		session.move("UNAUTHENTICATED");

		expect(insight.isAuthorized).toBe(false);
		expect(insight.isReady).toBe(false);
		expect(insight.insightId).toBe("");
	});

	it("stops following the session once destroyed", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		session.move("AUTHENTICATED");
		const insight = new InsightStore();
		await insight.initialize();
		await insight.destroy();
		const listener = vi.fn();
		insight.subscribe(listener);

		session.move("UNAUTHENTICATED");

		expect(listener).not.toHaveBeenCalled();
	});

	it("tells a session the page uses about its own sign in", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({}));
		mockLogin.mockResolvedValue(true);
		session.move("UNAUTHENTICATED");
		const insight = new InsightStore();
		await insight.initialize();

		await insight.actions.login({
			type: "native",
			username: "ada",
			password: "secret",
		});

		expect(session.refresh).toHaveBeenCalledTimes(1);
	});

	it("reads no session when the page never started one", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({}));
		mockLogin.mockResolvedValue(true);
		mockLogout.mockResolvedValue(true);
		const insight = new InsightStore();
		await insight.initialize();

		await insight.actions.login({
			type: "native",
			username: "ada",
			password: "secret",
		});
		await insight.actions.logout();

		expect(session.refresh).not.toHaveBeenCalled();
	});
});
