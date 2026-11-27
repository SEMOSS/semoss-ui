import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "./base";
import { exportMarkdownDocument, readUserAsset } from "./file";

vi.mock("./base", () => ({
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);

/** A pixel response with the given statements and errors. */
const answer = (
	pixelReturn: { output: unknown; operationType?: string[] }[],
	errors: string[] = [],
) =>
	({
		errors: errors,
		insightId: "insight-2",
		pixelReturn: pixelReturn,
	}) as unknown as Awaited<ReturnType<typeof runPixel>>;

beforeEach(() => {
	mockRunPixel.mockReset();
});

describe("readUserAsset", () => {
	it("reads a file in the user's assets", async () => {
		mockRunPixel.mockResolvedValue(answer([{ output: "{}" }]));

		await expect(readUserAsset("mcp/tools.json")).resolves.toBe("{}");
		expect(mockRunPixel).toHaveBeenCalledWith(
			'GetUserAssets(filePath=["mcp/tools.json"]);',
			undefined,
		);
	});

	it("throws the backend's errors", async () => {
		mockRunPixel.mockResolvedValue(answer([], ["File does not exist"]));

		await expect(readUserAsset("mcp/tools.json")).rejects.toThrow(
			"File does not exist",
		);
	});
});

describe("exportMarkdownDocument", () => {
	it("makes a Word document or a PDF and says where it is", async () => {
		mockRunPixel.mockResolvedValue(
			answer([{ output: "file-1", operationType: ["FILE_DOWNLOAD"] }]),
		);

		await expect(
			exportMarkdownDocument("new", "# Hi", "Chat Export", "word"),
		).resolves.toEqual({
			insightId: "insight-2",
			fileKey: "file-1",
			operationType: ["FILE_DOWNLOAD"],
		});
		await exportMarkdownDocument("insight-1", "# Hi", "Chat Export", "pdf");

		expect(mockRunPixel.mock.calls).toEqual([
			[
				'ToDocx(markdown=["<encode># Hi</encode>"], fileName="Chat Export");',
				"new",
			],
			[
				'ToPdf(markdown=["<encode># Hi</encode>"], fileName="Chat Export");',
				"insight-1",
			],
		]);
	});

	it("has no file when the backend makes none or answers nothing, and throws its errors", async () => {
		mockRunPixel.mockResolvedValueOnce(
			answer([{ output: "text", operationType: ["OPERATION"] }]),
		);
		await expect(
			exportMarkdownDocument("insight-1", "# Hi", "Chat Export", "pdf"),
		).resolves.toEqual({
			insightId: "insight-2",
			fileKey: null,
			operationType: ["OPERATION"],
		});

		mockRunPixel.mockResolvedValueOnce(answer([]));
		await expect(
			exportMarkdownDocument("insight-1", "# Hi", "Chat Export", "pdf"),
		).resolves.toEqual({
			insightId: "insight-2",
			fileKey: null,
			operationType: null,
		});

		mockRunPixel.mockResolvedValueOnce(answer([], ["Cannot convert"]));
		await expect(
			exportMarkdownDocument("insight-1", "# Hi", "Chat Export", "pdf"),
		).rejects.toThrow("Cannot convert");
	});
});
