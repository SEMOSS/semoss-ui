import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	confirmOTP,
	download,
	getSystemConfig,
	isAdminUser,
	login,
	loginLDAP,
	loginOTP,
	logout,
	oauth,
	registerUser,
	runPixel,
	setUserMetadata,
	upload,
} from "../../api";
import { HttpError } from "../../utility";
import { createSessionStore } from "./session.store";
import type { SystemConfig } from "./session.types";

vi.mock("../../api", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../../api")>();
	return {
		...actual,
		confirmOTP: vi.fn(),
		download: vi.fn(),
		getSystemConfig: vi.fn(),
		isAdminUser: vi.fn(),
		login: vi.fn(),
		loginLDAP: vi.fn(),
		loginOTP: vi.fn(),
		logout: vi.fn(),
		oauth: vi.fn(),
		registerUser: vi.fn(),
		runPixel: vi.fn(),
		setUserMetadata: vi.fn(),
		upload: vi.fn(),
	};
});

const confirmOtpMock = vi.mocked(confirmOTP);
const downloadMock = vi.mocked(download);
const getSystemConfigMock = vi.mocked(getSystemConfig);
const isAdminUserMock = vi.mocked(isAdminUser);
const loginMock = vi.mocked(login);
const loginLdapMock = vi.mocked(loginLDAP);
const loginOtpMock = vi.mocked(loginOTP);
const logoutMock = vi.mocked(logout);
const oauthMock = vi.mocked(oauth);
const registerUserMock = vi.mocked(registerUser);
const runPixelMock = vi.mocked(runPixel);
const setUserMetadataMock = vi.mocked(setUserMetadata);
const uploadMock = vi.mocked(upload);

const createConfig = (loggedIn = false) =>
	({
		csrf: true,
		logins: loggedIn ? { NATIVE: "user-1" } : {},
		loginDetails: {},
	}) as SystemConfig;

const userInfoResult = (
	id = "user-1",
	epoch = "epoch-1",
	insightId = "user-insight",
) => ({
	errors: [],
	insightId,
	pixelReturn: [
		{
			isMeta: false,
			operationType: [],
			output: {
				NATIVE: {
					id,
					name: "Ada Lovelace",
					username: "ada",
					email: "ada@example.test",
					userEpoch: epoch,
					meta: {
						default_model: ["model-primary", "model-secondary"],
					},
					lastLogin: "2026-09-23",
					lastPwdReset: null,
					san: { department: "Research" },
					groupInfo: {
						groupType: "TEAM",
						groups: ["analysts", "authors"],
					},
				},
			},
			pixelExpression: "GetUserInfo();",
			pixelId: "pixel-1",
			timeToRun: 1,
		},
	],
});

const deferred = <Value>() => {
	let resolve!: (value: Value) => void;
	const promise = new Promise<Value>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
};

describe("createSessionStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSystemConfigMock.mockResolvedValue(createConfig());
		isAdminUserMock.mockResolvedValue(false);
		loginMock.mockResolvedValue(true);
		loginLdapMock.mockResolvedValue(true);
		loginOtpMock.mockResolvedValue(true);
		confirmOtpMock.mockResolvedValue(true);
		oauthMock.mockResolvedValue(true);
		registerUserMock.mockResolvedValue();
		logoutMock.mockResolvedValue(true);
		setUserMetadataMock.mockResolvedValue();
		uploadMock.mockResolvedValue([]);
		downloadMock.mockResolvedValue(new ArrayBuffer(0));
	});

	it("shares concurrent initialization and handles an unauthenticated session", async () => {
		const configResponse = deferred<SystemConfig>();
		getSystemConfigMock.mockReturnValue(configResponse.promise);
		const store = createSessionStore();

		const first = store.getState().actions.initialize();
		const second = store.getState().actions.initialize();

		expect(first).toBe(second);
		expect(getSystemConfigMock).toHaveBeenCalledTimes(1);
		expect(store.getState().lifecycle.initialization).toBe("loading");

		configResponse.resolve(createConfig());
		await first;
		expect(store.getState().lifecycle).toMatchObject({
			initialization: "ready",
			authentication: "unauthenticated",
			error: null,
		});
		expect(runPixelMock).not.toHaveBeenCalled();
	});

	it("stores raw metadata arrays and clears user-scoped state on identity change", async () => {
		getSystemConfigMock.mockResolvedValue(createConfig(true));
		isAdminUserMock.mockResolvedValue(true);
		runPixelMock
			.mockResolvedValueOnce(userInfoResult())
			.mockResolvedValueOnce(userInfoResult("user-2", "epoch-2"));
		const store = createSessionStore();
		await store.getState().actions.initialize();

		store
			.getState()
			.access.actions.primePermission("ENGINE", "engine-1", "OWNER");
		expect(store.getState().user.current).toMatchObject({
			provider: "NATIVE",
			id: "user-1",
			admin: true,
			meta: {
				default_model: ["model-primary", "model-secondary"],
			},
		});

		await store.getState().user.actions.refresh();

		expect(store.getState().user.current?.id).toBe("user-2");
		expect(store.getState().access.entries.ENGINE).toEqual({});
		expect(store.getState().insightId).toBe("user-insight");
	});

	it.each([
		[
			"native",
			{ method: "native" as const, username: "ada", password: "secret" },
			loginMock,
		],
		[
			"ldap",
			{ method: "ldap" as const, username: "ada", password: "secret" },
			loginLdapMock,
		],
		["oauth", { method: "oauth" as const, provider: "SAML" }, oauthMock],
		["otp", { method: "otp" as const, otp: "123456" }, confirmOtpMock],
	])("supports %s login", async (_name, input, authenticationRequest) => {
		getSystemConfigMock.mockResolvedValue(createConfig(true));
		runPixelMock.mockResolvedValue(userInfoResult());
		const store = createSessionStore();

		await store.getState().actions.login(input);

		expect(authenticationRequest).toHaveBeenCalledTimes(1);
		expect(store.getState().lifecycle.authentication).toBe("authenticated");
		expect(store.getState().user.current?.id).toBe("user-1");
	});

	it("handles OTP challenges and password-change responses", async () => {
		const store = createSessionStore();

		await expect(
			store
				.getState()
				.actions.requestOtp({ username: "ada", pin: "1234" }),
		).resolves.toBe("otp-required");
		expect(loginOtpMock).toHaveBeenCalledWith("ada", "1234");

		loginOtpMock.mockRejectedValueOnce(
			new HttpError("Password change required", 401, {
				requirePwdChange: true,
			}),
		);
		await expect(
			store
				.getState()
				.actions.requestOtp({ username: "ada", pin: "1234" }),
		).resolves.toBe("password-change-required");
	});

	it("registers without authenticating the new user", async () => {
		const store = createSessionStore();
		const input = {
			name: "Ada Lovelace",
			username: "ada",
			email: "ada@example.test",
			password: "secret",
			phone: "5551234",
			phoneExtension: "9",
			countryCode: "1",
		};

		await store.getState().actions.register(input);

		expect(registerUserMock).toHaveBeenCalledWith(input);
		expect(store.getState().lifecycle.authentication).toBe(
			"unauthenticated",
		);
		expect(store.getState().user.current).toBeNull();
	});

	it("updates metadata through the transport and refreshes the raw user", async () => {
		getSystemConfigMock.mockResolvedValue(createConfig(true));
		runPixelMock.mockResolvedValue(userInfoResult());
		const store = createSessionStore();
		await store.getState().actions.initialize();

		await store
			.getState()
			.user.actions.updateMetadata("default_model", "model-primary");

		expect(setUserMetadataMock).toHaveBeenCalledWith(
			"default_model",
			"model-primary",
		);
		expect(runPixelMock).toHaveBeenCalledTimes(2);
	});

	it("clears local identity on logout even when the server request fails", async () => {
		const config = createConfig(true);
		getSystemConfigMock.mockResolvedValue(config);
		runPixelMock.mockResolvedValue(userInfoResult());
		const store = createSessionStore();
		await store.getState().actions.initialize();
		store
			.getState()
			.access.actions.primePermission("PROJECT", "project-1", "OWNER");
		const failure = new Error("logout unavailable");
		logoutMock.mockRejectedValueOnce(failure);

		await expect(store.getState().actions.logout()).rejects.toBe(failure);

		expect(store.getState().config.data).toBe(config);
		expect(store.getState().user.current).toBeNull();
		expect(store.getState().insightId).toBeNull();
		expect(store.getState().access.entries.PROJECT).toEqual({});
		expect(store.getState().lifecycle).toMatchObject({
			authentication: "unauthenticated",
			error: failure,
		});
	});

	it("scopes Pixel execution, uploads, and downloads to the session insight", async () => {
		getSystemConfigMock.mockResolvedValue(createConfig(true));
		runPixelMock
			.mockResolvedValueOnce(userInfoResult())
			.mockResolvedValueOnce({
				errors: [],
				insightId: "pixel-insight",
				pixelReturn: [],
			});
		const store = createSessionStore();
		await store.getState().actions.initialize();

		await store.getState().actions.runPixel("DoThing();");
		const file = {} as File;
		await store.getState().actions.upload(file, "project-1", "/assets");
		await store.getState().actions.download("file-key");

		expect(runPixelMock).toHaveBeenLastCalledWith(
			"DoThing();",
			"user-insight",
		);
		expect(uploadMock).toHaveBeenCalledWith(
			file,
			"pixel-insight",
			"project-1",
			"/assets",
		);
		expect(downloadMock).toHaveBeenCalledWith("pixel-insight", "file-key");
	});
});
