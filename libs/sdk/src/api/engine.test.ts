import { beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { post } from "../utility";
import { runPixel } from "./base";
import {
	cloneEngine,
	getEngineInfo,
	getModel,
	listModels,
	restartEngine,
	setEngineFavorite,
} from "./engine";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));
vi.mock("../utility", async (original) => ({
	...(await original<typeof import("../utility")>()),
	post: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);
const mockPost = vi.mocked(post);

/** A pixel response with the given statements and errors. */
const answer = (
	pixelReturn: { output: unknown; additionalOutput?: unknown }[],
	errors: string[] = [],
) =>
	({
		errors: errors,
		insightId: "insight-1",
		pixelReturn: pixelReturn,
	}) as unknown as Awaited<ReturnType<typeof runPixel>>;

beforeEach(() => {
	mockRunPixel.mockReset();
});

describe("cloneEngine", () => {
	it("clones the engine under the given name and returns the clone", async () => {
		mockRunPixel.mockResolvedValue(
			answer([
				{
					output: {
						engine_id: "clone-1",
						engine_name: "Sales Copy",
						engine_display_name: "Sales Copy",
						engine_type: "DATABASE",
					},
					additionalOutput: [
						{
							output: "Successfully cloned the engine as Sales Copy",
							operationType: ["SUCCESS"],
						},
					],
				},
			]),
		);

		await expect(
			cloneEngine(
				{ engineId: "engine-1", name: "  Sales Copy " },
				"insight-1",
			),
		).resolves.toEqual({
			engineId: "clone-1",
			name: "Sales Copy",
			engineType: "DATABASE",
			messages: {
				success: ["Successfully cloned the engine as Sales Copy"],
				warnings: [],
			},
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'CloneEngine(engineId=["engine-1"], catalogName=["Sales Copy"]);',
			"insight-1",
		);
	});

	it("leaves the name to the backend when none is given", async () => {
		mockRunPixel.mockResolvedValue(
			answer([
				{ output: { engine_id: "clone-1", engine_name: "Sales Copy" } },
			]),
		);

		await expect(
			cloneEngine({ engineId: "engine-1", name: " " }),
		).resolves.toMatchObject({ engineId: "clone-1", name: "Sales Copy" });
		expect(mockRunPixel).toHaveBeenCalledWith(
			'CloneEngine(engineId=["engine-1"]);',
			undefined,
		);
	});

	it("fails when the backend refuses the clone", async () => {
		mockRunPixel.mockResolvedValue(
			answer([], ["User must be the owner to perform this function."]),
		);

		await expect(cloneEngine({ engineId: "engine-1" })).rejects.toThrow(
			"User must be the owner to perform this function.",
		);
	});

	it("fails when the backend returns no engine id", async () => {
		mockRunPixel.mockResolvedValue(
			answer([{ output: { engine_name: "x" } }]),
		);

		await expect(cloneEngine({ engineId: "engine-1" })).rejects.toThrow(
			"The clone returned no engine id.",
		);
	});
});

describe("restartEngine", () => {
	it("closes the engine and returns what the backend reported", async () => {
		mockRunPixel.mockResolvedValue(
			answer([
				{
					output: true,
					additionalOutput: [
						{
							output: "Could not reach the other servers",
							operationType: ["WARNING"],
						},
						{
							output: "Closed engine engine-1. It restarts on its next use.",
							operationType: ["SUCCESS"],
						},
					],
				},
			]),
		);

		await expect(restartEngine("engine-1", "insight-1")).resolves.toEqual({
			success: ["Closed engine engine-1. It restarts on its next use."],
			warnings: ["Could not reach the other servers"],
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'CloseEngine(engine=["engine-1"]);',
			"insight-1",
		);
	});

	it("fails when the backend refuses the restart", async () => {
		mockRunPixel.mockResolvedValue(answer([], ["Not the owner"]));

		await expect(restartEngine("engine-1")).rejects.toThrow(
			"Not the owner",
		);
	});
});

describe("setEngineFavorite", () => {
	it("posts the engine and whether it is a favorite", async () => {
		mockPost.mockResolvedValue({
			response: new Response(),
			data: { success: true },
		});

		await setEngineFavorite("engine-1", true);

		expect(mockPost).toHaveBeenCalledWith(
			`${Env.MODULE}/api/auth/engine/setEngineFavorite`,
			{ engineId: "engine-1", isFavorite: true },
			{},
		);
	});

	it("throws when the request fails", async () => {
		mockPost.mockRejectedValue(new Error("Forbidden"));
		await expect(setEngineFavorite("engine-1", false)).rejects.toThrow(
			"Forbidden",
		);
	});
});

describe("listModels", () => {
	it("lists the text generation models, all or by a word", async () => {
		const models = [
			{ engine_id: "m-1", engine_name: "A", engine_type: "MODEL" },
		];
		mockRunPixel.mockResolvedValue(answer([{ output: models }]));

		await expect(listModels("insight-1")).resolves.toBe(models);
		await listModels("insight-1", { filterWord: "m-1" });

		expect(mockRunPixel.mock.calls).toEqual([
			[
				'META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);',
				"insight-1",
			],
			[
				'META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"], filterWord="m-1");',
				"insight-1",
			],
		]);
	});

	it("reads no output as no models, and throws the backend's errors", async () => {
		mockRunPixel.mockResolvedValueOnce(answer([]));
		await expect(listModels("insight-1")).resolves.toEqual([]);

		mockRunPixel.mockResolvedValueOnce(answer([], ["Denied"]));
		await expect(listModels("insight-1")).rejects.toThrow("Denied");
	});
});

describe("getModel", () => {
	it("reads one model by its id, and nothing for another id", async () => {
		const model = {
			engine_id: "m-1",
			engine_name: "A",
			engine_type: "MODEL",
		};
		mockRunPixel.mockResolvedValue(answer([{ output: [model] }]));

		await expect(getModel("insight-1", "m-1")).resolves.toBe(model);
		await expect(getModel("insight-1", "m-2")).resolves.toBeUndefined();
		expect(mockRunPixel).toHaveBeenCalledWith(
			'META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"], engine=["m-1"]);',
			"insight-1",
		);
	});
});

describe("getEngineInfo", () => {
	it("reads an engine's details", async () => {
		mockRunPixel.mockResolvedValue(
			answer([{ output: { engine_type: "MODEL" } }]),
		);

		await expect(getEngineInfo("insight-1", "engine-1")).resolves.toEqual({
			engine_type: "MODEL",
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'EngineInfo(engine=["engine-1"]);',
			"insight-1",
		);
	});

	it("throws the backend's errors", async () => {
		mockRunPixel.mockResolvedValue(answer([], ["No access"]));

		await expect(getEngineInfo("insight-1", "engine-1")).rejects.toThrow(
			"No access",
		);
	});
});
