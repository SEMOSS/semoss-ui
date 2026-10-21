import { describe, expect, it, vi } from "vitest";
import { uploadRoomFiles } from "@/features/rooms/api/upload-room-files";
import type { InsightActions } from "@/lib/pixel";
import {
	linkTopicSource,
	saveTopicDocument,
	saveTopicSource,
} from "./topic-sources.api";

vi.mock("@/features/rooms/api/upload-room-files", () => ({
	uploadRoomFiles: vi.fn(),
}));

function session(output: unknown, operationType = ["CUSTOM_DATA_STRUCTURE"]) {
	const run = vi.fn(async () => ({
		pixelReturn: [{ output, operationType }],
	}));
	return { actions: { run } as unknown as InsightActions, run };
}

describe("topic source transport", () => {
	it("converts upload virtual-root locations into contained relative source paths", async () => {
		vi.mocked(uploadRoomFiles).mockResolvedValue([
			{ fileName: "Budget.pdf", fileLocation: "/Budget.pdf" },
		]);
		const connection = session({ sourceId: "source-1" });
		await saveTopicDocument(
			connection.actions,
			"insight-1",
			"topic-1",
			new File(["budget"], "Budget.pdf"),
		);
		expect(connection.run).toHaveBeenCalledWith(
			expect.stringContaining('filePath=["Budget.pdf"]'),
		);
	});
	it("encodes source text as data and requires the saved source identity", async () => {
		const connection = session({ sourceId: "source-1" });
		await saveTopicSource(connection.actions, {
			topicId: "topic-1",
			sourceId: "source-1",
			expectedVersion: 2,
			kind: "note",
			title: 'Notes "quoted"',
			content: "Line 1\nLine 2",
		});
		expect(connection.run).toHaveBeenCalledWith(
			expect.stringContaining("expectedVersion=[2]"),
		);
		expect(connection.run).toHaveBeenCalledWith(
			expect.stringContaining('content=["Line 1\\nLine 2"]'),
		);
		await expect(
			saveTopicSource(session({ sourceId: "other" }).actions, {
				topicId: "topic-1",
				sourceId: "source-1",
				kind: "note",
				title: "Note",
			}),
		).rejects.toThrow("does not match");
	});
	it("rejects failed writes and missing acknowledgements", async () => {
		for (const connection of [
			session("Access denied", ["ERROR"]),
			session({}),
		]) {
			await expect(
				saveTopicSource(connection.actions, {
					topicId: "topic-1",
					kind: "note",
					title: "Note",
				}),
			).rejects.toThrow();
		}
	});
	it("requires the source to be absent after unlink and checks the topic", async () => {
		await expect(
			linkTopicSource(
				session({ topicId: "topic-1", sources: [] }).actions,
				"topic-1",
				"source-1",
				true,
			),
		).resolves.toBeUndefined();
		await expect(
			linkTopicSource(
				session({ topicId: "other", sources: [] }).actions,
				"topic-1",
				"source-1",
				true,
			),
		).rejects.toThrow("not confirmed");
		await expect(
			linkTopicSource(
				session({ topicId: "topic-1", sources: [] }).actions,
				"topic-1",
				"source-1",
			),
		).rejects.toThrow("not confirmed");
	});
});
