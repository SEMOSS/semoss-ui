import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ASSISTANT_HANDOFF_PARAM,
	storeAssistantHandoff,
	takeAssistantHandoff,
} from "./assistant-handoff";

const STORAGE_PREFIX = "semoss-assistant-handoff--";

describe("assistant-handoff", () => {
	beforeEach(() => {
		window.localStorage.clear();
		vi.restoreAllMocks();
	});

	it("exposes the query-param name the workbench reads", () => {
		expect(ASSISTANT_HANDOFF_PARAM).toBe("assistantHandoff");
	});

	it("round-trips the run the workbench has to adopt", () => {
		const id = storeAssistantHandoff({
			prompt: "build a supplier risk dashboard",
			roomId: "room-1",
			runId: "run-1",
		});

		expect(id).not.toBe("");
		expect(takeAssistantHandoff(id)).toEqual({
			prompt: "build a supplier risk dashboard",
			roomId: "room-1",
			runId: "run-1",
		});
	});

	it("rejects a record missing the room or run", () => {
		// Without both the workbench has nothing to reattach to, so the record
		// is worthless rather than partially usable.
		window.localStorage.setItem(
			`${STORAGE_PREFIX}no-run`,
			JSON.stringify({
				prompt: "orphaned",
				roomId: "room-1",
				createdAt: Date.now(),
			}),
		);

		expect(takeAssistantHandoff("no-run")).toBeNull();
	});

	it("deletes the record as it reads it, so a reload finds nothing", () => {
		const id = storeAssistantHandoff({
			prompt: "one turn only",
			roomId: "room-1",
			runId: "run-1",
		});

		expect(takeAssistantHandoff(id)).not.toBeNull();
		expect(
			window.localStorage.getItem(`${STORAGE_PREFIX}${id}`),
		).toBeNull();
	});

	it("returns the same payload on a second read within one page load", () => {
		// StrictMode double-invokes effects; the second read must not come back
		// empty just because the first one consumed the record.
		const id = storeAssistantHandoff({
			prompt: "strict mode",
			roomId: "room-1",
			runId: "run-1",
		});

		const first = takeAssistantHandoff(id);
		const second = takeAssistantHandoff(id);

		expect(second).toEqual(first);
	});

	it("returns null without an id", () => {
		expect(takeAssistantHandoff(null)).toBeNull();
		expect(takeAssistantHandoff("")).toBeNull();
	});

	it("returns null for an unknown id", () => {
		expect(takeAssistantHandoff("never-stored")).toBeNull();
	});

	it("returns null for a malformed record", () => {
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		window.localStorage.setItem(`${STORAGE_PREFIX}broken`, "{not json");

		expect(takeAssistantHandoff("broken")).toBeNull();
	});

	it("returns null for a record with no usable prompt", () => {
		window.localStorage.setItem(
			`${STORAGE_PREFIX}blank`,
			JSON.stringify({
				prompt: "   ",
				roomId: "room-1",
				runId: "run-1",
				createdAt: Date.now(),
			}),
		);

		expect(takeAssistantHandoff("blank")).toBeNull();
	});

	it("returns null for an expired record", () => {
		window.localStorage.setItem(
			`${STORAGE_PREFIX}stale`,
			JSON.stringify({
				prompt: "abandoned an hour ago",
				roomId: "room-1",
				runId: "run-1",
				createdAt: Date.now() - 60 * 60 * 1000,
			}),
		);

		expect(takeAssistantHandoff("stale")).toBeNull();
	});

	it("sweeps expired records when a new handoff is parked", () => {
		window.localStorage.setItem(
			`${STORAGE_PREFIX}stale`,
			JSON.stringify({
				prompt: "old",
				roomId: "room-1",
				runId: "run-1",
				createdAt: 0,
			}),
		);

		storeAssistantHandoff({
			prompt: "fresh",
			roomId: "room-1",
			runId: "run-1",
		});

		expect(
			window.localStorage.getItem(`${STORAGE_PREFIX}stale`),
		).toBeNull();
	});

	it("returns an empty id when storage is unavailable", () => {
		// Private browsing and quota-exceeded both surface as a throwing
		// setItem. The caller still navigates; it just warns the user.
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		// jsdom defines setItem on Storage.prototype, not on the instance.
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("QuotaExceededError");
		});

		expect(
			storeAssistantHandoff({
				prompt: "no storage",
				roomId: "room-1",
				runId: "run-1",
			}),
		).toBe("");
	});
});
