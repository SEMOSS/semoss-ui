import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import { dropInsight } from "./insight";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);

/** A pixel response with the given errors. */
const answer = (errors: string[] = []) =>
	({
		errors: errors,
		insightId: "insight-1",
		pixelReturn: [],
	}) as unknown as Awaited<ReturnType<typeof runPixel>>;

beforeEach(() => {
	mockRunPixel.mockReset();
});

describe("dropInsight", () => {
	it("drops the insight it is given", async () => {
		mockRunPixel.mockResolvedValue(answer());

		await dropInsight("insight-1");

		expect(mockRunPixel).toHaveBeenCalledWith("DropInsight()", "insight-1");
	});

	it("throws the backend's errors", async () => {
		mockRunPixel.mockResolvedValue(answer(["Unknown insight"]));

		await expect(dropInsight("insight-1")).rejects.toThrow(
			"Unknown insight",
		);
	});
});
