import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import { cloneEngine, restartEngine } from "./engine";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);

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
			'CloneEngine(engine=["engine-1"], name=["Sales Copy"]);',
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
			'CloneEngine(engine=["engine-1"]);',
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
