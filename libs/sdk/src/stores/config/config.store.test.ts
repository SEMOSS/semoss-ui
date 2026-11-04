import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSystemConfig } from "../../api/base";
import { Env } from "../../env";
import { ConfigStore } from "./config.store";

vi.mock("../../api/base", async (importOriginal) => ({
	...(await importOriginal<typeof import("../../api/base")>()),
	getSystemConfig: vi.fn(),
}));

const mockGetSystemConfig = vi.mocked(getSystemConfig);

/** A config as the backend sends it, with the given fields changed. */
const backendConfig = (
	overrides: Record<string, unknown> = {},
): Awaited<ReturnType<typeof getSystemConfig>> => ({
	logins: {},
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

describe("ConfigStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Env.update({ CSRF: false });
	});

	it("shares one read and reuses the config it read", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig());
		const store = new ConfigStore();

		const [first, second] = await Promise.all([store.load(), store.load()]);
		await store.load();

		expect(second).toBe(first);
		expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
		expect(store.getSnapshot().status).toBe("ready");
	});

	it("reads again when forced", async () => {
		mockGetSystemConfig
			.mockResolvedValueOnce(backendConfig())
			.mockResolvedValueOnce(
				backendConfig({ logins: { NATIVE: "Ada" } }),
			);
		const store = new ConfigStore();

		await store.load();
		await store.load({ force: true });

		expect(mockGetSystemConfig).toHaveBeenCalledTimes(2);
		expect(store.getSnapshot().config?.logins).toEqual({ NATIVE: "Ada" });
	});

	it("sorts the meta keys, parses the theme and sets the CSRF flag", async () => {
		mockGetSystemConfig.mockResolvedValue(
			backendConfig({
				csrf: true,
				theme: { THEME_MAP: '{"name":"Acme"}' },
				projectMetaKeys: [
					{ metakey: "tag", display_order: 2, single_multi: "multi" },
					{
						metakey: "domain",
						display_order: 1,
						single_multi: "multi",
					},
				],
			}),
		);
		const store = new ConfigStore();

		await store.load();

		const { config, theme } = store.getSnapshot();
		expect(config?.projectMetaKeys.map((key) => key.metakey)).toEqual([
			"domain",
			"tag",
		]);
		expect(theme).toEqual({ name: "Acme" });
		expect(Env.CSRF).toBe(true);
	});

	it("treats a theme that is not JSON as none", async () => {
		mockGetSystemConfig.mockResolvedValue(
			backendConfig({ theme: { THEME_MAP: "{not json" } }),
		);
		const store = new ConfigStore();

		await store.load();

		expect(store.getSnapshot().theme).toBeNull();
	});

	it("fails the store only when no config was ever read", async () => {
		mockGetSystemConfig
			.mockRejectedValueOnce(new Error("down"))
			.mockResolvedValueOnce(backendConfig())
			.mockRejectedValueOnce(new Error("down again"));
		const store = new ConfigStore();

		await expect(store.load()).rejects.toThrow("down");
		expect(store.getSnapshot().status).toBe("error");

		await store.load();
		await expect(store.load({ force: true })).rejects.toThrow("down again");
		expect(store.getSnapshot()).toMatchObject({
			status: "ready",
			error: new Error("down again"),
		});
		expect(store.getSnapshot().config).not.toBeNull();
	});

	it("drops a read that lands after a reset", async () => {
		let resolve: (value: ReturnType<typeof backendConfig>) => void =
			() => {};
		mockGetSystemConfig.mockReturnValue(
			new Promise((done) => {
				resolve = done;
			}),
		);
		const store = new ConfigStore();

		const pending = store.load();
		store.reset();
		resolve(backendConfig());
		await pending;

		expect(store.getSnapshot()).toMatchObject({
			status: "idle",
			config: null,
		});
	});

	it("keeps operations for admins unless the config opens them", async () => {
		const store = new ConfigStore();
		expect(store.isAdminOnly("DATABASE", "add")).toBe(true);

		mockGetSystemConfig.mockResolvedValue(
			backendConfig({
				adminOnlyDbAdd: false,
				adminOnlyProjectDelete: true,
			}),
		);
		await store.load();

		expect(store.isAdminOnly("DATABASE", "add")).toBe(false);
		expect(store.isAdminOnly("PROJECT", "delete")).toBe(true);
	});

	it("keeps every guardrail operation for admins", async () => {
		mockGetSystemConfig.mockResolvedValue(backendConfig());
		const store = new ConfigStore();
		await store.load();

		expect(store.isAdminOnly("GUARDRAIL", "add")).toBe(true);
	});

	it("reads a theme that was encoded twice", async () => {
		mockGetSystemConfig.mockResolvedValue(
			backendConfig({
				theme: {
					THEME_MAP: JSON.stringify(JSON.stringify({ name: "Acme" })),
				},
			}),
		);
		const store = new ConfigStore();

		await store.load();

		expect(store.getSnapshot().theme).toEqual({ name: "Acme" });
	});
});
