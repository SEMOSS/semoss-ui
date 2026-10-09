import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "../utility";
import { connectLogin, oauth, parseLogins } from "./auth";

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

	it("starts the sign in with no redirect at its end, and finishes when the popup closes itself", async () => {
		vi.useFakeTimers();
		const openPopup = {
			closed: false,
			location: { href: "" },
			close: vi.fn(),
		};
		vi.stubGlobal("window", {
			open: vi.fn(() => openPopup),
			location: { origin: "http://localhost:5174" },
			setInterval: (handler: () => void, ms: number) =>
				globalThis.setInterval(handler, ms),
			clearInterval: (id: ReturnType<typeof setInterval>) =>
				globalThis.clearInterval(id),
		});
		mockGet.mockImplementation((async () => ({ data: {} })) as typeof get);

		try {
			const signIn = connectLogin({
				provider: "MICROSOFT",
				primaryLogin: "NATIVE",
			});
			await vi.waitFor(() =>
				expect(openPopup.location.href).toContain(
					"/api/auth/login/microsoft?disableRedirect=true",
				),
			);

			openPopup.closed = true;
			await vi.advanceTimersByTimeAsync(1000);
			await expect(signIn).resolves.toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it("rejects with PopupBlockedError when the browser blocks the popup", async () => {
		vi.stubGlobal("window", { open: vi.fn(() => null) });
		await expect(
			connectLogin({ provider: "MICROSOFT", primaryLogin: "NATIVE" }),
		).rejects.toMatchObject({ name: "PopupBlockedError" });
	});
});

describe("oauth", () => {
	/** A popup that has left for another origin, so it cannot be read. */
	const createPopup = (closed = false) => ({
		closed: closed,
		close: vi.fn(),
		get location(): never {
			throw new Error("Blocked a frame with a different origin");
		},
	});

	/** Answers the provider's user info: no name until the login is done. */
	const answerUserInfo = (names: (string | undefined)[]) => {
		mockGet.mockImplementation((async () => ({
			data: { name: names.length > 1 ? names.shift() : names[0] },
		})) as typeof get);
	};

	const stubWindow = (popup: unknown) => {
		const open = vi.fn(() => popup);
		vi.stubGlobal("window", {
			top: { open: open },
			location: { origin: "http://localhost:5174" },
			setInterval: (handler: () => void, ms: number) =>
				globalThis.setInterval(handler, ms),
			clearInterval: (id: ReturnType<typeof setInterval>) =>
				globalThis.clearInterval(id),
		});
		return open;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("opens no popup when the session already holds the login", async () => {
		answerUserInfo(["Ada"]);
		const open = stubWindow(createPopup());

		await expect(oauth("ms")).resolves.toBe(true);
		expect(open).not.toHaveBeenCalled();
	});

	it("closes the popup once the login shows up, though the popup landed on another origin", async () => {
		// none before the popup opens, then the name on the first read after it
		answerUserInfo([undefined, "Ada"]);
		const popup = createPopup();
		const open = stubWindow(popup);

		const signIn = oauth("ms");
		await vi.advanceTimersByTimeAsync(2000);

		await expect(signIn).resolves.toBe(true);
		expect(open).toHaveBeenCalledWith(
			expect.stringContaining("/api/auth/login/ms?disableRedirect=true"),
			"_blank",
			expect.any(String),
		);
		expect(popup.close).toHaveBeenCalled();
	});

	it("fails instead of waiting forever when the popup closes without a login", async () => {
		answerUserInfo([undefined]);
		stubWindow(createPopup(true));

		const signIn = oauth("ms");
		const failure = expect(signIn).rejects.toThrow("Unable to login");
		await vi.advanceTimersByTimeAsync(1000);
		await failure;
	});

	it("rejects with PopupBlockedError when the browser blocks the popup", async () => {
		answerUserInfo([undefined]);
		stubWindow(null);

		await expect(oauth("ms")).rejects.toMatchObject({
			name: "PopupBlockedError",
		});
	});
});
