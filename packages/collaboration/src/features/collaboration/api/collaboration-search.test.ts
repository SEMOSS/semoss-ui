import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import {
	loadSearchRecord,
	searchCollaboration,
	searchResultPath,
} from "./collaboration-search";
import { searchEntries, searchRecordFixture } from "./search.test-fixtures";

function actionsWith(output: unknown) {
	return {
		run: vi.fn(async () => ({
			pixelReturn: [{ output, operationType: ["MAP"] }],
		})),
	} as unknown as InsightActions;
}

describe("search API boundaries", () => {
	it("rejects malformed pages rather than treating errors as no matches", async () => {
		await expect(
			searchCollaboration(
				actionsWith({
					items: [{ kind: "unknown", id: "a", name: "A" }],
					total: 1,
				}),
				"test",
			),
		).rejects.toThrow("unexpected shape");
		await expect(
			searchCollaboration(actionsWith("Server failure"), "test"),
		).rejects.toThrow("unexpected shape");
	});
	it("encodes record IDs in all three navigation routes", () => {
		expect(searchResultPath({ kind: "thread", id: "a/b #?" })).toBe(
			"/work/thread/a%2Fb%20%23%3F",
		);
		expect(searchResultPath({ kind: "person", id: "person/one" })).toBe(
			"/brain/people/person%2Fone",
		);
		expect(searchResultPath({ kind: "topic", id: "topic/one" })).toBe(
			"/brain/topics/topic%2Fone",
		);
	});
	it("requires the requested identity before hydrating a destination", async () => {
		const fixture = searchRecordFixture(searchEntries[0]);
		await expect(
			loadSearchRecord(actionsWith(fixture), "topic", "different-record"),
		).rejects.toThrow("requested record was not returned");
	});
	it("hydrates the correct thread, native identity, workspace, and saved items", async () => {
		const entry = searchEntries[2];
		const fixture = {
			...searchRecordFixture(entry),
			items: [
				{
					id: "work-1",
					threadId: entry.id,
					title: "Saved ask",
					status: "open",
				},
			],
		};
		const command = await loadSearchRecord(
			actionsWith(fixture),
			"thread",
			entry.id,
		);
		if (command.type !== "records.loaded")
			throw new Error("Expected hydration");
		expect(command.threads[0].source?.nativeId).toBe(
			"fixture-native-message",
		);
		expect(command.workspaces[entry.id].goal).toBe(
			"Saved search fixture goal",
		);
		expect(command.items[0]).toMatchObject({
			id: "work-1",
			threadId: entry.id,
			title: "Saved ask",
		});
	});
});
