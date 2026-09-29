import { EmailDraftEditor } from "@/features/connectors/api/email-draft-editor";
import {
	draftTransport,
	pendingDraftInitialization,
} from "./reply-draft.test-fixtures";
import { WorkComposerSession } from "./work-composer-session";

function setup() {
	const composer = new WorkComposerSession();
	composer.setIncludedSources(new Set(["email"]));
	composer.openReply("email", "Meeting", true);
	const draft = composer.getSnapshot().emailDrafts[0];
	const assistant = composer.getDraftAssistant(draft);
	const transport = draftTransport();
	const options = {
		session: transport.session,
		title: "Meeting",
		context: {
			threadId: "thread",
			contextRevision: "v1",
			contextText: "Included sources",
		},
		isSourceIncluded: () => composer.isSourceIncluded("email"),
		submit: (operation: () => Promise<void>) =>
			composer.submitAction(operation),
	};
	return { composer, draft, assistant, options, ...transport };
}

it("opens and resumes one reply without submitting or touching pending chat content", () => {
	const { composer, draft, assistant, send } = setup();
	composer.setDraft(0, {
		text: "Unsent question",
		files: [new File(["x"], "notes.txt")],
		document: null,
	});
	assistant.setInstructions("Confirm Friday");
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p>My wording</p>",
	});
	composer.openReply("email", "Meeting", false);
	expect(assistant.getSnapshot().isOpen).toBe(false);
	expect(composer.openReply("email", "Meeting", true)).toBe(draft);
	expect(composer.getSnapshot().emailDrafts).toEqual([draft]);
	expect(assistant.getSnapshot()).toMatchObject({
		isOpen: true,
		instructions: "Confirm Friday",
	});
	expect(draft.getSnapshot().values.body).toBe("<p>My wording</p>");
	expect(composer.getSnapshot().draft.text).toBe("Unsent question");
	expect(send).not.toHaveBeenCalled();
});

it("waits for initialization, locks duplicate generation, and then submits once", async () => {
	const { assistant, options, initialize, send, complete, draft } = setup();
	const ready = pendingDraftInitialization();
	initialize.mockReturnValueOnce(ready.promise);
	const generation = assistant.generate(options);
	expect(assistant.getSnapshot().isRunning).toBe(true);
	expect(send).not.toHaveBeenCalled();
	await assistant.generate(options);
	expect(initialize).toHaveBeenCalledOnce();
	ready.resolve();
	await generation;
	expect(send).toHaveBeenCalledOnce();
	complete();
	expect(draft.getSnapshot().values.body).toContain("Friday works.");
});

it("stops during initialization without submitting or cancelling another run", async () => {
	const { assistant, options, initialize, send, session, release } = setup();
	const ready = pendingDraftInitialization();
	initialize.mockReturnValueOnce(ready.promise);
	const generation = assistant.generate(options);
	await assistant.stop();
	expect(assistant.getSnapshot()).toMatchObject({
		isRunning: false,
		notice: "Generation stopped. Your draft is unchanged.",
	});
	expect(session.cancel).not.toHaveBeenCalled();
	expect(release).toHaveBeenCalledOnce();
	ready.resolve();
	await generation;
	expect(send).not.toHaveBeenCalled();
});

it("rechecks source inclusion after initialization", async () => {
	const { assistant, options, initialize, send, composer } = setup();
	const ready = pendingDraftInitialization();
	initialize.mockReturnValueOnce(ready.promise);
	const generation = assistant.generate(options);
	composer.setIncludedSources(new Set());
	ready.resolve();
	await generation;
	expect(send).not.toHaveBeenCalled();
	expect(assistant.getSnapshot()).toMatchObject({
		isRunning: false,
		error: expect.stringContaining("Include the original email"),
	});
});

it("surfaces initialization failure and retries only on an explicit request", async () => {
	const { assistant, options, initialize, publish, session, send, complete } =
		setup();
	initialize.mockImplementationOnce(async () => {
		publish({
			...session.getSnapshot(),
			error: new Error("History unavailable"),
		});
	});
	await assistant.generate(options);
	expect(assistant.getSnapshot()).toMatchObject({
		isRunning: false,
		error: "History unavailable",
	});
	expect(send).not.toHaveBeenCalled();
	publish({ ...session.getSnapshot(), error: null });
	expect(send).not.toHaveBeenCalled();
	await assistant.generate(options);
	expect(send).toHaveBeenCalledOnce();
	complete();
});

it("does not acquire another request's uncertain submission lock", async () => {
	const { assistant, options, publish, session, send, release } = setup();
	publish({ ...session.getSnapshot(), hasUnconfirmedSubmission: true });
	await assistant.generate(options);
	expect(send).not.toHaveBeenCalled();
	expect(assistant.getSnapshot()).toMatchObject({
		isRunning: false,
		error: "Check the last message before trying again.",
	});
	expect(release).toHaveBeenCalledOnce();
});

it("shows busy feedback without cancelling an existing conversation run", async () => {
	const { assistant, options, send, session, draft } = setup();
	send.mockRejectedValueOnce(
		new Error("Wait for the current response to finish."),
	);
	await assistant.generate(options);
	expect(assistant.getSnapshot()).toMatchObject({
		isRunning: false,
		error: "Wait for the current response to finish.",
	});
	expect(draft.getSnapshot().bodyRevision).toBe(0);
	expect(session.cancel).not.toHaveBeenCalled();
});

it("generates into the same draft, preserving recipients, chat attachments and durable reconciliation", async () => {
	const {
		draft,
		assistant,
		options,
		complete,
		release,
		composer,
		publish,
		session,
	} = setup();
	composer.setDraft(0, {
		text: "Unsent",
		files: [new File(["x"], "note.txt")],
		document: null,
	});
	composer.setSelected(["attachment"]);
	draft.setValues({ ...draft.getSnapshot().values, replyAll: true });
	await assistant.generate(options);
	expect(draft.getSnapshot().values.body).not.toContain("Friday");
	complete();
	expect(draft.getSnapshot().values).toMatchObject({
		body: "<p>Friday works.</p>",
		replyAll: true,
	});
	expect(assistant.getSnapshot().isRunning).toBe(false);
	expect(release).toHaveBeenCalledOnce();
	const revision = draft.getSnapshot().bodyRevision;
	publish({
		...session.getSnapshot(),
		turn: {
			...session.getSnapshot().turn,
			messages: session.getSnapshot().turn.messages.map((message) => ({
				...message,
				id: `durable-${message.id}`,
			})),
		},
	});
	expect(draft.getSnapshot().bodyRevision).toBe(revision);
	composer.reconcile(session, 1);
	expect(composer.getSnapshot()).toMatchObject({
		draft: { text: "Unsent" },
		selected: ["attachment"],
	});
});

it("revises the latest body and restores exact rich content with Undo", async () => {
	const { draft, assistant, options, send, complete } = setup();
	const html =
		'<p><strong>Friday</strong> at <a href="https://example.com">noon</a>.</p>';
	draft.setValues({ ...draft.getSnapshot().values, body: html });
	await assistant.generate(options, "Make it warmer.");
	expect(send.mock.calls[0][1]).toMatchObject({
		selectedSourceMessageId: "email",
		emailDraft: {
			draftId: draft.seed.id,
			body: "Friday at noon (https://example.com/).",
			bodyRevision: 1,
		},
	});
	expect(send.mock.calls[0][2].text).toContain("Make it warmer.");
	complete();
	draft.undoRevision();
	expect(draft.getSnapshot().values.body).toBe(html);
	expect(draft.getSnapshot().undoBody).toBeNull();
});

it("dismisses the one-step undo shortcut after manual body edits", async () => {
	const { draft, assistant, options, complete } = setup();
	await assistant.generate(options);
	complete();
	expect(draft.getSnapshot().undoBody).not.toBeNull();
	draft.setValues({ ...draft.getSnapshot().values, body: "<p>My edit</p>" });
	draft.undoRevision();
	expect(draft.getSnapshot().values.body).toBe("<p>My edit</p>");
});

it("holds a late revision for explicit replacement and makes that replacement undoable", async () => {
	const { draft, assistant, options, complete, composer } = setup();
	await assistant.generate(options);
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p><em>Newer edit</em></p>",
	});
	complete();
	expect(draft.getSnapshot().values.body).toBe("<p><em>Newer edit</em></p>");
	expect(assistant.getSnapshot().pendingBody).toContain("Friday");
	expect(composer.getSnapshot().error).toContain("your edits were kept");
	assistant.applySuggestion();
	expect(draft.getSnapshot().values.body).toContain("Friday");
	draft.undoRevision();
	expect(draft.getSnapshot().values.body).toBe("<p><em>Newer edit</em></p>");
});

it("can dismiss pending suggestions without replacing manual edits", async () => {
	const { draft, assistant, options, complete } = setup();
	await assistant.generate(options);
	draft.setValues({ ...draft.getSnapshot().values, body: "<p>Edited</p>" });
	complete();
	assistant.dismissSuggestion();
	expect(assistant.getSnapshot().pendingBody).toBeNull();
	expect(draft.getSnapshot().values.body).toBe("<p>Edited</p>");
});

it("finishes in the background without requesting a panel or requiring a mounted listener", async () => {
	const { composer, assistant, options, complete, draft } = setup();
	const request = composer.getSnapshot().emailRequest;
	if (request) composer.consumeEmailRequest(request);
	const unsubscribe = assistant.subscribe(() => undefined);
	await assistant.generate(options);
	unsubscribe();
	complete();
	expect(draft.getSnapshot().values.body).toContain("Friday");
	expect(composer.getSnapshot().emailRequest).toBeNull();
});

it("shows clarification text, then uses the user's answer for another request", async () => {
	const { assistant, options, complete, send, draft } = setup();
	await assistant.generate(options);
	complete("Which day should I propose?");
	expect(assistant.getSnapshot().question).toBe(
		"Which day should I propose?",
	);
	expect(draft.getSnapshot().bodyRevision).toBe(0);
	assistant.setInstructions("Friday.");
	await assistant.generate(options);
	complete();
	expect(send.mock.calls[1][2].text).toContain("Friday.");
	expect(assistant.getSnapshot().question).toBe("");
});

it.each(["failed", "cancelled"] as const)(
	"preserves the draft after a %s run and allows retry",
	async (phase) => {
		const { assistant, options, publish, session, draft, complete } =
			setup();
		await assistant.generate(options);
		publish({
			...session.getSnapshot(),
			turn: {
				...session.getSnapshot().turn,
				isRunning: false,
				phase,
				settlementVersion: 1,
			},
		});
		expect(draft.getSnapshot().bodyRevision).toBe(0);
		expect(assistant.getSnapshot().isRunning).toBe(false);
		await assistant.generate(options);
		complete();
		expect(draft.getSnapshot().values.body).toContain("Friday");
	},
);

it("stops without applying late output", async () => {
	const { assistant, options, complete, session, draft } = setup();
	await assistant.generate(options);
	await assistant.stop();
	complete();
	expect(session.cancel).toHaveBeenCalledOnce();
	expect(draft.getSnapshot().bodyRevision).toBe(0);
});

it.each([
	"```semoss-email-draft\n{}\n```",
	'```semoss-email-draft\n{"sourceMessageId":"another-email","body":"Wrong target"}\n```',
])("rejects malformed or mismatched proposals", async (text) => {
	const { assistant, options, complete, draft } = setup();
	await assistant.generate(options);
	complete(text);
	expect(draft.getSnapshot().bodyRevision).toBe(0);
	expect(assistant.getSnapshot().error).not.toBe("");
});

it("enforces exclusions both before submitting and when receiving a result", async () => {
	const { composer, assistant, options, send, complete, draft } = setup();
	composer.setIncludedSources(new Set());
	await assistant.generate(options);
	expect(send).not.toHaveBeenCalled();
	composer.setIncludedSources(new Set(["email"]));
	await assistant.generate(options);
	composer.setIncludedSources(new Set());
	complete();
	expect(draft.getSnapshot().bodyRevision).toBe(0);
});

it("ignores another request's response and releases subscriptions on app disposal", async () => {
	const {
		assistant,
		options,
		publish,
		session,
		draft,
		composer,
		listeners,
		release,
	} = setup();
	await assistant.generate(options);
	publish({
		...session.getSnapshot(),
		turn: {
			...session.getSnapshot().turn,
			phase: "completed",
			isRunning: false,
			settlementVersion: 1,
			messages: [
				{
					id: "other",
					role: "assistant",
					parts: [
						{
							type: "text",
							text: '```semoss-email-draft\n{"sourceMessageId":"email","body":"Other request"}\n```',
						},
					],
				},
			],
		},
	});
	expect(draft.getSnapshot().bodyRevision).toBe(0);
	composer.dispose();
	expect(listeners.size).toBe(0);
	expect(release).toHaveBeenCalledOnce();
});

it("resumes an explicitly opened older proposal as the active reply", () => {
	const composer = new WorkComposerSession();
	const older = new EmailDraftEditor({
		id: "older",
		mode: "reply",
		sourceUid: "email",
	});
	composer.requestEmailDraft(older.seed);
	composer.requestEmailDraft({ ...older.seed, id: "newer" });
	composer.requestEmailDraft(older.seed);
	composer.openReply("email", "Meeting", true);
	expect(composer.getSnapshot().emailRequest?.id).toBe("older");
});

it("keeps an uncertain submission locked until reconnection confirms it was not received", async () => {
	const { assistant, options, session, send, publish, draft } = setup();
	send.mockImplementationOnce(async () => {
		publish({ ...session.getSnapshot(), hasUnconfirmedSubmission: true });
		throw new Error("Lost response");
	});
	await assistant.generate(options);
	expect(assistant.getSnapshot().isRunning).toBe(true);
	await assistant.generate(options);
	expect(send).toHaveBeenCalledOnce();
	publish({ ...session.getSnapshot(), hasUnconfirmedSubmission: false });
	expect(assistant.getSnapshot().isRunning).toBe(false);
	expect(assistant.getSnapshot().error).toContain("not found");
	expect(draft.getSnapshot().bodyRevision).toBe(0);
});

it("resumes a confirmed request after a transport interruption", async () => {
	const { assistant, options, session, publish, complete, draft } = setup();
	await assistant.generate(options);
	publish({
		...session.getSnapshot(),
		turn: {
			...session.getSnapshot().turn,
			transportError: new Error("Disconnected"),
		},
	});
	expect(assistant.getSnapshot().error).toContain("connection");
	publish({
		...session.getSnapshot(),
		turn: { ...session.getSnapshot().turn, transportError: null },
	});
	complete();
	expect(draft.getSnapshot().values.body).toContain("Friday");
	expect(assistant.getSnapshot().error).toBe("");
});

it("correlates the request when room preparation replaces the turn controller", async () => {
	const { assistant, options, session, publish, complete, draft } = setup();
	publish({
		...session.getSnapshot(),
		turn: { ...session.getSnapshot().turn, settlementVersion: 8 },
	});
	await assistant.generate(options);
	publish({
		...session.getSnapshot(),
		turn: { ...session.getSnapshot().turn, settlementVersion: 0 },
	});
	complete();
	expect(assistant.getSnapshot().isRunning).toBe(false);
	expect(draft.getSnapshot().values.body).toContain("Friday");
});
