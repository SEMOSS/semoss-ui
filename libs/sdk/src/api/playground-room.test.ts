import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import {
	getModelContextWindow,
	pinUserRoom,
	removeUserRoom,
	renameUserRoom,
	throwOnPixelErrors,
} from "./playground-room";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);

/** A pixel response with the given statements and errors. */
const answer = (pixelReturn: { output: unknown }[], errors: string[] = []) =>
	({
		errors,
		insightId: "insight-1",
		pixelReturn,
	}) as unknown as Awaited<ReturnType<typeof runPixel>>;

beforeEach(() => {
	mockRunPixel.mockReset();
});

describe("throwOnPixelErrors", () => {
	it("passes a clean result through and throws every error", () => {
		const clean = { errors: [], value: 1 };
		expect(throwOnPixelErrors(clean)).toBe(clean);
		expect(() => throwOnPixelErrors({ errors: ["a", "b"] })).toThrow("ab");
	});
});

describe("playground rooms", () => {
	it("runs each call in the insight it is given", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: true }]));

		await removeUserRoom("insight-1", "room-1");
		await renameUserRoom("insight-1", "room-1", "Plan");
		await pinUserRoom("insight-1", "room-1", true);

		expect(mockRunPixel.mock.calls).toEqual([
			['RemoveUserRoom(roomId=["room-1"]);', "insight-1"],
			[
				'META | RenameRoom(roomId=["room-1"], name=["<encode>Plan</encode>"]);',
				"insight-1",
			],
			['PinRoom(roomId=["room-1"], pinned=[true]);', "insight-1"],
		]);
	});

	it("throws what the backend reports", async () => {
		mockRunPixel.mockResolvedValue(answer([], ["No access to that room"]));
		await expect(removeUserRoom("insight-1", "room-1")).rejects.toThrow(
			"No access to that room",
		);
	});

	it("reads a model's context window", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: 200_000 }]));
		await expect(
			getModelContextWindow("insight-1", "engine-1"),
		).resolves.toBe(200_000);
		expect(mockRunPixel).toHaveBeenCalledWith(
			'META | GetContextWindow("engine-1");',
			"insight-1",
		);
	});
});
