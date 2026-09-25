import { beforeEach, describe, expect, it, vi } from "vitest";
import { createConfigStore } from "../config/config.store";
import { createSessionStore, type SessionStoreState } from "./session.store";

const mocks = vi.hoisted(() => ({
	config: vi.fn(),
	login: vi.fn(),
	loginLDAP: vi.fn(),
	loginOTP: vi.fn(),
	confirmOTP: vi.fn(),
	oauth: vi.fn(),
	isAdminUser: vi.fn(),
	runPixel: vi.fn(),
	logout: vi.fn(),
}));

vi.mock("@/api", () => ({ ...mocks, registerUser: vi.fn() }));
vi.mock("@semoss/sdk/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/sdk/react")>();
	return {
		...actual,
		runPixel: mocks.runPixel,
		logout: mocks.logout,
	};
});

const microsoftConfig = {
	logins: { MICROSOFT: "microsoft-user" },
	loginDetails: { MICROSOFT: { name: "Microsoft user" } },
	availableProviders: [],
};

/** Start with the anonymous configuration loaded before sign-in. */
const createSignedOutStores = async () => {
	const configStore = createConfigStore();
	mocks.config.mockResolvedValueOnce({ logins: {}, availableProviders: [] });
	const sessionStore = createSessionStore(configStore);
	await sessionStore
		.getState()
		.initialize(await configStore.getState().initialize());
	mocks.config.mockClear();
	return { configStore, sessionStore };
};

describe("configuration after sign-in", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.config.mockResolvedValue(microsoftConfig);
		mocks.isAdminUser.mockResolvedValue(false);
		mocks.runPixel.mockResolvedValue({
			insightId: "insight-1",
			errors: [],
			pixelReturn: [
				{
					output: {
						MICROSOFT: {
							id: "microsoft-user",
							name: "Microsoft user",
							email: "user@example.com",
							meta: {},
						},
					},
				},
			],
		});
	});

	it("publishes the Microsoft login before the profile can open, without a reload", async () => {
		const { configStore, sessionStore } = await createSignedOutStores();
		const loginsAtSessionReady: unknown[] = [];
		const unsubscribe = sessionStore.subscribe((state) => {
			if (state.status === "SUCCESS") {
				loginsAtSessionReady.push(configStore.getState().config.logins);
			}
		});

		await expect(sessionStore.getState().oauth("microsoft")).resolves.toBe(
			true,
		);
		unsubscribe();

		expect(mocks.oauth).toHaveBeenCalledWith("microsoft");
		expect(loginsAtSessionReady).toEqual([microsoftConfig.logins]);
		expect(configStore.getState().config.loginDetails).toEqual(
			microsoftConfig.loginDetails,
		);
		expect(sessionStore.getState().user.id).toBe("microsoft-user");
	});

	it.each<{
		name: string;
		provider: string;
		signIn: (session: SessionStoreState) => Promise<boolean>;
	}>([
		{
			name: "native login",
			provider: "NATIVE",
			signIn: (session) => session.login("user", "password"),
		},
		{
			name: "LDAP login",
			provider: "LDAP",
			signIn: (session) => session.loginLDAP("user", "password"),
		},
		{
			name: "OTP confirmation",
			provider: "LINOTP",
			signIn: (session) => session.confirmOTP("123456"),
		},
	])("refreshes login metadata after $name", async ({ provider, signIn }) => {
		const { configStore, sessionStore } = await createSignedOutStores();
		const logins = { [provider]: "user" };
		mocks.config.mockResolvedValue({ logins, availableProviders: [] });

		await signIn(sessionStore.getState());

		expect(configStore.getState().config.logins).toEqual(logins);
		expect(sessionStore.getState().status).toBe("SUCCESS");
	});

	it("removes the previous Microsoft login when another account signs in", async () => {
		const { configStore, sessionStore } = await createSignedOutStores();
		await sessionStore.getState().oauth("microsoft");
		await sessionStore.getState().logout();
		mocks.config.mockResolvedValue({
			logins: { NATIVE: "another-user" },
			availableProviders: [],
		});

		await sessionStore.getState().login("another-user", "password");

		expect(configStore.getState().config.logins).toEqual({
			NATIVE: "another-user",
		});
	});

	it("does not open the profile while updated configuration is still loading", async () => {
		const { configStore, sessionStore } = await createSignedOutStores();
		let resolveConfig: (config: typeof microsoftConfig) => void = () =>
			undefined;
		mocks.config.mockReturnValue(
			new Promise<typeof microsoftConfig>((resolve) => {
				resolveConfig = resolve;
			}),
		);

		const signingIn = sessionStore.getState().oauth("microsoft");
		await vi.waitFor(() => expect(mocks.config).toHaveBeenCalledOnce());
		expect(sessionStore.getState().status).toBe("MISSING AUTHENTICATION");
		expect(mocks.runPixel).not.toHaveBeenCalled();

		resolveConfig(microsoftConfig);
		await signingIn;

		expect(configStore.getState().config.logins).toEqual(
			microsoftConfig.logins,
		);
		expect(sessionStore.getState().status).toBe("SUCCESS");
	});

	it("leaves configuration alone when authentication fails", async () => {
		const { configStore, sessionStore } = await createSignedOutStores();
		mocks.oauth.mockRejectedValue(new Error("Sign-in failed"));

		await expect(
			sessionStore.getState().oauth("microsoft"),
		).rejects.toThrow("Sign-in failed");

		expect(mocks.config).not.toHaveBeenCalled();
		expect(configStore.getState().config.logins).toEqual({});
		expect(sessionStore.getState().status).toBe("MISSING AUTHENTICATION");
	});

	it("surfaces a failed configuration refresh instead of opening a stale profile", async () => {
		const { sessionStore } = await createSignedOutStores();
		mocks.config.mockRejectedValue(new Error("Configuration unavailable"));

		await expect(
			sessionStore.getState().oauth("microsoft"),
		).rejects.toThrow("Configuration unavailable");

		expect(mocks.runPixel).not.toHaveBeenCalled();
		expect(sessionStore.getState().status).toBe("MISSING AUTHENTICATION");
	});
});
