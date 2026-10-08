import type { InsightActions } from "@/lib/pixel";
import { loadSourceThread } from "./load-source-thread";
import {
	sourceImportState,
	sourceMessage,
} from "./source-import.test-fixtures";
import {
	roomSourceFromDocument,
	sourceThreadFile,
	sourceThreadMarkdown,
} from "./source-thread-file";

const page = (messages: unknown[], rest: Record<string, unknown> = {}) => ({
	pixelReturn: [
		{
			output: {
				threadId: "source-one",
				messages,
				hasMore: false,
				...rest,
			},
		},
	],
});
const actionsFor = (run: ReturnType<typeof vi.fn>) =>
	({ run }) as unknown as InsightActions;

it("loads all Brain pages, deduplicates, sorts and excludes restricted source content", async () => {
	const state = sourceImportState();
	state.threads[0].messageCount = 4;
	const latest = sourceMessage(
		"latest",
		"Latest reply\nFrom: Excluded sender\nSecret quote",
	);
	const oldest = {
		...sourceMessage("oldest", "Original"),
		at: "2026-09-01T12:00:00Z",
		history: true,
	};
	const run = vi
		.fn()
		.mockResolvedValueOnce(
			page(
				[
					latest,
					{
						...sourceMessage("excluded", "Secret text"),
						excluded: true,
					},
				],
				{ hasMore: true, nextCursor: "older" },
			),
		)
		.mockResolvedValueOnce(page([oldest, latest]));
	const document = await loadSourceThread(
		actionsFor(run),
		() => state,
		"source-one",
	);
	expect(run).toHaveBeenCalledTimes(2);
	expect(run.mock.calls[1]?.[0]).toContain('cursor=["older"]');
	expect(document.messages.map((message) => message.id)).toEqual([
		"oldest",
		"latest",
	]);
	expect(sourceThreadMarkdown(document)).not.toContain("Secret");
	expect(document.limitations).toContain(
		"Messages excluded from assistant context are not included.",
	);
});

it.each([undefined, "same"])(
	"rejects missing or repeated continuation %s",
	async (nextCursor) => {
		const state = sourceImportState();
		const run = vi
			.fn()
			.mockResolvedValue(
				page([sourceMessage()], { hasMore: true, nextCursor }),
			);
		await expect(
			loadSourceThread(actionsFor(run), () => state, "source-one"),
		).rejects.toThrow("could not continue");
		expect(run.mock.calls.length).toBeLessThanOrEqual(2);
	},
);

it("applies exclusions changed while history loads and reports unavailable data", async () => {
	const state = sourceImportState();
	const run = vi.fn().mockImplementation(async () => {
		state.threads[0].participants[0].included = false;
		return page([sourceMessage()], { hiddenCount: 2, unavailableCount: 1 });
	});
	const document = await loadSourceThread(
		actionsFor(run),
		() => state,
		"source-one",
	);
	expect(document.messages).toEqual([]);
	expect(document.limitations).toContain(
		"1 source messages could not be read and are not included.",
	);
	expect(sourceThreadMarkdown(document)).toContain(
		"no included source messages",
	);
});

it("preserves literal message text and attachment names without display HTML or bytes", async () => {
	const state = sourceImportState();
	const run = vi.fn().mockResolvedValue(
		page([
			{
				...sourceMessage(
					"mail-one",
					"Hello **team** <script>alert(1)</script>\nNext line",
				),
				displayBody: {
					contentType: "html",
					content: "<p>Private quoted display body</p>",
				},
				attachments: [
					{ id: "attachment", name: "Budget.xlsx", kind: "file" },
				],
			},
		]),
	);
	const document = await loadSourceThread(
		actionsFor(run),
		() => state,
		"source-one",
	);
	const markdown = sourceThreadMarkdown(document);
	expect(markdown).toContain("\\*\\*team\\*\\*");
	expect(markdown).toContain("&lt;script&gt;");
	expect(markdown).toContain("Budget\\.xlsx");
	expect(markdown).not.toContain("Private quoted display body");
	const file = sourceThreadFile(document);
	expect(file.name).toBe("Budget-review.md");
	expect(file.type).toBe("text/markdown");
	const source = roomSourceFromDocument(document, {
		fileName: file.name,
		fileLocation: "/Budget-review.md",
	});
	expect(source.messages).toEqual([
		expect.objectContaining({ id: "mail-one", fromName: "Ada" }),
	]);
	expect(source.messages[0]).not.toHaveProperty("text");
});

it("reconstructs a connected Teams source as an explicitly bounded snapshot", async () => {
	const state = sourceImportState();
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [
			{
				output: {
					chatId: "chat-one",
					count: 1,
					messages: [
						{
							id: "message-one",
							body: "Chat text",
							fromName: "Ada",
							fromId: "ada",
							createdDateTime: "2026-10-01T12:00:00Z",
						},
					],
				},
			},
		],
	});
	const document = await loadSourceThread(
		actionsFor(run),
		() => state,
		"connected:teams:chat-one",
	);
	expect(document.kind).toBe("teams");
	expect(document.messages[0]?.text).toBe("Chat text");
	expect(document.limitations[0]).toContain("up to 30");
});

it("stops before reading the next page when its route is abandoned", async () => {
	const state = sourceImportState();
	let active = true;
	const run = vi.fn().mockImplementation(async () => {
		active = false;
		return page([sourceMessage()], { hasMore: true, nextCursor: "next" });
	});
	await expect(
		loadSourceThread(
			actionsFor(run),
			() => state,
			"source-one",
			() => {
				if (!active) throw new Error("Stopped");
			},
		),
	).rejects.toThrow("Stopped");
	expect(run).toHaveBeenCalledTimes(1);
});
