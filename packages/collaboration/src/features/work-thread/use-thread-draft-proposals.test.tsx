import { renderHook } from "@testing-library/react";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { ConversationMessage } from "@/features/messages/types/message";
import { composeEmailPart } from "@/features/thread-assistant/compose-email.test-fixtures";
import {
	type SubmittedThreadContext,
	threadCommand,
} from "@/features/thread-assistant/thread-context";
import { composeDraftId } from "@/features/thread-assistant/thread-draft-proposal";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { useThreadDraftProposals } from "./use-thread-draft-proposals";
import { WorkComposerSession } from "./work-composer-session";
import { workSnapshot } from "./work-thread.test-fixtures";

function setup() {
	const thread = {
		...createInitialCollaborationState().threads[0],
		source: {
			kind: "outlook" as const,
			nativeId: "email",
			folder: "inbox",
		},
	};
	const composer = new WorkComposerSession();
	const message: ConversationMessage = {
		id: "answer",
		runId: "run-1",
		role: "assistant",
		parts: [
			composeEmailPart(
				{ replyTo: "email", message: "Friday works." },
				"compose-email",
			),
		],
	};
	const base = {
		thread,
		composer,
		allowedSources: new Set(["email"]),
		isReady: true,
		snapshot: workSnapshot(),
	};
	const completed = {
		...base,
		snapshot: {
			...base.snapshot,
			turn: {
				...base.snapshot.turn,
				phase: "completed" as const,
				settlementVersion: 1,
				messages: [message],
			},
		},
	};
	return { base, completed, composer };
}

it("opens a newly completed proposal once and preserves edits through durable reconciliation", () => {
	const { base, completed, composer } = setup();
	const view = renderHook(useThreadDraftProposals, { initialProps: base });
	view.rerender({
		...base,
		snapshot: {
			...base.snapshot,
			turn: {
				...base.snapshot.turn,
				isRunning: true,
				phase: "streaming",
			},
		},
	});
	view.rerender(completed);
	const draft = composer.getSnapshot().emailDrafts[0];
	expect(draft.seed.sourceUid).toBe("email");
	expect(composer.getSnapshot().emailRequest?.id).toBe(draft.seed.id);
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p>My edited reply</p>",
	});
	const request = composer.getSnapshot().emailRequest;
	if (request) composer.consumeEmailRequest(request);
	view.rerender({
		...completed,
		snapshot: {
			...completed.snapshot,
			turn: {
				...completed.snapshot.turn,
				messages: completed.snapshot.turn.messages.map((message) => ({
					...message,
					id: "durable-answer",
				})),
			},
		},
	});
	expect(composer.getSnapshot().emailDrafts).toHaveLength(1);
	expect(draft.getSnapshot().values.body).toBe("<p>My edited reply</p>");
	expect(composer.getSnapshot().emailRequest).toBeNull();
});

it("restores history and background results without reopening the workbench", () => {
	const { completed, composer } = setup();
	renderHook(useThreadDraftProposals, { initialProps: completed });
	expect(composer.getSnapshot().emailDrafts).toHaveLength(1);
	expect(composer.getSnapshot().emailRequest).toBeNull();
});

it("does not create a proposal for an excluded source", () => {
	const { completed, composer } = setup();
	renderHook(useThreadDraftProposals, {
		initialProps: { ...completed, allowedSources: new Set<string>() },
	});
	expect(composer.getSnapshot().emailDrafts).toEqual([]);
});

it("opens a new email from a session with no source email", () => {
	const { completed, composer } = setup();
	const session = { ...completed.thread, source: undefined };
	renderHook(useThreadDraftProposals, {
		initialProps: {
			...completed,
			thread: session,
			allowedSources: new Set<string>(),
			snapshot: {
				...completed.snapshot,
				turn: {
					...completed.snapshot.turn,
					messages: [
						{
							...completed.snapshot.turn.messages[0],
							parts: [
								composeEmailPart({
									to: "rweiler@example.com",
									cc: "",
									subject: "Meeting in DC",
									message: "Hi Ryan,\nWhen should we meet?",
								}),
							],
						},
					],
				},
			},
		},
	});
	const [draft] = composer.getSnapshot().emailDrafts;
	expect(draft.seed).toMatchObject({
		mode: "new",
		to: "rweiler@example.com",
		subject: "Meeting in DC",
		body: "Hi Ryan,\nWhen should we meet?",
	});
	expect(draft.seed.sourceUid).toBeUndefined();
});

it("quick submissions preserve pending text, files, and source attachments even after reconciliation", async () => {
	const composer = new WorkComposerSession();
	const file = new File(["notes"], "notes.txt");
	composer.setDraft(0, {
		document: null,
		text: "Unsent request",
		files: [file],
	});
	composer.setSelected(["attachment"]);
	await composer.submitAction(async () => undefined);
	composer.reconcile({} as ThreadSession, 1);
	expect(composer.getSnapshot().draft).toMatchObject({
		text: "Unsent request",
		files: [file],
	});
	expect(composer.getSnapshot().selected).toEqual(["attachment"]);
	expect(composer.claimAction("request")).toBe(true);
	expect(composer.claimAction("request")).toBe(false);
});

it("waits for settlement when durable output arrives during generation", () => {
	const { base, completed, composer } = setup();
	const view = renderHook(useThreadDraftProposals, { initialProps: base });
	view.rerender({
		...completed,
		snapshot: {
			...completed.snapshot,
			turn: {
				...completed.snapshot.turn,
				settlementVersion: 0,
				isRunning: true,
				phase: "streaming",
			},
		},
	});
	expect(composer.getSnapshot().emailDrafts).toHaveLength(0);
	view.rerender(completed);
	expect(composer.getSnapshot().emailDrafts).toHaveLength(1);
	expect(composer.getSnapshot().emailRequest).not.toBeNull();
});

it.each(["cancelled", "failed"] as const)(
	"does not create editors from %s output",
	(phase) => {
		const { base, completed, composer } = setup();
		const view = renderHook(useThreadDraftProposals, {
			initialProps: base,
		});
		view.rerender({
			...base,
			snapshot: {
				...base.snapshot,
				turn: { ...base.snapshot.turn, isRunning: true },
			},
		});
		view.rerender({
			...completed,
			snapshot: {
				...completed.snapshot,
				turn: { ...completed.snapshot.turn, phase },
			},
		});
		expect(composer.getSnapshot().emailDrafts).toHaveLength(0);
		expect(composer.getSnapshot().emailRequest).toBeNull();
	},
);

it("ignores a ComposeEmail call without an email", () => {
	const { base, completed, composer } = setup();
	const view = renderHook(useThreadDraftProposals, { initialProps: base });
	view.rerender({
		...base,
		snapshot: {
			...base.snapshot,
			turn: { ...base.snapshot.turn, isRunning: true },
		},
	});
	view.rerender({
		...completed,
		snapshot: {
			...completed.snapshot,
			turn: {
				...completed.snapshot.turn,
				messages: [
					{
						id: "invalid",
						role: "assistant",
						parts: [
							composeEmailPart({ replyTo: "email", message: "" }),
						],
					},
				],
			},
		},
	});
	expect(view.result.current).toBe("");
	expect(composer.getSnapshot().emailDrafts).toHaveLength(0);
});

it("rejects a proposal for a different included email than the requested message", () => {
	const { completed, composer } = setup();
	const prompt: ConversationMessage = {
		id: "prompt",
		role: "user",
		parts: [
			{
				type: "text",
				text: threadCommand(
					{
						threadId: completed.thread.id,
						contextRevision: "revision",
						contextText: "sources",
						selectedSourceMessageId: "different-email",
					},
					"Draft a reply to this email using the thread context.",
				),
			},
		],
	};
	renderHook(useThreadDraftProposals, {
		initialProps: {
			...completed,
			allowedSources: new Set(["email", "different-email"]),
			snapshot: {
				...completed.snapshot,
				turn: {
					...completed.snapshot.turn,
					messages: [prompt, ...completed.snapshot.turn.messages],
				},
			},
		},
	});
	expect(composer.getSnapshot().emailDrafts).toHaveLength(0);
});

it("restores the latest editor revision as one reachable local draft without opening it", () => {
	const { completed, composer } = setup();
	const messages: ConversationMessage[] = [1, 2].flatMap((version) => [
		{
			id: `user-${version}`,
			role: "user" as const,
			parts: [
				{
					type: "text" as const,
					text: threadCommand(
						{
							threadId: completed.thread.id,
							contextRevision: "1",
							contextText: "email",
							selectedSourceMessageId: "email",
							emailDraft: {
								draftId: "reply:email",
								requestId: `request-${version}`,
								body: "",
								bodyRevision: version,
							},
						},
						"Revise the reply",
					),
				},
			],
		},
		{
			id: `answer-${version}`,
			role: "assistant" as const,
			parts: [
				composeEmailPart(
					{ replyTo: "email", message: `Version ${version}` },
					`compose-${version}`,
				),
			],
		},
	]);
	const props = {
		...completed,
		snapshot: {
			...completed.snapshot,
			turn: { ...completed.snapshot.turn, messages },
		},
	};
	const view = renderHook(useThreadDraftProposals, { initialProps: props });
	const draft = composer.getSnapshot().emailDrafts[0];
	expect(composer.getSnapshot().emailDrafts).toHaveLength(1);
	expect(draft.seed.id).toBe("reply:email");
	expect(draft.seed.assistantMessageId).toBeUndefined();
	expect(draft.getSnapshot()).toMatchObject({
		values: { body: "<p>Version 2</p>" },
		requiresAcceptance: true,
	});
	expect(composer.getSnapshot().emailRequest).toBeNull();
	draft.setValues({ ...draft.getSnapshot().values, body: "<p>My edits</p>" });
	view.rerender({ ...props, snapshot: { ...props.snapshot } });
	expect(draft.getSnapshot().values.body).toBe("<p>My edits</p>");
});

// a session: compose an email, then ask in chat to change the open one
function revisionTurn(
	thread: ReturnType<typeof setup>["base"]["thread"],
	openEmail: SubmittedThreadContext["openEmail"],
): ConversationMessage[] {
	return [
		{
			id: "first",
			role: "assistant",
			parts: [
				composeEmailPart(
					{
						to: "ryan@example.com",
						subject: "Test",
						message: "Hi Ryan",
					},
					"first-call",
				),
			],
		},
		{
			id: "ask",
			role: "user",
			parts: [
				{
					type: "text",
					text: threadCommand(
						{
							threadId: thread.id,
							contextRevision: "1",
							contextText: "{}",
							openEmail,
						},
						"make it friendlier",
					),
				},
			],
		},
		{
			id: "second",
			role: "assistant",
			parts: [
				composeEmailPart(
					{
						to: "ryan@example.com",
						subject: "Hello",
						message: "Hi Ryan, hope you are well",
						openEmailId: composeDraftId("first-call"),
					},
					"second-call",
				),
			],
		},
	];
}

it("updates the open editor in place when the assistant changes it", () => {
	const { completed, composer } = setup();
	const thread = { ...completed.thread, source: undefined };
	const messages = revisionTurn(thread, {
		id: composeDraftId("first-call"),
		to: "ryan@example.com",
		cc: "",
		subject: "Test",
		body: "Hi Ryan",
		bodyRevision: 0,
	});
	renderHook(useThreadDraftProposals, {
		initialProps: {
			...completed,
			thread,
			allowedSources: new Set<string>(),
			snapshot: {
				...completed.snapshot,
				turn: { ...completed.snapshot.turn, messages },
			},
		},
	});
	const drafts = composer.getSnapshot().emailDrafts;
	expect(drafts).toHaveLength(1);
	const { values } = drafts[0].getSnapshot();
	expect(values.subject).toBe("Hello");
	expect(values.body).toContain("hope you are well");
});

it("keeps the owner's edits when they typed while the assistant was writing", () => {
	const { base, completed, composer } = setup();
	const thread = { ...completed.thread, source: undefined };
	const props = {
		...completed,
		thread,
		allowedSources: new Set<string>(),
	};
	const first = revisionTurn(thread, undefined).slice(0, 1);
	const view = renderHook(useThreadDraftProposals, {
		initialProps: {
			...props,
			snapshot: {
				...completed.snapshot,
				turn: { ...completed.snapshot.turn, messages: first },
			},
		},
	});
	const [draft] = composer.getSnapshot().emailDrafts;
	const sentAt = draft.getSnapshot().bodyRevision;
	// the owner keeps typing after sending the request
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p>My own words</p>",
	});
	const messages = revisionTurn(thread, {
		id: draft.seed.id,
		to: "ryan@example.com",
		cc: "",
		subject: "Test",
		body: "Hi Ryan",
		bodyRevision: sentAt,
	});
	view.rerender({
		...props,
		snapshot: {
			...base.snapshot,
			turn: {
				...base.snapshot.turn,
				isRunning: true,
				messages: messages.slice(0, 2),
			},
		},
	});
	view.rerender({
		...props,
		snapshot: {
			...completed.snapshot,
			turn: {
				...completed.snapshot.turn,
				settlementVersion: 2,
				messages,
			},
		},
	});
	expect(draft.getSnapshot().values.body).toBe("<p>My own words</p>");
	expect(view.result.current).toContain("your edits were kept");
});

it("changes only the recipients of an open reply, and keeps them over the native defaults", () => {
	const { completed, composer } = setup();
	const reply = completed.snapshot.turn.messages[0];
	const change: ConversationMessage = {
		id: "change",
		role: "assistant",
		parts: [
			composeEmailPart(
				{
					replyTo: "email",
					to: "me@example.com, ryan@example.com",
					openEmailId: composeDraftId("compose-email"),
				},
				"change-call",
			),
		],
	};
	renderHook(useThreadDraftProposals, {
		initialProps: {
			...completed,
			snapshot: {
				...completed.snapshot,
				turn: { ...completed.snapshot.turn, messages: [reply, change] },
			},
		},
	});
	const [draft] = composer.getSnapshot().emailDrafts;
	expect(draft.getSnapshot().values.to).toBe(
		"me@example.com, ryan@example.com",
	);
	expect(draft.getSnapshot().values.body).toContain("Friday works.");
	draft.initializeReplyRecipients({ to: ["sender@example.com"], cc: [] });
	expect(draft.getSnapshot().values.to).toBe(
		"me@example.com, ryan@example.com",
	);
});
