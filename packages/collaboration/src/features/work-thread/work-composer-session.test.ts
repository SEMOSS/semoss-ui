import { WorkComposerSession } from "./work-composer-session";

it("sends the shown email as it stands, edits included", () => {
	const composer = new WorkComposerSession();
	expect(composer.openEmailContext()).toBeUndefined();
	// hydrated drafts that were never shown are not the open email
	composer.requestEmailDraft({ id: "hidden", mode: "new" }, false);
	expect(composer.openEmailContext()).toBeUndefined();
	const draft = composer.requestEmailDraft({
		id: "shown",
		mode: "new",
		to: "ryan@example.com",
		subject: "Test",
		body: "Hi Ryan",
	});
	draft.setValues({
		...draft.getSnapshot().values,
		subject: "Lunch",
		body: "<p>Hi Ryan, lunch Friday?</p>",
	});
	expect(composer.openEmailContext()).toEqual({
		id: "shown",
		to: "ryan@example.com",
		cc: "",
		subject: "Lunch",
		body: "Hi Ryan, lunch Friday?",
		bodyRevision: draft.getSnapshot().bodyRevision,
		status: "editing",
	});
});

it("says when a send waits for the owner, and presses Send once", () => {
	const composer = new WorkComposerSession();
	const draft = composer.requestEmailDraft({
		id: "shown",
		mode: "new",
		to: "ryan@example.com",
		body: "Hi",
	});
	draft.setSendApproval({
		toolId: "send-call",
		approve: async () => undefined,
		reject: async () => undefined,
	});
	expect(composer.openEmailContext()?.status).toBe("waiting");
	composer.requestSend(draft);
	expect(draft.takeSubmitRequest()).toBe(true);
	expect(draft.takeSubmitRequest()).toBe(false);
});

it("names the email a reply answers", () => {
	const composer = new WorkComposerSession();
	composer.requestEmailDraft({
		id: "reply",
		mode: "reply",
		sourceUid: "email-1",
		body: "Thanks",
	});
	expect(composer.openEmailContext()).toMatchObject({
		id: "reply",
		replyTo: "email-1",
	});
});
