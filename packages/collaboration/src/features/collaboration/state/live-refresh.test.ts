import { expect, it } from "vitest";
import { createInitialCollaborationState } from "./collaboration.fixtures";
import { collaborationReducer } from "./collaboration.reducer";
import type {
	CollaborationCommand,
	CollaborationState,
	ReviewEntry,
} from "./collaboration.types";

const now = "2026-10-08T16:00:00Z";
const review = (
	id: string,
	status: ReviewEntry["status"] = "open",
): ReviewEntry => ({
	id,
	kind: "unassigned",
	text: id,
	detail: "",
	refId: null,
	status,
	actions: [],
	isSample: false,
});
const refresh = (
	state: CollaborationState,
	updates: Extract<CollaborationCommand, { type: "live.refresh" }>["updates"],
) => collaborationReducer(state, { type: "live.refresh", updates }, now);

it("reconciles live pending reviews without dropping sample, local, accepted, or dismissed history", () => {
	const state = createInitialCollaborationState();
	state.reviews = [
		review("resolved-elsewhere"),
		review("updated"),
		review("accepted", "accepted"),
		review("dismissed", "dismissed"),
		{ ...review("sample"), isSample: undefined },
		review("local-review-unsaved"),
	];
	const next = refresh(state, {
		threads: [],
		workspaces: {},
		items: [],
		reviews: [
			{ ...review("updated"), text: "Updated question" },
			review("arrived"),
			review("accepted"),
		],
	});
	expect(next.reviews.map((entry) => entry.id)).toEqual([
		"updated",
		"accepted",
		"dismissed",
		"sample",
		"local-review-unsaved",
		"arrived",
	]);
	expect(next.reviews.find((entry) => entry.id === "updated")?.text).toBe(
		"Updated question",
	);
	expect(next.reviews.find((entry) => entry.id === "accepted")?.status).toBe(
		"accepted",
	);
	expect(state.reviews).toHaveLength(6);
});

it("leaves pending reviews alone when omitted and keeps reviews edited during a complete read", () => {
	const state = createInitialCollaborationState();
	state.reviews = [review("edited"), review("resolved")];
	const untouched = refresh(state, {
		threads: [],
		workspaces: {},
		items: [],
	});
	expect(untouched.reviews).toEqual(state.reviews);
	const next = refresh(state, {
		threads: [],
		workspaces: {},
		items: [],
		reviews: [],
		keepReviewIds: ["edited"],
	});
	expect(next.reviews).toEqual([review("edited")]);
});

it("merges new referenced people and topic details while preserving local edits and sample records", () => {
	const state = createInitialCollaborationState();
	const topic = { ...state.topics[0], id: "live-topic", isSample: false };
	const person = { ...state.people[0], id: "live-person", isSample: false };
	state.topics.push(topic);
	state.people.push(person);
	const next = refresh(state, {
		threads: [],
		workspaces: {},
		items: [],
		topics: [
			{ ...topic, name: "Stale title" },
			{ ...topic, id: "new-topic", name: "New topic" },
			{
				...state.topics[0],
				name: "Do not replace sample",
				isSample: false,
			},
		],
		people: [
			{ ...person, name: "Stale person" },
			{
				...person,
				id: "new-person",
				name: "New person",
				follow: "suggested",
			},
		],
		keepTopicIds: [topic.id],
		keepPersonIds: [person.id],
	});
	expect(next.topics.find((entry) => entry.id === topic.id)?.name).toBe(
		topic.name,
	);
	expect(next.people.find((entry) => entry.id === person.id)?.name).toBe(
		person.name,
	);
	expect(next.topics[0].name).toBe(state.topics[0].name);
	expect(next.topics.find((entry) => entry.id === "new-topic")?.name).toBe(
		"New topic",
	);
	expect(next.people.find((entry) => entry.id === "new-person")?.follow).toBe(
		"suggested",
	);
});

it("preserves active memories and local memory changes while refreshing suggestions", () => {
	const state = createInitialCollaborationState();
	const base = { ...state.memories[0], isSample: false };
	state.memories = [
		{ ...base, id: "active", state: "active" },
		{ ...base, id: "resolved", state: "suggested" },
		{ ...base, id: "edited", state: "active", text: "My edit" },
		{ ...base, id: "sample", isSample: true },
	];
	const next = refresh(state, {
		threads: [],
		workspaces: {},
		items: [],
		memories: [
			state.memories[0],
			{ ...base, id: "new-suggestion", state: "suggested" },
		],
		keepMemoryIds: ["edited"],
	});
	expect(next.memories.map((memory) => memory.id)).toEqual([
		"active",
		"edited",
		"sample",
		"new-suggestion",
	]);
	expect(next.memories.find((memory) => memory.id === "edited")?.text).toBe(
		"My edit",
	);
});
