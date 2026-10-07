import {
	canEvictRoomEmailStore,
	disposeRoomEmailStore,
	getRoomEmailContext,
	getRoomEmailStore,
} from "./room-email-store";

it("isolates editors by room owner and reads the latest edits only after opening", () => {
	const owner = {};
	const store = getRoomEmailStore(owner);
	const draft = store.requestEmailDraft(
		{ id: "draft", mode: "reply", sourceUid: "email", body: "Original" },
		false,
	);
	expect(getRoomEmailContext(owner)).toBeUndefined();
	expect(getRoomEmailStore({}).getSnapshot().emailDrafts).toHaveLength(0);
	draft.setValues({
		...draft.getSnapshot().values,
		to: "owner@example.com",
		body: "<p>My edited reply</p>",
	});
	expect(store.requestEmailDraft({ ...draft.seed, body: "Stale seed" })).toBe(
		draft,
	);
	expect(getRoomEmailContext(owner)).toEqual({
		openEmail: {
			id: "draft",
			status: "editing",
			replyTo: "email",
			to: "owner@example.com",
			cc: "",
			subject: "",
			body: "My edited reply",
			bodyRevision: 1,
		},
	});
	expect(store.getSnapshot().emailDrafts).toHaveLength(1);
});

it("retains unsaved and pending work and disposes resources with the room", () => {
	const owner = {};
	const store = getRoomEmailStore(owner);
	expect(canEvictRoomEmailStore(owner)).toBe(true);
	const draft = store.requestEmailDraft(
		{ id: "draft", mode: "new", assistantMessageId: "saved-result" },
		false,
	);
	expect(canEvictRoomEmailStore(owner)).toBe(true);
	draft.setValues({ ...draft.getSnapshot().values, subject: "Local edits" });
	expect(canEvictRoomEmailStore(owner)).toBe(false);
	const dispose = vi.spyOn(draft, "dispose");
	disposeRoomEmailStore(owner);
	expect(dispose).toHaveBeenCalledOnce();
	expect(getRoomEmailStore(owner)).not.toBe(store);
	expect(getRoomEmailStore(owner).getSnapshot().emailDrafts).toHaveLength(0);
});

it("claims completed revisions once for the whole room lifetime", () => {
	const owner = {};
	expect(getRoomEmailStore(owner).claimProposalRevision("revision")).toBe(
		true,
	);
	expect(getRoomEmailStore(owner).claimProposalRevision("revision")).toBe(
		false,
	);
	expect(getRoomEmailStore({}).claimProposalRevision("revision")).toBe(true);
});

it("keeps the displayed source identity in its room alongside the retained draft", () => {
	const owner = {};
	const other = {};
	const store = getRoomEmailStore(owner);
	store.selectSourceMessage("second-email");
	expect(getRoomEmailContext(owner)).toEqual({
		selectedSourceMessageId: "second-email",
	});
	expect(getRoomEmailContext(other)).toBeUndefined();
	store.requestEmailDraft({
		id: "draft",
		mode: "reply",
		sourceUid: "first-email",
	});
	expect(getRoomEmailContext(owner)).toMatchObject({
		selectedSourceMessageId: "second-email",
		openEmail: { replyTo: "first-email" },
	});
	disposeRoomEmailStore(owner);
	expect(getRoomEmailContext(owner)).toBeUndefined();
});
