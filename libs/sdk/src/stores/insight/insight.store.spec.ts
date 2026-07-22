import { beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../../env";
import { UnauthorizedError } from "../../utility";

const {
	mockDownload,
	mockGetSystemConfig,
	mockLogin,
	mockLogout,
	mockOAuth,
	mockRunPixel,
	mockRunPixelAsync,
	mockUpload,
	mockUploadApp,
	mockUploadEngine,
	mockUploadInsight,
	mockUploadUser,
} = vi.hoisted(() => ({
	mockDownload: vi.fn(),
	mockGetSystemConfig: vi.fn(),
	mockLogin: vi.fn(),
	mockLogout: vi.fn(),
	mockOAuth: vi.fn(),
	mockRunPixel: vi.fn(),
	mockRunPixelAsync: vi.fn(),
	mockUpload: vi.fn(),
	mockUploadApp: vi.fn(),
	mockUploadEngine: vi.fn(),
	mockUploadInsight: vi.fn(),
	mockUploadUser: vi.fn(),
}));

vi.mock("../../api", () => ({
	download: mockDownload,
	getSystemConfig: mockGetSystemConfig,
	login: mockLogin,
	logout: mockLogout,
	oauth: mockOAuth,
	runPixel: mockRunPixel,
	runPixelAsync: mockRunPixelAsync,
	upload: mockUpload,
	uploadApp: mockUploadApp,
	uploadEngine: mockUploadEngine,
	uploadInsight: mockUploadInsight,
	uploadUser: mockUploadUser,
}));

import { InsightStore } from "./insight.store";

// ---- helpers ----------------------------------------------------------------

const SYSTEM_CONFIG_WITH_LOGINS = {
	logins: { native: {} },
	availableProviders: [
		{ provider: "native", name: "Native", isOauth: false },
	],
	theme: {},
	systemDate: "2024-01-01",
};

const pixelResult = (insightId = "test-insight-id", output: unknown = {}) => ({
	insightId,
	errors: [] as string[],
	pixelReturn: [
		{
			isMeta: false,
			operationType: ["FRAME"],
			output,
			pixelExpression: "",
			pixelId: "p1",
			timeToRun: 0,
		},
	],
});

/** Initialize a store with a mocked runPixel response for setupInsight. */
const initStore = async (
	store: InsightStore,
	options?: Parameters<InsightStore["initialize"]>[0],
) => {
	mockRunPixel.mockResolvedValueOnce(pixelResult());
	return store.initialize(options);
};

// ---- setup ------------------------------------------------------------------

beforeEach(() => {
	vi.resetAllMocks();
	Env.update({
		MODULE: "http://localhost:9090/Monolith",
		APP: "",
		ACCESS_KEY: "",
		SECRET_KEY: "",
		TOOL: null,
	});
	// Populated into the module-level system config cache on the first initialize() call.
	mockGetSystemConfig.mockResolvedValue(SYSTEM_CONFIG_WITH_LOGINS);
});

// =============================================================================

describe("InsightStore", () => {
	// ---- initial state -------------------------------------------------------

	describe("initial state", () => {
		it("has insightId 'new'", () => {
			expect(new InsightStore().insightId).toBe("new");
		});

		it("starts uninitialized and not ready", () => {
			const store = new InsightStore();
			expect(store.isInitialized).toBe(false);
			expect(store.isAuthorized).toBe(false);
			expect(store.isReady).toBe(false);
		});

		it("has null error and system", () => {
			const store = new InsightStore();
			expect(store.error).toBeNull();
			expect(store.system).toBeNull();
		});
	});

	// ---- user model management ----------------------------------------------

	describe("user model management", () => {
		it("defaultTextGenerationModel returns empty string when unset", () => {
			expect(new InsightStore().defaultTextGenerationModel).toBe("");
		});

		it("defaultCodeGenerationModel returns empty string when unset", () => {
			expect(new InsightStore().defaultCodeGenerationModel).toBe("");
		});

		it("updateUserDefaultModel stores the model id", () => {
			const store = new InsightStore();
			store.updateUserDefaultModel("text-generation-model", "tm-uuid");
			expect(store.defaultTextGenerationModel).toBe("tm-uuid");
		});

		it("setUserDefaultModel replaces the full meta record", () => {
			const store = new InsightStore();
			store.setUserDefaultModel({
				"text-generation-model": "tm-1",
				"code-generation-model": "cm-1",
			});
			expect(store.defaultTextGenerationModel).toBe("tm-1");
			expect(store.defaultCodeGenerationModel).toBe("cm-1");
		});

		it("updateUserDefaultModel merges with existing meta", () => {
			const store = new InsightStore();
			store.setUserDefaultModel({ "text-generation-model": "tm-1" });
			store.updateUserDefaultModel("code-generation-model", "cm-2");
			expect(store.defaultTextGenerationModel).toBe("tm-1");
			expect(store.defaultCodeGenerationModel).toBe("cm-2");
		});
	});

	// ---- initialize() -------------------------------------------------------

	describe("initialize()", () => {
		it("returns null and stores error when MODULE is not set", async () => {
			Env.update({ MODULE: "" });
			const store = new InsightStore();
			const result = await store.initialize();
			expect(result).toBeNull();
			expect(store.error).toBeInstanceOf(Error);
		});

		it("sets isInitialized, isAuthorized, and isReady true on success", async () => {
			const store = new InsightStore();
			await initStore(store);
			expect(store.isInitialized).toBe(true);
			expect(store.isAuthorized).toBe(true);
			expect(store.isReady).toBe(true);
		});

		it("sets insightId from the runPixel response", async () => {
			const store = new InsightStore();
			await initStore(store);
			expect(store.insightId).toBe("test-insight-id");
		});

		it("includes SetContext when app option is provided", async () => {
			const store = new InsightStore();
			await initStore(store, { app: "my-app-id" });
			const [pixel] = mockRunPixel.mock.calls[0];
			expect(pixel).toContain('SetContext("my-app-id")');
		});

		it("includes LoadPyFromFile when python script option is provided", async () => {
			const store = new InsightStore();
			await initStore(store, {
				python: { type: "script", script: "x=1", alias: "smss" },
			});
			const [pixel] = mockRunPixel.mock.calls[0];
			expect(pixel).toContain("LoadPyFromFile");
		});

		it("attaches to an existing insight without running an init pixel", async () => {
			const store = new InsightStore();
			await store.initialize({ insightId: "existing-id" });
			expect(store.insightId).toBe("existing-id");
			expect(mockRunPixel).not.toHaveBeenCalled();
		});

		it("returns null and stores error when runPixel returns an error", async () => {
			mockRunPixel.mockResolvedValueOnce({
				...pixelResult(),
				errors: ["Pixel error"],
			});
			const store = new InsightStore();
			const result = await store.initialize();
			expect(result).toBeNull();
			expect(store.error?.message).toBe("Pixel error");
		});

		it("resets state flags at the start of each call", async () => {
			const store = new InsightStore();
			await initStore(store);
			expect(store.isReady).toBe(true);

			Env.update({ MODULE: "" });
			await store.initialize();
			expect(store.isInitialized).toBe(false);
			expect(store.isAuthorized).toBe(false);
			expect(store.isReady).toBe(false);
		});

		it("sets isAuthorized false when system has no logins", async () => {
			// Needs a fresh module to bypass the module-level system config cache.
			vi.resetModules();
			vi.doMock("../../api", () => ({
				download: vi.fn(),
				getSystemConfig: vi.fn().mockResolvedValue({
					logins: {},
					availableProviders: [],
					theme: {},
					systemDate: "",
				}),
				login: vi.fn(),
				logout: vi.fn(),
				oauth: vi.fn(),
				runPixel: vi.fn(),
				runPixelAsync: vi.fn(),
				upload: vi.fn(),
				uploadApp: vi.fn(),
				uploadEngine: vi.fn(),
				uploadInsight: vi.fn(),
				uploadUser: vi.fn(),
			}));
			Env.update({ MODULE: "http://localhost:9090/Monolith" });
			const { InsightStore: FreshStore } = await import(
				"./insight.store"
			);
			const store = new FreshStore();
			await store.initialize();
			expect(store.isAuthorized).toBe(false);
		});

		it("sets isAuthorized true when ACCESS_KEY and SECRET_KEY are set", async () => {
			// Needs a fresh module so the no-logins config is cached, then keys override.
			vi.resetModules();
			vi.doMock("../../api", () => ({
				download: vi.fn(),
				getSystemConfig: vi.fn().mockResolvedValue({
					logins: {},
					availableProviders: [],
					theme: {},
					systemDate: "",
				}),
				login: vi.fn(),
				logout: vi.fn(),
				oauth: vi.fn(),
				runPixel: vi.fn().mockResolvedValue(pixelResult()),
				runPixelAsync: vi.fn(),
				upload: vi.fn(),
				uploadApp: vi.fn(),
				uploadEngine: vi.fn(),
				uploadInsight: vi.fn(),
				uploadUser: vi.fn(),
			}));
			// Re-import Env from the fresh module so updates reach the fresh store.
			const { Env: FreshEnv } = await import("../../env");
			FreshEnv.update({
				MODULE: "http://localhost:9090/Monolith",
				ACCESS_KEY: "key",
				SECRET_KEY: "secret",
			});
			const { InsightStore: FreshStore } = await import(
				"./insight.store"
			);
			const store = new FreshStore();
			await store.initialize();
			expect(store.isAuthorized).toBe(true);
		});
	});

	// ---- destroy() ----------------------------------------------------------

	describe("destroy()", () => {
		it("calls DropInsight and resets all state flags", async () => {
			const store = new InsightStore();
			await initStore(store);
			expect(store.isReady).toBe(true);

			mockRunPixel.mockResolvedValueOnce(pixelResult());
			await store.destroy();

			expect(store.isInitialized).toBe(false);
			expect(store.isAuthorized).toBe(false);
			expect(store.isReady).toBe(false);
		});

		it("resets state flags even when DropInsight throws", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockRejectedValueOnce(new Error("Destroy failed"));
			await store.destroy();

			expect(store.isInitialized).toBe(false);
			expect(store.isReady).toBe(false);
		});
	});

	// ---- actions.login() ----------------------------------------------------

	describe("actions.login()", () => {
		it("native: calls login API, sets isAuthorized, returns true", async () => {
			mockLogin.mockResolvedValue(true);
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce(pixelResult());
			const result = await store.actions.login({
				type: "native",
				username: "user",
				password: "pass",
			});

			expect(mockLogin).toHaveBeenCalledWith("user", "pass");
			expect(result).toBe(true);
			expect(store.isAuthorized).toBe(true);
		});

		it("native: returns false and sets isAuthorized false when login fails", async () => {
			mockLogin.mockResolvedValue(false);
			const store = new InsightStore();
			await initStore(store);

			const result = await store.actions.login({
				type: "native",
				username: "user",
				password: "bad",
			});

			expect(result).toBe(false);
			expect(store.isAuthorized).toBe(false);
		});

		it("oauth: calls oauth API with the provider", async () => {
			mockOAuth.mockResolvedValue(true);
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce(pixelResult());
			await store.actions.login({ type: "oauth", provider: "google" });

			expect(mockOAuth).toHaveBeenCalledWith("google");
		});

		it("sets isAuthorized false on UnauthorizedError", async () => {
			mockLogin.mockRejectedValue(new UnauthorizedError("Unauthorized"));
			const store = new InsightStore();
			await initStore(store);

			const result = await store.actions.login({
				type: "native",
				username: "u",
				password: "p",
			});

			expect(result).toBe(false);
			expect(store.isAuthorized).toBe(false);
		});
	});

	// ---- actions.logout() ---------------------------------------------------

	describe("actions.logout()", () => {
		it("calls logout API and resets auth and ready state", async () => {
			mockLogout.mockResolvedValue(true);
			const store = new InsightStore();
			await initStore(store);

			const result = await store.actions.logout();

			expect(mockLogout).toHaveBeenCalled();
			expect(result).toBe(true);
			expect(store.isAuthorized).toBe(false);
			expect(store.isReady).toBe(false);
			expect(store.insightId).toBe("");
		});

		it("returns false without changing state when API returns false", async () => {
			mockLogout.mockResolvedValue(false);
			const store = new InsightStore();

			const result = await store.actions.logout();
			expect(result).toBe(false);
		});
	});

	// ---- actions.run() ------------------------------------------------------

	describe("actions.run()", () => {
		it("calls runPixel with the pixel string and current insightId", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce(pixelResult());
			await store.actions.run("Frame()");

			expect(mockRunPixel).toHaveBeenCalledWith(
				"Frame()",
				"test-insight-id",
			);
		});

		it("returns pixelReturn from the response", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce(
				pixelResult("test-insight-id", { key: "value" }),
			);
			const result = await store.actions.run("Frame()");
			expect(result?.pixelReturn[0].output).toEqual({ key: "value" });
		});

		it("throws when pixelReturn contains errors", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce({
				...pixelResult(),
				errors: ["Something went wrong"],
			});

			await expect(store.actions.run("BadPixel()")).rejects.toThrow(
				"Something went wrong",
			);
		});
	});

	// ---- actions.runAsync() -------------------------------------------------

	describe("actions.runAsync()", () => {
		it("calls runPixelAsync and returns the jobId", async () => {
			mockRunPixelAsync.mockResolvedValue({ jobId: "job-123" });
			const store = new InsightStore();
			await initStore(store);

			const result = await store.actions.runAsync("LLM()");

			expect(mockRunPixelAsync).toHaveBeenCalledWith(
				"LLM()",
				"test-insight-id",
			);
			expect(result?.jobId).toBe("job-123");
		});
	});

	// ---- actions.runPy() ----------------------------------------------------

	describe("actions.runPy()", () => {
		it("wraps python in a Py() pixel and returns the output", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce(
				pixelResult("test-insight-id", [{ output: "py-result" }]),
			);

			const result = await store.actions.runPy<string>("x = 1");

			const [pixel] = mockRunPixel.mock.calls.at(-1);
			expect(pixel).toContain("Py(");
			expect(result.output).toBe("py-result");
		});
	});

	// ---- actions.askModel() -------------------------------------------------

	describe("actions.askModel()", () => {
		it("wraps the command in an LLM() pixel and returns the output", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce(
				pixelResult("test-insight-id", { response: "model answer" }),
			);

			const result = await store.actions.askModel("engine-id", "Hello?");

			const [pixel] = mockRunPixel.mock.calls.at(-1);
			expect(pixel).toContain('LLM(engine=["engine-id"]');
			expect(result.output).toEqual({ response: "model answer" });
		});
	});

	// ---- actions.queryDatabase() --------------------------------------------

	describe("actions.queryDatabase()", () => {
		it("builds the correct pixel string and returns the output", async () => {
			const store = new InsightStore();
			await initStore(store);

			const queryOutput = { values: [[1]], headers: ["id"] };
			mockRunPixel.mockResolvedValueOnce(
				pixelResult("test-insight-id", queryOutput),
			);

			const result = await store.actions.queryDatabase(
				"db-id",
				"SELECT 1",
			);

			const [pixel] = mockRunPixel.mock.calls.at(-1);
			expect(pixel).toContain('Database(database=["db-id"])');
			expect(pixel).toContain("Query(");
			expect(result?.output).toEqual(queryOutput);
		});

		it("passes the collect option to the Collect() call", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce(pixelResult());
			await store.actions.queryDatabase("db-id", "SELECT 1", {
				collect: 10,
			});

			const [pixel] = mockRunPixel.mock.calls.at(-1);
			expect(pixel).toContain("Collect(10)");
		});
	});

	// ---- actions.upload() ---------------------------------------------------

	describe("actions.upload()", () => {
		it("calls upload API with the current insightId", async () => {
			mockUpload.mockResolvedValue([
				{ fileName: "test.txt", fileLocation: "/test.txt" },
			]);
			const store = new InsightStore();
			await initStore(store);

			const file = new File(["content"], "test.txt");
			const result = await store.actions.upload(file, "/uploads");

			expect(mockUpload).toHaveBeenCalledWith(
				file,
				"test-insight-id",
				"",
				"/uploads",
			);
			expect(result[0].fileName).toBe("test.txt");
		});
	});

	// ---- actions.download() -------------------------------------------------

	describe("actions.download()", () => {
		it("runs DownloadAsset pixel then calls the download API", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce(
				pixelResult("test-insight-id", "file-key-xyz"),
			);
			mockDownload.mockResolvedValue(undefined);

			const result = await store.actions.download("/path/to/file");

			expect(mockDownload).toHaveBeenCalledWith(
				"test-insight-id",
				"file-key-xyz",
			);
			expect(result).toBe(true);
		});
	});

	// ---- actions.uploadApp/Engine/Insight/User() ----------------------------

	describe("actions.uploadApp()", () => {
		it("calls uploadApp API with appId, path, file, and insightId", async () => {
			mockUploadApp.mockResolvedValue([]);
			const store = new InsightStore();
			await initStore(store);

			const file = new File([""], "app.zip");
			await store.actions.uploadApp("app-id", "/path", file);

			expect(mockUploadApp).toHaveBeenCalledWith(
				"app-id",
				"/path",
				file,
				"test-insight-id",
			);
		});
	});

	describe("actions.uploadEngine()", () => {
		it("calls uploadEngine API with engineId, path, file, and insightId", async () => {
			mockUploadEngine.mockResolvedValue([]);
			const store = new InsightStore();
			await initStore(store);

			const file = new File([""], "engine.zip");
			await store.actions.uploadEngine("engine-id", "/path", file);

			expect(mockUploadEngine).toHaveBeenCalledWith(
				"engine-id",
				"/path",
				file,
				"test-insight-id",
			);
		});
	});

	describe("actions.uploadInsight()", () => {
		it("calls uploadInsight API with insightId, path, and file", async () => {
			mockUploadInsight.mockResolvedValue([]);
			const store = new InsightStore();
			await initStore(store);

			const file = new File([""], "insight.zip");
			await store.actions.uploadInsight("/path", file);

			expect(mockUploadInsight).toHaveBeenCalledWith(
				"test-insight-id",
				"/path",
				file,
			);
		});
	});

	describe("actions.uploadUser()", () => {
		it("calls uploadUser API with path, file, and insightId", async () => {
			mockUploadUser.mockResolvedValue([]);
			const store = new InsightStore();
			await initStore(store);

			const file = new File([""], "user.zip");
			await store.actions.uploadUser("/path", file);

			expect(mockUploadUser).toHaveBeenCalledWith(
				"/path",
				file,
				"test-insight-id",
			);
		});
	});

	// ---- actions.sendMCPResponseToPlayground() ------------------------------

	describe("actions.sendMCPResponseToPlayground()", () => {
		it("throws when Env.TOOL is not set", () => {
			const store = new InsightStore();
			expect(() =>
				store.actions.sendMCPResponseToPlayground("response"),
			).toThrow("No MCP tool execution context found");
		});

		it("posts a SMSS_EXEC_TOOL message to window.parent", () => {
			const postMessage = vi.fn();
			vi.stubGlobal("window", { parent: { postMessage } });
			Env.update({
				TOOL: {
					id: "t1",
					name: "myTool",
					message: {},
					roomId: "r1",
				} as never,
			});

			const store = new InsightStore();
			store.actions.sendMCPResponseToPlayground(
				"tool-response",
				"success",
				{
					param: "val",
				},
			);

			expect(postMessage).toHaveBeenCalledWith(
				expect.objectContaining({ type: "SMSS_EXEC_TOOL" }),
				"*",
			);
		});
	});

	// ---- actions.runMCPTool() -----------------------------------------------

	describe("actions.runMCPTool()", () => {
		it("calls RunMCPTool pixel and returns the output", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce({
				insightId: "test-insight-id",
				errors: [],
				pixelReturn: [
					{
						isMeta: false,
						operationType: ["MCP_TOOL_EXECUTION"],
						output: "tool-result",
						pixelExpression: "",
						pixelId: "p1",
						timeToRun: 0,
					},
				],
			});

			const result = await store.actions.runMCPTool("myTool", {
				arg: "val",
			});

			const [pixel] = mockRunPixel.mock.calls.at(-1);
			expect(pixel).toContain("RunMCPTool");
			expect(result?.output).toBe("tool-result");
		});

		it("throws when the pixel response does not include MCP_TOOL_EXECUTION", async () => {
			const store = new InsightStore();
			await initStore(store);

			mockRunPixel.mockResolvedValueOnce(pixelResult());

			await expect(
				store.actions.runMCPTool("myTool", {}),
			).rejects.toThrow("Error running MCP tool");
		});
	});
});
