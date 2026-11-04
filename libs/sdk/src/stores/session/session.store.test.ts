import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAdminUser, login, logout } from "../../api/auth";
import { getSystemConfig, runPixel } from "../../api/base";
import { upload } from "../../api/file";
import { getUserInfo, setUserDefaultModel } from "../../api/user";
import { Env } from "../../env";
import { HttpError, UnauthorizedError } from "../../utility/error";
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
vi.mock("../../api/file", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/file")>()),
	upload: vi.fn(),
}));
vi.mock("../../api/user", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/user")>()),
	getUserInfo: vi.fn(),
	setUserDefaultModel: vi.fn(),
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
const mockUpload = vi.mocked(upload);
const mockLogout = vi.mocked(logout);
const mockRunPixel = vi.mocked(runPixel);
const mockSetUserDefaultModel = vi.mocked(setUserDefaultModel);
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
const loginInfo = (name: string, meta: Record<string, unknown> = {}) => ({
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
			logins: { NATIVE: loginInfo("Ada") },
		});
	});

	it("is signed out when the config names no login", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig());
		const { session } = createSession();

		await session.initialize();

		expect(session.getSnapshot()).toMatchObject({
			status: "unauthenticated",
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
			logins: {
				NATIVE: loginInfo("Ada", {
					"text-generation-model": "model-1",
				}),
			},
		});
		const { session, logins } = createSession();

		await Promise.all([session.initialize(), session.initialize()]);

		expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
		expect(session.getSnapshot()).toMatchObject({
			status: "authenticated",
			insightId: "session-insight",
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
	});

	it("describes the user by SAML, then NATIVE, then the first login", async () => {
		mockGetSystemConfig.mockResolvedValue(
			backendConfig({ MICROSOFT: "Ada", SAML: "Ada" }),
		);
		mockGetUserInfo.mockResolvedValue({
			insightId: "session-insight",
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
			status: "unauthenticated",
			user: null,
			insightId: "",
		});
		expect(logins.getSnapshot().status).toBe("loading");
		expect(session.permissions.get("PROJECT", "p1")).toBeNull();
		expect(await session.initialize()).toMatchObject({
			status: "unauthenticated",
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
			status: "unauthenticated",
			user: null,
		});
	});

	it("signs out when the session ends while it is being read", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockGetUserInfo.mockRejectedValue(
			new UnauthorizedError("Redirecting", 302),
		);
		const { session } = createSession();

		await session.initialize();

		expect(session.getSnapshot().status).toBe("unauthenticated");
	});

	it("shows other failures as an error", async () => {
		mockGetSystemConfig.mockRejectedValue(new Error("down"));
		const { session } = createSession();

		await session.initialize();

		expect(session.getSnapshot()).toMatchObject({
			status: "error",
			error: new Error("down"),
		});
	});

	it("runs pixels in the session's insight", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockRunPixel.mockResolvedValue({
			errors: [],
			insightId: "session-insight",
			pixelReturn: [],
		});
		const { session } = createSession();
		await session.initialize();

		await session.run("1+1;");

		expect(mockRunPixel).toHaveBeenCalledWith("1+1;", "session-insight");
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

	it("saves a default model and keeps it on the user", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		mockSetUserDefaultModel.mockResolvedValue();
		const { session } = createSession();
		await session.initialize();

		await session.setDefaultModel("code-generation-model", "model-2");

		expect(mockSetUserDefaultModel).toHaveBeenCalledWith(
			"code-generation-model",
			"model-2",
			"session-insight",
		);
		expect(session.getSnapshot().user?.defaultModels.codeGeneration).toBe(
			"model-2",
		);
	});

	it("reuses its insight across checks and makes one only once", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		const { session } = createSession();

		await session.initialize();
		await session.refresh();

		expect(mockRunPixel).toHaveBeenCalledTimes(1);
		expect(mockRunPixel).toHaveBeenCalledWith("META | init", "new");
		expect(mockGetUserInfo).toHaveBeenNthCalledWith(2, "session-insight");
	});

	it("makes a new insight once when the backend no longer has it", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig({ NATIVE: "Ada" }));
		const { session } = createSession();
		await session.initialize();

		mockRunPixel
			.mockRejectedValueOnce(
				new HttpError("Could not find the insight id", 400, {
					errorType: "INSIGHT_NOT_FOUND",
				}),
			)
			.mockResolvedValueOnce({
				errors: [],
				insightId: "fresh-insight",
				pixelReturn: [],
			})
			.mockResolvedValueOnce({
				errors: [],
				insightId: "fresh-insight",
				pixelReturn: [],
			});
		const result = await session.run("1+1;");

		expect(result.insightId).toBe("fresh-insight");
		expect(mockRunPixel).toHaveBeenCalledWith("META | init", "new");
		expect(mockRunPixel).toHaveBeenLastCalledWith("1+1;", "fresh-insight");
		expect(session.getSnapshot().insightId).toBe("fresh-insight");
	});

	it("makes its insight before an upload, which the backend requires", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig());
		mockUpload.mockResolvedValue([]);
		const { session } = createSession();
		await session.initialize();
		const file = new File(["text"], "notes.txt");

		await session.upload(file, "project-1", "docs");

		expect(mockRunPixel).toHaveBeenCalledWith("META | init", "new");
		expect(mockUpload).toHaveBeenCalledWith(
			file,
			"session-insight",
			"project-1",
			"docs",
		);
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
		expect(session.getSnapshot().status).toBe("error");

		await session.initialize();
		expect(session.getSnapshot().status).toBe("authenticated");
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
			expect(logins.getSnapshot().status).toBe("ready"),
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
			logins: {
				NATIVE: loginInfo("Ada", {
					"text-generation-model": "model-1",
				}),
			},
		});
		let reject: (error: Error) => void = () => {};
		mockSetUserDefaultModel.mockReturnValue(
			new Promise((_, fail) => {
				reject = fail;
			}),
		);
		const { session } = createSession();
		await session.initialize();

		const saving = session.setDefaultModel(
			"text-generation-model",
			"model-2",
		);
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
			logins: {
				NATIVE: loginInfo("Ada", {
					"code-generation-model": "model-1",
				}),
			},
		});
		mockSetUserDefaultModel.mockResolvedValue();
		const { session } = createSession();
		await session.initialize();

		await session.setDefaultModel("code-generation-model", "");

		expect(session.getSnapshot().user?.meta).not.toHaveProperty(
			"code-generation-model",
		);
		expect(session.getSnapshot().user?.defaultModels.codeGeneration).toBe(
			"",
		);
	});

	it("stops listening for the session ending when disposed", () => {
		const stop = vi.fn();
		mockOnUnauthorized.mockReturnValueOnce(stop);
		const { session } = createSession();

		session.dispose();

		expect(stop).toHaveBeenCalledTimes(1);
	});
});
