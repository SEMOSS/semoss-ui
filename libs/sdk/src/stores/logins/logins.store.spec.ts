import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectLogin, getLogins, logoutProvider } from "../../api/auth";
import { LoginsStore } from "./logins.store";

vi.mock("../../api/auth", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/auth")>()),
	connectLogin: vi.fn(),
	getLogins: vi.fn(),
	logoutProvider: vi.fn(),
}));

const mockGetLogins = vi.mocked(getLogins);
const mockConnectLogin = vi.mocked(connectLogin);
const mockLogoutProvider = vi.mocked(logoutProvider);

describe("LoginsStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetLogins.mockResolvedValue({ NATIVE: "Ada" });
	});

	it("takes the config's logins and primary login until a read replaces them", () => {
		const store = new LoginsStore();
		store.seed({ logins: { native: "Ada" }, primaryLogin: "native" });
		expect(store.getSnapshot()).toEqual({
			logins: { NATIVE: "Ada" },
			primaryLogin: "NATIVE",
			connectorAccess: null,
			availableProviders: [],
			status: "ready",
		});

		// a later config, read from the page's cache, never overwrites known logins
		store.seed({ logins: {}, primaryLogin: "NATIVE" });
		expect(store.getSnapshot().logins).toEqual({ NATIVE: "Ada" });
	});

	it("shares one read in flight and reuses a recent one", async () => {
		const store = new LoginsStore();
		const listener = vi.fn();
		store.subscribe(listener);

		const [first, second] = await Promise.all([
			store.refresh(),
			store.refresh(),
		]);
		expect(first).toEqual({ NATIVE: "Ada" });
		expect(second).toBe(first);
		expect(mockGetLogins).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalled();

		await store.refresh();
		expect(mockGetLogins).toHaveBeenCalledTimes(1);
		await store.refresh({ maxAgeMs: 0 });
		expect(mockGetLogins).toHaveBeenCalledTimes(2);
	});

	it("keeps what it knew when a read fails", async () => {
		const store = new LoginsStore();
		store.seed({ logins: { MICROSOFT: "Ada" }, primaryLogin: "NATIVE" });
		mockGetLogins.mockRejectedValueOnce(new Error("offline"));

		await expect(store.refresh({ maxAgeMs: 0 })).rejects.toThrow("offline");
		expect(store.getSnapshot()).toMatchObject({
			logins: { MICROSOFT: "Ada" },
			primaryLogin: "NATIVE",
			status: "error",
		});
	});

	it("takes the config's login settings, keeping only well formed providers", () => {
		const store = new LoginsStore();
		const connectorAccess = { MICROSOFT: { outlook: true } };
		const listener = vi.fn();
		store.seed({
			logins: {},
			connectorAccess: connectorAccess,
			availableProviders: [
				{ provider: "ms", isOauth: true },
				{ name: "no provider" },
			],
		});
		expect(store.getSnapshot()).toMatchObject({
			connectorAccess: connectorAccess,
			availableProviders: [{ provider: "ms", isOauth: true }],
		});

		// the same settings again leave every view alone
		store.subscribe(listener);
		store.seed({
			connectorAccess: connectorAccess,
			availableProviders: [{ provider: "ms", isOauth: true }],
		});
		expect(listener).not.toHaveBeenCalled();
	});

	it("starts over after a reset, taking the next config", () => {
		const store = new LoginsStore();
		store.seed({ logins: { NATIVE: "Ada" }, primaryLogin: "NATIVE" });
		store.reset();
		expect(store.getSnapshot().status).toBe("loading");
		store.seed({ logins: {}, primaryLogin: undefined });
		expect(store.getSnapshot()).toEqual({
			logins: {},
			primaryLogin: null,
			connectorAccess: null,
			availableProviders: [],
			status: "ready",
		});
	});

	it("connects with the session's primary login and reads the logins again", async () => {
		const store = new LoginsStore();
		store.seed({ logins: { NATIVE: "Ada" }, primaryLogin: "NATIVE" });
		mockConnectLogin.mockResolvedValue(true);
		mockGetLogins.mockResolvedValue({ NATIVE: "Ada", MICROSOFT: "Ada" });

		await expect(store.connect("MICROSOFT", "microsoft")).resolves.toBe(
			true,
		);
		expect(mockConnectLogin).toHaveBeenCalledWith({
			provider: "MICROSOFT",
			loginPath: "microsoft",
			primaryLogin: "NATIVE",
		});
		expect(store.getSnapshot().logins).toEqual({
			NATIVE: "Ada",
			MICROSOFT: "Ada",
		});
	});

	it("never signs out the session's own login, or any login while it is unknown", async () => {
		const store = new LoginsStore();
		await expect(store.disconnect("MICROSOFT")).rejects.toThrow(
			"cannot be disconnected",
		);
		store.seed({ logins: { NATIVE: "Ada" }, primaryLogin: "NATIVE" });
		await expect(store.disconnect("NATIVE")).rejects.toThrow(
			"cannot be disconnected",
		);
		expect(mockLogoutProvider).not.toHaveBeenCalled();

		await store.disconnect("MICROSOFT");
		expect(mockLogoutProvider).toHaveBeenCalledWith("MICROSOFT");
		expect(mockGetLogins).toHaveBeenCalled();
	});
});
