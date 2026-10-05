import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	mockGetLogins,
	mockGetSystemConfig,
	mockLogin,
	mockLogout,
	mockRunPixel,
} = vi.hoisted(() => ({
	mockGetLogins: vi.fn(),
	mockGetSystemConfig: vi.fn(),
	mockLogin: vi.fn(),
	mockLogout: vi.fn(),
	mockRunPixel: vi.fn(),
}));

vi.mock("../../api", () => ({
	confirmOTP: vi.fn(),
	download: vi.fn(),
	getSystemConfig: mockGetSystemConfig,
	login: mockLogin,
	loginLDAP: vi.fn(),
	loginOTP: vi.fn(),
	logout: mockLogout,
	oauth: vi.fn(),
	runPixel: mockRunPixel,
	runPixelAsync: vi.fn(),
	upload: vi.fn(),
	uploadApp: vi.fn(),
	uploadEngine: vi.fn(),
	uploadInsight: vi.fn(),
	uploadUser: vi.fn(),
}));

// the page's logins read the session's logins through the auth api itself
vi.mock("../../api/auth", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/auth")>()),
	getLogins: mockGetLogins,
}));

const SIGNED_OUT = {
	logins: {},
	availableProviders: [
		{ provider: "native", name: "Native", isOauth: false },
	],
	theme: {},
	systemDate: "2024-01-01",
};

const SIGNED_IN = {
	...SIGNED_OUT,
	logins: { NATIVE: "Ada" },
	primaryLogin: "NATIVE",
	connectorAccess: { MICROSOFT: { outlook: true } },
};

const CREDENTIALS = {
	type: "native" as const,
	username: "ada",
	password: "secret",
};

/**
 * A new insight store and the page's logins, loaded fresh so the config cache
 * and the logins of an earlier test are gone.
 */
const load = async () => {
	vi.resetModules();
	const { Env } = await import("../../env");
	Env.update({
		MODULE: "http://localhost/Monolith",
		APP: "",
		ACCESS_KEY: "",
		SECRET_KEY: "",
		TOOL: null,
	});
	const { InsightStore } = await import("./insight.store");
	const { Logins } = await import("../logins");
	return { store: new InsightStore(), Logins: Logins };
};

beforeEach(() => {
	vi.resetAllMocks();
	vi.spyOn(console, "warn").mockImplementation(() => undefined);
	mockRunPixel.mockResolvedValue({
		insightId: "insight-1",
		errors: [],
		pixelReturn: [
			{
				isMeta: false,
				operationType: ["FRAME"],
				output: {},
				pixelExpression: "",
				pixelId: "p1",
				timeToRun: 0,
			},
		],
	});
});

describe("InsightStore and the page's logins", () => {
	it("fills the logins from the config when it loads", async () => {
		mockGetSystemConfig.mockResolvedValue(SIGNED_IN);
		const { store, Logins } = await load();
		await store.initialize();

		expect(Logins.getSnapshot()).toMatchObject({
			logins: { NATIVE: "Ada" },
			primaryLogin: "NATIVE",
			connectorAccess: SIGNED_IN.connectorAccess,
			status: "ready",
		});
	});

	it("starts the logins over from the config read again after a login", async () => {
		mockGetSystemConfig
			.mockResolvedValueOnce(SIGNED_OUT)
			.mockResolvedValueOnce(SIGNED_IN);
		mockLogin.mockResolvedValue(true);
		const { store, Logins } = await load();
		await store.initialize();
		expect(Logins.getSnapshot().logins).toEqual({});

		await store.actions.login(CREDENTIALS);

		expect(mockGetSystemConfig).toHaveBeenCalledTimes(2);
		expect(Logins.getSnapshot()).toMatchObject({
			logins: { NATIVE: "Ada" },
			primaryLogin: "NATIVE",
			status: "ready",
		});
		expect(store.system?.config.logins).toEqual({ NATIVE: "Ada" });
	});

	it("reads the logins on their own when the config cannot be read after a login", async () => {
		mockGetSystemConfig
			.mockResolvedValueOnce(SIGNED_OUT)
			.mockRejectedValueOnce(new Error("offline"));
		mockLogin.mockResolvedValue(true);
		mockGetLogins.mockResolvedValue({ NATIVE: "Ada" });
		const { store, Logins } = await load();
		await store.initialize();

		await store.actions.login(CREDENTIALS);

		await vi.waitFor(() =>
			expect(Logins.getSnapshot().logins).toEqual({ NATIVE: "Ada" }),
		);
		expect(Logins.getSnapshot()).toMatchObject({
			primaryLogin: null,
			status: "ready",
		});
	});

	it("forgets the logins on logout without reading anything", async () => {
		mockGetSystemConfig.mockResolvedValue(SIGNED_IN);
		mockLogout.mockResolvedValue(true);
		const { store, Logins } = await load();
		await store.initialize();

		await store.actions.logout();

		expect(Logins.getSnapshot()).toMatchObject({
			logins: {},
			primaryLogin: null,
			status: "loading",
		});
		expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
		expect(mockGetLogins).not.toHaveBeenCalled();
	});
});
