import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk/react";
import {
	type AskRoomRequest,
	type AskRoomResult,
	askRoom,
	commitCancelledTurn,
} from "./rooms";

vi.mock("@semoss/sdk/react", () => ({
	getPixelAsyncResult: vi.fn(),
	getPixelJobStreaming: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
}));

const request: AskRoomRequest = {
	engineId: "vision-model",
	roomId: "room-1",
	command: "Identify the attached image",
};

const output: AskRoomResult = {
	inputMessage: { messageId: "input-1", io: "INPUT" },
	responseMessage: { messageId: "response-1", io: "OUTPUT" },
};

const pixelReturn = [
	{
		isMeta: false,
		operationType: ["MAP"],
		output,
		pixelExpression: "AskRoom();",
		pixelId: "0",
		timeToRun: 0,
	},
];

describe("AskRoom attachment parameters", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(runPixelAsync).mockResolvedValue({ jobId: "job-1" });
		vi.mocked(getPixelJobStreaming).mockResolvedValue({
			status: "Complete",
			message: [],
		});
		vi.mocked(getPixelAsyncResult).mockResolvedValue({
			errors: [],
			insightId: "insight-1",
			results: pixelReturn,
		});
		vi.mocked(runPixel).mockResolvedValue({
			errors: [],
			insightId: "insight-1",
			pixelReturn,
		});
	});

	it.each([
		{
			name: "an uploaded image",
			media: ["uploads/photo.png"],
			parameter: 'media=["uploads/photo.png"]',
		},
		{
			name: "multiple attachments",
			media: ["uploads/photo one.png", "uploads/document.pdf"],
			parameter: 'media=["uploads/photo one.png","uploads/document.pdf"]',
		},
		{ name: "no attachments", media: undefined, parameter: "media=[]" },
		{ name: "an empty attachment list", media: [], parameter: "media=[]" },
	])(
		"sends $name under the backend's media key",
		async ({ media, parameter }) => {
			await expect(
				askRoom("insight-1", { ...request, media }),
			).resolves.toEqual(output);

			expect(runPixelAsync).toHaveBeenCalledExactlyOnceWith(
				expect.stringContaining(parameter),
				"insight-1",
			);
			expect(runPixelAsync).not.toHaveBeenCalledWith(
				expect.stringContaining("image="),
				expect.anything(),
			);
		},
	);

	it("preserves attachments when committing a stopped response", async () => {
		await expect(
			commitCancelledTurn(
				"insight-1",
				{
					...request,
					parentMessageId: "previous-response",
					media: ["uploads/photo.png"],
				},
				[{ type: "TEXT", text: "The image shows" }],
				"The user stopped the response",
			),
		).resolves.toEqual(output);

		expect(runPixel).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining('media=["uploads/photo.png"]'),
			"insight-1",
		);
		expect(runPixel).toHaveBeenCalledWith(
			expect.stringContaining('parentMessageId=["previous-response"]'),
			"insight-1",
		);
	});
});
