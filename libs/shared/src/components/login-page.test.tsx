import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfigStore, SessionStore } from "@semoss/sdk";
import { SessionProvider } from "@semoss/sdk/react";
import { LoginPage } from "./login-page";

describe("LoginPage", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("offers to read the session again, not to sign in, when it cannot be read", async () => {
		// the server cannot be reached
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
		const session = new SessionStore({ config: new ConfigStore() });

		render(
			<SessionProvider session={session}>
				<LoginPage>
					<p>App</p>
				</LoginPage>
			</SessionProvider>,
		);

		expect(
			await screen.findByRole("button", { name: "Try again" }),
		).toBeTruthy();
		expect(screen.queryByText("App")).toBeNull();
		expect(screen.queryByTestId("loginForm-button-login")).toBeNull();
	});
});
