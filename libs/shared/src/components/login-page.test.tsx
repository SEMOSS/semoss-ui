import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigStore, Session, SessionStore } from "@semoss/sdk";
import { SessionProvider } from "@semoss/sdk/react";
import { LoginPage } from "./login-page";

const sessions: SessionStore[] = [];

const renderLoginPage = () => {
	const session = new SessionStore({ config: new ConfigStore() });
	sessions.push(session);
	render(
		<SessionProvider session={session}>
			<LoginPage>
				<p>App</p>
			</LoginPage>
		</SessionProvider>,
	);
	return session;
};

describe("LoginPage", () => {
	beforeEach(() => {
		vi.stubGlobal("matchMedia", (media: string) => ({
			matches: false,
			media,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
	});

	afterEach(() => {
		cleanup();
		for (const session of sessions.splice(0)) session.dispose();
		Session.dispose();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("offers to read the session again, not to sign in, when it cannot be read", async () => {
		// the server cannot be reached
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
		renderLoginPage();

		expect(
			await screen.findByRole("button", { name: "Try again" }),
		).toBeTruthy();
		expect(screen.queryByText("App")).toBeNull();
		expect(screen.queryByTestId("loginForm-button-login")).toBeNull();
	});

	it("retries the provided session and displays its new failure reason", async () => {
		let message = "offline";
		vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
			throw new Error(message);
		});
		const singletonRefresh = vi
			.spyOn(Session, "refresh")
			.mockResolvedValue(Session.getSnapshot());
		const session = renderLoginPage();
		const refresh = vi.spyOn(session, "refresh");
		expect(await screen.findByText("offline")).toBeTruthy();

		message = "The session service is unavailable";
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		});

		await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
		expect(await screen.findByText(message)).toBeTruthy();
		expect(screen.queryByText("offline")).toBeNull();
		expect(singletonRefresh).not.toHaveBeenCalled();
	});

	it("recovers to the login form when the provided session can be read again", async () => {
		let isAvailable = false;
		vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
			if (!isAvailable) throw new Error("offline");
			return Response.json({
				logins: {},
				loginDetails: {},
				availableProviders: [
					{
						provider: "native",
						name: "Native",
						label: "NATIVE",
						isOauth: false,
					},
				],
				theme: {},
			});
		});
		const singletonRefresh = vi
			.spyOn(Session, "refresh")
			.mockResolvedValue(Session.getSnapshot());
		renderLoginPage();
		const retry = await screen.findByRole("button", { name: "Try again" });

		isAvailable = true;
		await act(async () => {
			fireEvent.click(retry);
		});

		expect(
			await screen.findByRole("button", { name: "Login" }),
		).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
		expect(singletonRefresh).not.toHaveBeenCalled();
	});
});
