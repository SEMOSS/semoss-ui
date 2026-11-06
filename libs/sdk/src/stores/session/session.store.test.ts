import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAdminUser, login, logout } from "../../api/auth";
import { getSystemConfig, runPixel } from "../../api/base";
import { getUserInfo, setUserMetadata } from "../../api/user";
import { Env } from "../../env";
import { UnauthorizedError } from "../../utility/error";
import { onUnauthorized } from "../../utility/fetch";
import { ConfigStore } from "../config/config.store";
import { LoginsStore } from "../logins/logins.store";
import { SessionStore } from "./session.store";

vi.mock("../../api/auth", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/auth")>()),
	isAdminUser: vi.fn(),
	login: vi.fn(),
	logout: vi.fn(),
}));
vi.mock("../../api/base", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/base")>()),
	getSystemConfig: vi.fn(),
	runPixel: vi.fn(),
}));
vi.mock("../../api/user", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/user")>()),
	getUserInfo: vi.fn(),
	setUserMetadata: vi.fn(),
}));
vi.mock("../../api/permissions", () => ({
	getUserEnginePermission: vi.fn(),
	getUserProjectPermission: vi.fn().mockResolvedValue("OWNER"),
}));
vi.mock("../../utility/fetch", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../utility/fetch")>()),
	onUnauthorized: vi.fn(),
}));

const mockGetSystemConfig = vi.mocked(getSystemConfig);
const mockGetUserInfo = vi.mocked(getUserInfo);
const mockIsAdminUser = vi.mocked(isAdminUser);
const mockLogin = vi.mocked(login);
const mockLogout = vi.mocked(logout);
const mockRunPixel = vi.mocked(runPixel);
const mockSetUserMetadata = vi.mocked(setUserMetadata);
const mockOnUnauthorized = vi.mocked(onUnauthorized);

/** A config as the backend sends it, signed in to the given logins. */
const backendConfig = (
	logins: Record<string, string> = {},
	overrides: Record<string, unknown> = {},
): Awaited<ReturnType<typeof getSystemConfig>> => ({
	logins: logins,
	loginDetails: {},
	availableProviders: [],
	databaseMetaKeys: [],
	projectMetaKeys: [],
	theme: {},
	nativeRegistration: false,
	msGraphLookup: false,
	csrf: false,
	r: true,
	python: true,
	anonymousUsers: false,
	notificationEnabled: false,
	adminOnlyViewMenuBarFlag: false,
	auditLogEnabled: false,
	timeout: 120,
	...overrides,
});

/** A `GetUserInfo` record for a login. */
const loginInfo = (name: string, meta: Record<string, string[]> = {}) => ({
	id: `${name.toLowerCase()}-id`,
	name: name,
	username: name.toLowerCase(),
	email: `${name.toLowerCase()}@example.com`,
	userEpoch: "1",
	lastLogin: undefined,
	groupInfo: undefined,
	meta: meta,
});

/** A session with its own config and logins, so tests do not share state. */
const createSession = () => {
	const logins = new LoginsStore();
	const session = new SessionStore({ config: new ConfigStore(), logins });
	return { session, logins };
};

describe("SessionStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Env.update({ ACCESS_KEY: "", SECRET_KEY: "", BEARER_TOKEN: "" });
		mockIsAdminUser.mockResolvedValue(false);
		mockOnUnauthorized.mockReturnValue(vi.fn());
		// the session makes its insight with a no-op pixel before using it
		mockRunPixel.mockResolvedValue({
			errors: [],
			insightId: "session-insight",
			pixelReturn: [],
		});
		mockGetUserInfo.mockResolvedValue({
			insightId: "session-insight",
			meta: null,
			logins: { NATIVE: loginInfo("Ada") },
		});
	});

	it("is signed out when the config names no login", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig());
		const { session } = createSession();

		await session.initialize();

		expect(session.getSnapshot()).toMatchObject({
			status: "UNAUTHENTICATED",
			user: null,
		});
		expect(session.isAuthorized).toBe(false);
		expect(mockGetUserInfo).not.toHaveBeenCalled();
	});

	it("reads the user and keeps the insight it ran in", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockIsAdminUser.mockResolvedValue(true);
		mockGetUserInfo.mockResolvedValue({
			insightId: "session-insight",
			meta: null,
			logins: {
				NATIVE: loginInfo("Ada", {
					"text-generation-model": ["model-1"],
				}),
			},
		});
		const { session, logins } = createSession();

		await Promise.all([session.initialize(), session.initialize()]);

		expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
		expect(session.getSnapshot()).toMatchObject({
			status: "AUTHENTICATED",
			user: {
				name: "Ada",
				provider: "NATIVE",
				isAdmin: true,
				isNative: true,
				defaultModels: {
					textGeneration: "model-1",
					codeGeneration: "",
				},
			},
		});
		expect(logins.getSnapshot().logins).toEqual({ NATIVE: "Ada" });
		expect(session.insight.getSnapshot().insightId).toBe("session-insight");
	});

	it("takes the user's metadata from the database, else from their login", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockGetUserInfo.mockResolvedValueOnce({
			insightId: "session-insight",
			meta: { "text-generation-model": ["from-database"] },
			logins: {
				NATIVE: loginInfo("Ada", {
					"text-generation-model": ["from-token"],
				}),
			},
		});
		const { session } = createSession();

		await session.initialize();

		expect(session.getSnapshot().user).toMatchObject({
			meta: { "text-generation-model": ["from-database"] },
			defaultModels: { textGeneration: "from-database" },
		});

		// the database read failed, so the login's own copy is shown
		mockGetUserInfo.mockResolvedValueOnce({
			insightId: "session-insight",
			meta: null,
			logins: {
				NATIVE: loginInfo("Ada", {
					"text-generation-model": ["from-token"],
				}),
			},
		});
		await session.reloadUser();

		expect(session.getSnapshot().user?.defaultModels.textGeneration).toBe(
			"from-token",
		);
	});

	it("reloads only the user, keeping the logins and permissions", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockIsAdminUser.mockResolvedValue(true);
		const { session, logins } = createSession();
		await session.initialize();
		await session.permissions.load("PROJECT", "project-1");
		const loginsBefore = logins.getSnapshot();

		mockGetUserInfo.mockResolvedValueOnce({
			insightId: "session-insight",
			meta: { "text-generation-model": ["model-2"] },
			logins: { NATIVE: loginInfo("Ada") },
		});
		await session.reloadUser();

		expect(session.getSnapshot().user).toMatchObject({
			isAdmin: true,
			defaultModels: { textGeneration: "model-2" },
		});
		expect(logins.getSnapshot()).toBe(loginsBefore);
		expect(session.permissions.get("PROJECT", "project-1")).toMatchObject({
			permission: "OWNER",
		});
		expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
		expect(mockIsAdminUser).toHaveBeenCalledTimes(1);
	});

	it("does not reload the user when signed out", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig());
		const { session } = createSession();
		await session.initialize();

		await session.reloadUser();

		expect(session.getSnapshot().user).toBeNull();
		expect(mockGetUserInfo).not.toHaveBeenCalled();
	});

	it("describes the user by SAML, then NATIVE, then the first login", async () => {
		mockGetSystemConfig.mockResolvedValue(
			backendConfig({ MICROSOFT: "Ada", SAML: "Ada" }),
		);
		mockGetUserInfo.mockResolvedValue({
			insightId: "session-insight",
			meta: null,
			logins: {
				MICROSOFT: loginInfo("Microsoft"),
				SAML: loginInfo("Saml"),
			},
		});
		const { session } = createSession();

		await session.initialize();

		expect(session.getSnapshot().user).toMatchObject({
			provider: "SAML",
			name: "Saml",
			isNative: false,
		});
	});

	it("counts an access key as a session", async () => {
		Env.update({ ACCESS_KEY: "access", SECRET_KEY: "secret" });
		mockGetSystemConfig.mockResolvedValue(backendConfig());
		const { session } = createSession();

		await session.initialize();

		expect(session.isAuthorized).toBe(true);
	});

	it("reads the config again after a login, replacing the signed out logins", async () => {
		mockGetSystemConfig
			.mockResolvedValueOnce(backendConfig())
			.mockResolvedValueOnce(backendConfig({ NATIVE: "Ada" }));
		mockLogin.mockResolvedValue(true);
		const { session, logins } = createSession();
		await session.initialize();

		const signedIn = await session.login({
			type: "native",
			username: "ada",
			password: "secret",
		});

		expect(signedIn).toBe(true);
		expect(mockLogin).toHaveBeenCalledWith("ada", "secret");
		expect(mockGetSystemConfig).toHaveBeenCalledTimes(2);
		expect(logins.getSnapshot().logins).toEqual({ NATIVE: "Ada" });
		expect(session.getSnapshot().user?.name).toBe("Ada");
	});

	it("throws a refused login and stays signed out", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig());
		mockLogin.mockRejectedValue(new Error("Invalid credentials"));
		const { session } = createSession();
		await session.initialize();

		await expect(
			session.login({
				type: "native",
				username: "ada",
				password: "wrong",
			}),
		).rejects.toThrow("Invalid credentials");
		expect(session.isAuthorized).toBe(false);
	});

	it("forgets the user, logins and permissions on logout", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockLogout.mockResolvedValue(true);
		const { session, logins } = createSession();
		await session.initialize();
		await session.permissions.load("PROJECT", "p1");

		await session.logout();

		expect(session.getSnapshot()).toMatchObject({
			status: "UNAUTHENTICATED",
			user: null,
		});
		expect(session.insight.getSnapshot().insightId).toBe("");
		expect(logins.getSnapshot().status).toBe("LOADING");
		expect(session.permissions.get("PROJECT", "p1")).toBeNull();
		expect(await session.initialize()).toMatchObject({
			status: "UNAUTHENTICATED",
		});
	});

	it("signs out when the backend sends a request away to sign in", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		const { session } = createSession();
		await session.initialize();

		// the listener this session registered with the fetch interceptor
		const listener = mockOnUnauthorized.mock.calls.at(-1)?.[0];
		listener?.(new UnauthorizedError("Redirecting", 302));

		expect(session.getSnapshot()).toMatchObject({
			status: "UNAUTHENTICATED",
			user: null,
		});
	});

	it("reads the config again when the backend ends the session", async () => {
		mockGetSystemConfig
			.mockResolvedValueOnce(backendConfig({ NATIVE: "Ada" }))
			.mockResolvedValueOnce(backendConfig());
		const { session, logins } = createSession();
		await session.initialize();

		const listener = mockOnUnauthorized.mock.calls.at(-1)?.[0];
		listener?.(new UnauthorizedError("Redirecting", 302));
		await vi.waitFor(() =>
			expect(logins.getSnapshot().status).toBe("READY"),
		);

		expect(mockGetSystemConfig).toHaveBeenCalledTimes(2);
		expect(session.config.getSnapshot().config?.logins).toEqual({});
		expect(logins.getSnapshot().logins).toEqual({});
	});

	it("forgets the config when it cannot be read after a sign out", async () => {
		mockGetSystemConfig
			.mockResolvedValueOnce(backendConfig({ NATIVE: "Ada" }))
			.mockRejectedValueOnce(new Error("down"));
		mockLogout.mockResolvedValue(true);
		const { session } = createSession();
		await session.initialize();

		await session.logout();
		await vi.waitFor(() =>
			expect(session.config.getSnapshot().status).toBe("IDLE"),
		);

		// nothing of the old user's logins is left to show
		expect(session.config.getSnapshot().config).toBeNull();
	});

	it("does not hear 302s until the page uses the session", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		const { session } = createSession();
		expect(mockOnUnauthorized).not.toHaveBeenCalled();

		await session.initialize();
		await session.refresh();

		expect(mockOnUnauthorized).toHaveBeenCalledTimes(1);
	});

	it("signs out when the session ends while it is being read", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockGetUserInfo.mockRejectedValue(
			new UnauthorizedError("Redirecting", 302),
		);
		const { session } = createSession();

		await session.initialize();

		expect(session.getSnapshot().status).toBe("UNAUTHENTICATED");
	});

	it("shows other failures as an error", async () => {
		mockGetSystemConfig.mockRejectedValue(new Error("down"));
		const { session } = createSession();

		await session.initialize();

		expect(session.getSnapshot()).toMatchObject({
			status: "ERROR",
			error: new Error("down"),
		});
	});

	it("lets admins, or anyone the config allows, do admin-only operations", async () => {
		mockGetSystemConfig.mockResolvedValue(
			backendConfig({ NATIVE: "Ada" }, { adminOnlyDbAdd: false }),
		);
		const { session } = createSession();
		await session.initialize();

		expect(session.canPerform("DATABASE", "add")).toBe(true);
		expect(session.canPerform("DATABASE", "delete")).toBe(false);

		mockIsAdminUser.mockResolvedValue(true);
		await session.refresh();
		expect(session.canPerform("DATABASE", "delete")).toBe(true);
	});

	it("saves metadata, then reads what the database kept", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockSetUserMetadata.mockResolvedValue();
		const { session } = createSession();
		await session.initialize();

		mockGetUserInfo.mockResolvedValueOnce({
			insightId: "session-insight",
			meta: { "code-generation-model": ["model-2"] },
			logins: { NATIVE: loginInfo("Ada") },
		});
		await session.setMetadata({ "code-generation-model": "model-2" });

		expect(mockSetUserMetadata).toHaveBeenCalledWith(
			{ "code-generation-model": ["model-2"] },
			"session-insight",
		);
		expect(mockGetUserInfo).toHaveBeenLastCalledWith("session-insight");
		expect(session.getSnapshot().user?.defaultModels.codeGeneration).toBe(
			"model-2",
		);
	});

	it("shows what the database kept, even when the save reported success", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockSetUserMetadata.mockResolvedValue();
		const { session } = createSession();
		await session.initialize();

		// the backend logs a failed write and still answers true
		mockGetUserInfo.mockResolvedValueOnce({
			insightId: "session-insight",
			meta: {},
			logins: { NATIVE: loginInfo("Ada") },
		});
		await session.setMetadata({ "text-generation-model": "model-2" });

		expect(session.getSnapshot().user?.meta).toEqual({});
	});

	it("changes only the keys given, keeping list values in order", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockGetUserInfo.mockResolvedValue({
			insightId: "session-insight",
			meta: { "text-generation-model": ["model-1"] },
			logins: { NATIVE: loginInfo("Ada") },
		});
		// hold the save, so the change shown before it is seen
		mockSetUserMetadata.mockReturnValue(new Promise(() => undefined));
		const { session } = createSession();
		await session.initialize();

		void session.setMetadata({ tags: ["b", "a"] });

		await vi.waitFor(() =>
			expect(session.getSnapshot().user?.meta).toEqual({
				"text-generation-model": ["model-1"],
				tags: ["b", "a"],
			}),
		);
	});

	it("makes its insight by reading the user, in one request", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		const { session } = createSession();

		await session.initialize();
		await session.refresh();

		expect(mockRunPixel).not.toHaveBeenCalled();
		expect(mockGetUserInfo).toHaveBeenNthCalledWith(1, "new");
		expect(mockGetUserInfo).toHaveBeenNthCalledWith(2, "session-insight");
		expect(session.insight.getSnapshot().insightId).toBe("session-insight");
	});

	it("runs a pixel started during the first check in the insight the check makes", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		const { session } = createSession();

		const checking = session.initialize();
		await vi.waitFor(() => expect(mockGetUserInfo).toHaveBeenCalled());
		await Promise.all([checking, session.insight.run("1+1;")]);

		expect(mockRunPixel).toHaveBeenCalledTimes(1);
		expect(mockRunPixel).toHaveBeenCalledWith("1+1;", "session-insight");
	});

	it("describes the user by the primary login first", async () => {
		mockGetSystemConfig.mockResolvedValue(
			backendConfig(
				{ MICROSOFT: "Ada", NATIVE: "Ada" },
				{ primaryLogin: "MICROSOFT" },
			),
		);
		mockGetUserInfo.mockResolvedValue({
			insightId: "session-insight",
			meta: null,
			logins: {
				NATIVE: loginInfo("Native"),
				MICROSOFT: loginInfo("Microsoft"),
			},
		});
		const { session } = createSession();

		await session.initialize();

		expect(session.getSnapshot().user).toMatchObject({
			provider: "MICROSOFT",
			name: "Microsoft",
		});
	});

	it("starts a new insight on login, since the backend session may change", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockLogin.mockResolvedValue(true);
		const { session } = createSession();
		await session.initialize();

		mockGetUserInfo.mockResolvedValue({
			insightId: "new-session-insight",
			meta: null,
			logins: { NATIVE: loginInfo("Ada") },
		});
		await session.login({
			type: "native",
			username: "ada",
			password: "pw",
		});

		expect(mockGetUserInfo).toHaveBeenLastCalledWith("new");
		expect(session.insight.getSnapshot().insightId).toBe(
			"new-session-insight",
		);
	});

	it("throws when the session cannot be read after a login", async () => {
		mockGetSystemConfig
			.mockResolvedValueOnce(backendConfig())
			.mockResolvedValueOnce(backendConfig({ NATIVE: "Ada" }));
		mockLogin.mockResolvedValue(true);
		mockIsAdminUser.mockRejectedValue(new Error("server down"));
		const { session } = createSession();
		await session.initialize();

		await expect(
			session.login({
				type: "native",
				username: "ada",
				password: "secret",
			}),
		).rejects.toThrow("server down");
	});

	it("reads the session again on the next initialize after an error", async () => {
		mockGetSystemConfig
			.mockRejectedValueOnce(new Error("down"))
			.mockResolvedValueOnce(backendConfig({ NATIVE: "Ada" }));
		const { session } = createSession();

		await session.initialize();
		expect(session.getSnapshot().status).toBe("ERROR");

		await session.initialize();
		expect(session.getSnapshot().status).toBe("AUTHENTICATED");
	});

	it("offers the signed out config's sign ins after logout", async () => {
		mockGetSystemConfig
			.mockResolvedValueOnce(backendConfig({ NATIVE: "Ada" }))
			.mockResolvedValueOnce(
				backendConfig(
					{},
					{
						availableProviders: [
							{
								provider: "native",
								name: "Native",
								label: "NATIVE",
								isOauth: false,
							},
						],
					},
				),
			);
		mockLogout.mockResolvedValue(true);
		const { session, logins } = createSession();
		await session.initialize();

		await session.logout();
		await vi.waitFor(() =>
			expect(logins.getSnapshot().status).toBe("READY"),
		);

		expect(logins.getSnapshot()).toMatchObject({
			logins: {},
			availableProviders: [{ provider: "native", isOauth: false }],
		});
	});

	it("shows a default model at once and reverts it when the save fails", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockGetUserInfo.mockResolvedValue({
			insightId: "session-insight",
			meta: null,
			logins: {
				NATIVE: loginInfo("Ada", {
					"text-generation-model": ["model-1"],
				}),
			},
		});
		let reject: (error: Error) => void = () => {};
		mockSetUserMetadata.mockReturnValue(
			new Promise((_, fail) => {
				reject = fail;
			}),
		);
		const { session } = createSession();
		await session.initialize();

		const saving = session.setMetadata({
			"text-generation-model": "model-2",
		});
		await vi.waitFor(() =>
			expect(
				session.getSnapshot().user?.defaultModels.textGeneration,
			).toBe("model-2"),
		);
		reject(new Error("refused"));

		await expect(saving).rejects.toThrow("refused");
		expect(session.getSnapshot().user?.defaultModels.textGeneration).toBe(
			"model-1",
		);
	});

	it("removes a default model's key rather than blanking it", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockGetUserInfo.mockResolvedValue({
			insightId: "session-insight",
			meta: null,
			logins: {
				NATIVE: loginInfo("Ada", {
					"code-generation-model": ["model-1"],
				}),
			},
		});
		mockSetUserMetadata.mockResolvedValue();
		const { session } = createSession();
		await session.initialize();

		// the reload after saving has the key removed too
		mockGetUserInfo.mockResolvedValueOnce({
			insightId: "session-insight",
			meta: null,
			logins: { NATIVE: loginInfo("Ada") },
		});
		await session.setMetadata({ "code-generation-model": "" });

		expect(mockSetUserMetadata).toHaveBeenCalledWith(
			{ "code-generation-model": [] },
			"session-insight",
		);

		expect(session.getSnapshot().user?.meta).not.toHaveProperty(
			"code-generation-model",
		);
		expect(session.getSnapshot().user?.defaultModels.codeGeneration).toBe(
			"",
		);
	});

	it("stops listening for the session ending when disposed", async () => {
		const stop = vi.fn();
		mockOnUnauthorized.mockReturnValueOnce(stop);
		mockGetSystemConfig.mockResolvedValue(backendConfig());
		const { session } = createSession();
		await session.initialize();

		session.dispose();

		expect(stop).toHaveBeenCalledTimes(1);
	});
});
