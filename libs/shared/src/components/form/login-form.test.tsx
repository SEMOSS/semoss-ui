import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Config, ConfigStore, Session, SessionStore } from "@semoss/sdk";
import { SessionProvider } from "@semoss/sdk/react";
import { LoginForm } from "./login-form";

const sessions: SessionStore[] = [];

const offerProvider = (provider: string, name: string, isOauth = false) => {
	vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
		Response.json({
			logins: {},
			loginDetails: {},
			availableProviders: [
				{ provider, name, label: provider.toUpperCase(), isOauth },
			],
			theme: {},
		}),
	);
};

const renderProvidedLogin = () => {
	const session = new SessionStore({ config: new ConfigStore() });
	sessions.push(session);
	const login = vi.spyOn(session, "login").mockResolvedValue(true);
	const requestOTP = vi.spyOn(session, "requestOTP").mockResolvedValue(true);
	render(
		<SessionProvider session={session}>
			<LoginForm />
		</SessionProvider>,
	);
	return { login, requestOTP };
};

const enterCredentials = async (passwordLabel = "Password") => {
	fireEvent.change(await screen.findByLabelText("Username"), {
		target: { value: "test-user" },
	});
	fireEvent.change(screen.getByLabelText(passwordLabel), {
		target: { value: "test-password" },
	});
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Login" }));
	});
};

describe("LoginForm session actions", () => {
	beforeEach(() => {
		Config.reset();
		vi.spyOn(Session, "login").mockResolvedValue(true);
		vi.spyOn(Session, "requestOTP").mockResolvedValue(true);
	});

	afterEach(() => {
		cleanup();
		for (const session of sessions.splice(0)) session.dispose();
		Session.dispose();
		Config.reset();
		vi.restoreAllMocks();
	});

	it.each(["native", "ldap"] as const)(
		"uses the provided session for %s credentials",
		async (type) => {
			offerProvider(type, type);
			const { login } = renderProvidedLogin();

			await enterCredentials();

			await waitFor(() =>
				expect(login).toHaveBeenCalledWith({
					type,
					username: "test-user",
					password: "test-password",
				}),
			);
			expect(Session.login).not.toHaveBeenCalled();
		},
	);

	it("requests and confirms an OTP through the provided session", async () => {
		offerProvider("linotp", "LinOTP");
		const { login, requestOTP } = renderProvidedLogin();

		await enterCredentials("Pin");
		fireEvent.change(
			await screen.findByLabelText("OTP Confirmation Code"),
			{
				target: { value: "123456" },
			},
		);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
		});

		expect(requestOTP).toHaveBeenCalledWith("test-user", "test-password");
		await waitFor(() =>
			expect(login).toHaveBeenCalledWith({
				type: "linotp",
				otp: "123456",
			}),
		);
		expect(Session.requestOTP).not.toHaveBeenCalled();
		expect(Session.login).not.toHaveBeenCalled();
	});

	it("starts OAuth through the provided session directly from the click", async () => {
		offerProvider("google", "Google", true);
		const { login } = renderProvidedLogin();

		const button = await screen.findByRole("button", { name: "Google" });
		await act(async () => {
			fireEvent.click(button);
			expect(login).toHaveBeenCalledWith({
				type: "oauth",
				provider: "google",
			});
		});
		expect(Session.login).not.toHaveBeenCalled();
		await waitFor(() =>
			expect(
				screen
					.getByRole("button", { name: "Google" })
					.hasAttribute("disabled"),
			).toBe(false),
		);
	});

	it("keeps credentials and allows a retry after a refused login", async () => {
		offerProvider("native", "Native");
		const { login } = renderProvidedLogin();
		login.mockRejectedValueOnce(new Error("Credentials refused"));

		await enterCredentials();
		expect(await screen.findByText("Credentials refused")).toBeTruthy();
		expect(
			screen.getByRole<HTMLInputElement>("textbox", { name: "Username" })
				.value,
		).toBe("test-user");
		const button = screen.getByRole("button", { name: "Login" });
		expect(button.hasAttribute("disabled")).toBe(false);
		await act(async () => {
			fireEvent.click(button);
		});

		await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
		expect(screen.queryByText("Credentials refused")).toBeNull();
		expect(Session.login).not.toHaveBeenCalled();
	});

	it("uses the singleton when no session provider is supplied", async () => {
		offerProvider("native", "Native");
		render(<LoginForm />);

		await enterCredentials();

		await waitFor(() =>
			expect(Session.login).toHaveBeenCalledWith({
				type: "native",
				username: "test-user",
				password: "test-password",
			}),
		);
	});
});
