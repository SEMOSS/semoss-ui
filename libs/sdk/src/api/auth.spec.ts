import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "../utility";
import { connectLogin, parseLogins } from "./auth";

vi.mock("../utility", async (importOriginal) => ({
	...(await importOriginal<typeof import("../utility")>()),
	get: vi.fn(),
}));

const mockGet = vi.mocked(get);

describe("parseLogins", () => {
	it("keys logins by provider in upper case and leaves out entries without a name", () => {
		expect(
			parseLogins({ native: "Ada", Microsoft: "Ada", GOOGLE: 3 }),
		).toEqual({ NATIVE: "Ada", MICROSOFT: "Ada" });
		expect(parseLogins(null)).toEqual({});
		expect(parseLogins("NATIVE")).toEqual({});
	});
});

describe("connectLogin", () => {
	// a popup the user has already closed, so the sign in ends without polling
	const popup = { closed: true, location: { href: "" }, close: vi.fn() };
	const logoutCalls = () =>
		mockGet.mock.calls
			.map(([path]) => path)
			.filter((path) => path.includes("/api/auth/logout/"));

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("window", { open: vi.fn(() => popup) });
		mockGet.mockImplementation((async (path: string) => ({
			data: path.includes("/api/auth/logins")
				? { NATIVE: "Ada", MICROSOFT: "Ada" }
				: true,
		})) as typeof get);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("finds the provider in any case and signs its stale login out first", async () => {
		await expect(
			connectLogin({ provider: "microsoft", primaryLogin: "native" }),
		).resolves.toBe(true);
		expect(logoutCalls()).toEqual([
			expect.stringContaining(
				"/api/auth/logout/MICROSOFT?disableRedirect=true",
			),
		]);
	});

	it("never signs out the session's own login, whatever its case", async () => {
		await connectLogin({ provider: "native", primaryLogin: "NATIVE" });
		await connectLogin({ provider: "MICROSOFT", primaryLogin: null });
		expect(logoutCalls()).toEqual([]);
	});

	it("rejects with PopupBlockedError when the browser blocks the popup", async () => {
		vi.stubGlobal("window", { open: vi.fn(() => null) });
		await expect(
			connectLogin({ provider: "MICROSOFT", primaryLogin: "NATIVE" }),
		).rejects.toMatchObject({ name: "PopupBlockedError" });
	});
});
