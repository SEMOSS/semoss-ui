import { beforeEach, describe, expect, it, vi } from "vitest";
import { reloadApp } from "./app";
import { runPixel } from "./base";

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

describe("reloadApp", () => {
	it("reloads the app's python files and returns what the backend reported", async () => {
		mockRunPixel.mockResolvedValue(
			answer([
				{
					output: true,
					additionalOutput: [
						{
							output: "Reloaded the python files. Cleared 3 cached modules.",
							operationType: ["SUCCESS"],
						},
					],
				},
			]),
		);

		await expect(reloadApp("app-1", "insight-1")).resolves.toEqual({
			success: ["Reloaded the python files. Cleared 3 cached modules."],
			warnings: [],
		});
		expect(mockRunPixel).toHaveBeenCalledWith(
			'ReloadProject(project=["app-1"]);',
			"insight-1",
		);
	});

	it("fails when the backend refuses the reload", async () => {
		mockRunPixel.mockResolvedValue(
			answer([], ["Project does not exist or user does not have access"]),
		);

		await expect(reloadApp("app-1")).rejects.toThrow(
			"Project does not exist or user does not have access",
		);
	});
});
