import type { ConversationTool } from "@/features/messages/types/message";
import { isPresentationTool, presentationFiles } from "./presentation-tools";

const tool: ConversationTool = {
	id: "tool",
	parentMessageId: "response",
	name: "powerpoint",
	title: "Prepare a deck",
	arguments: {},
	status: "COMPLETED",
	output: '{"files":[{"path":"review.pptx"}]}',
};
it("requires completed, explicit, room-local file results", () => {
	expect(presentationFiles(tool)).toEqual([
		{ path: "review.pptx", name: "review.pptx" },
	]);
	expect(
		presentationFiles({ ...tool, roomId: "child-room" }, "visible-room"),
	).toEqual([]);
	expect(presentationFiles({ ...tool, status: "RUNNING" })).toEqual([]);
	expect(
		presentationFiles({ ...tool, output: "I made review.pptx" }),
	).toEqual([]);
	expect(
		presentationFiles({ ...tool, output: '{"path":"../review.pptx"}' }),
	).toEqual([]);
	expect(
		isPresentationTool({
			...tool,
			output: undefined,
			status: "INPUT_REQUIRED",
		}),
	).toBe(true);
});

it("reads the existing PPTX workflow delivery result without run metadata", () => {
	const output = {
		workflow: "pptx",
		status: "complete",
		filePath: "requested.pptx",
		artifact: {
			filePath: "decks/review.pptx",
			status: "available",
			structuralValidation: "passed",
			sourceHash: "saved-file-hash",
		},
	};
	expect(
		presentationFiles({ ...tool, output: JSON.stringify(output) }),
	).toEqual([{ path: "decks/review.pptx", name: "review.pptx" }]);
	for (const artifact of [
		undefined,
		{ ...output.artifact, status: "unavailable" },
		{ ...output.artifact, structuralValidation: "not_verified" },
		{ ...output.artifact, sourceHash: null },
	]) {
		expect(
			presentationFiles({
				...tool,
				output: JSON.stringify({ ...output, artifact }),
			}),
		).toEqual([]);
	}
});

it("deduplicates explicit file results and retains nested paths and names", () => {
	expect(
		presentationFiles(
			{
				...tool,
				roomId: "room",
				output: JSON.stringify({
					path: "review.pptx",
					files: [
						{ filePath: "review.pptx", name: "Quarterly review" },
					],
					artifacts: [{ path: "decks/Board review.PPTX" }],
				}),
			},
			"room",
		),
	).toEqual([
		{ path: "review.pptx", name: "Quarterly review" },
		{ path: "decks/Board review.PPTX", name: "Board review.PPTX" },
	]);
});

it.each([
	"/review.pptx",
	"decks/../review.pptx",
	"https://example.com/review.pptx",
	"C:\\review.pptx",
	"decks//review.pptx",
	"review.pdf",
])(
	"does not offer a file action for a non-room presentation path: %s",
	(path) => {
		expect(
			presentationFiles({ ...tool, output: JSON.stringify({ path }) }),
		).toEqual([]);
	},
);
