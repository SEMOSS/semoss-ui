import { renderHook } from "@testing-library/react";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { ConversationMessage } from "@/features/messages/types/message";
import { composeEmailPart } from "@/features/thread-assistant/compose-email.test-fixtures";
import {
	type SubmittedThreadContext,
	threadCommand,
} from "@/features/thread-assistant/thread-context";
import { composeDraftId } from "@/features/thread-assistant/thread-draft-proposal";
import { idleEmailTurn } from "./room-email.test-fixtures";
import { RoomEmailStore } from "./room-email-store";
import { useRoomEmailProposals } from "./use-room-email-proposals";

function setup() {
	const thread = {
		...createInitialCollaborationState().threads[0],
		source: {
			kind: "outlook" as const,
			nativeId: "email",
			folder: "inbox",
		},
	};
	const composer = new RoomEmailStore();
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
		snapshot: { turn: idleEmailTurn() },
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

it("adds files from all completed compose calls to the open email without replacing edits", async () => {
	const { base, completed, composer } = setup();
	composer.requestEmailDraft({
		id: "open-email",
		mode: "new",
		to: "recipient@example.com",
		body: "My edits",
	});
	const files = ["hello.txt", "notes.txt"].map((name, index) => ({
		path: `.email-attachments/file-${index}/${name}`,
		name,
		size: 5,
		sha256: "a".repeat(64),
	}));
	const loadAttachment = vi.fn(
		async (file: { name: string }) => new File(["hello"], file.name),
	);
	const props = {
		...completed,
		loadAttachment,
		snapshot: {
			...completed.snapshot,
			turn: {
				...completed.snapshot.turn,
				messages: [
					{
						id: "answer-files",
						role: "assistant" as const,
						parts: files.map((file, index) =>
							composeEmailPart(
								{
									openEmailId: "open-email",
									attachments: [file.name],
								},
								`compose-files-${index}`,
								"COMPLETED",
								{ shown: true, attachments: [file] },
							),
						),
					},
				],
			},
		},
	};
	const view = renderHook(useRoomEmailProposals, { initialProps: props });
	await vi.waitFor(() =>
		expect(
			composer.getSnapshot().emailDrafts[0]?.getSnapshot().values.files,
		).toHaveLength(2),
	);
	expect(
		composer.getSnapshot().emailDrafts[0]?.getSnapshot().values.body,
	).toContain("My edits");
	view.rerender({ ...props, snapshot: { ...props.snapshot } });
	expect(loadAttachment).toHaveBeenCalledTimes(2);
	view.unmount();
	const failed = renderHook(useRoomEmailProposals, {
		initialProps: {
			...base,
			loadAttachment,
			snapshot: {
				...props.snapshot,
				turn: {
					...props.snapshot.turn,
					phase: "failed",
					messages: [
						{ id: "user", role: "user", parts: [] },
						...props.snapshot.turn.messages,
					],
				},
			},
		},
	});
	expect(loadAttachment).toHaveBeenCalledTimes(2);
	failed.unmount();
});

it("retains a completed proposal without activating it and preserves edits through reconciliation", () => {
	const { base, completed, composer } = setup();
	const view = renderHook(useRoomEmailProposals, { initialProps: base });
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
	expect(composer.openEmailContext()).toBeUndefined();
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p>My edited reply</p>",
	});
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
	expect(composer.openEmailContext()).toBeUndefined();
});

it("restores history and background results without reopening the workbench", () => {
	const { completed, composer } = setup();
	renderHook(useRoomEmailProposals, { initialProps: completed });
	expect(composer.getSnapshot().emailDrafts).toHaveLength(1);
	expect(composer.openEmailContext()).toBeUndefined();
});

it("does not create a proposal for an excluded source", () => {
	const { completed, composer } = setup();
	renderHook(useRoomEmailProposals, {
		initialProps: { ...completed, allowedSources: new Set<string>() },
	});
	expect(composer.getSnapshot().emailDrafts).toEqual([]);
});

it("opens a new email from a session with no source email", () => {
	const { completed, composer } = setup();
	const session = { ...completed.thread, source: undefined };
	renderHook(useRoomEmailProposals, {
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

it("waits for settlement when durable output arrives during generation", () => {
	const { base, completed, composer } = setup();
	const view = renderHook(useRoomEmailProposals, { initialProps: base });
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
	expect(composer.openEmailContext()).toBeUndefined();
});

it.each(["cancelled", "failed"] as const)(
	"does not create editors from %s output",
	(phase) => {
		const { base, completed, composer } = setup();
		const view = renderHook(useRoomEmailProposals, {
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
		expect(composer.openEmailContext()).toBeUndefined();
	},
);

it("ignores a ComposeEmail call without an email", () => {
	const { base, completed, composer } = setup();
	const view = renderHook(useRoomEmailProposals, { initialProps: base });
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
	renderHook(useRoomEmailProposals, {
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
	renderHook(useRoomEmailProposals, {
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
	const view = renderHook(useRoomEmailProposals, {
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

it("preserves edits when a revision finishes after leaving the room and never replays it", () => {
	const { completed, composer } = setup();
	const thread = { ...completed.thread, source: undefined };
	const draft = composer.requestEmailDraft({
		id: composeDraftId("first-call"),
		mode: "new",
		body: "Hi Ryan",
	});
	const messages = revisionTurn(thread, {
		id: draft.seed.id,
		to: "ryan@example.com",
		cc: "",
		subject: "Test",
		body: "Hi Ryan",
		bodyRevision: 0,
	});
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p>My later edits</p>",
	});
	const props = {
		...completed,
		thread,
		snapshot: { turn: { ...completed.snapshot.turn, messages } },
	};
	const view = renderHook(useRoomEmailProposals, { initialProps: props });
	expect(draft.getSnapshot().values.body).toBe("<p>My later edits</p>");
	expect(view.result.current).toContain("your edits were kept");
	view.unmount();
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p>Still mine</p>",
	});
	renderHook(useRoomEmailProposals, { initialProps: props });
	expect(draft.getSnapshot().values.body).toBe("<p>Still mine</p>");
});

it("does not turn a revision for a missing editor into a new email", () => {
	const { completed, composer } = setup();
	const turn = {
		...completed.snapshot.turn,
		messages: [
			{
				id: "answer",
				role: "assistant" as const,
				parts: [
					composeEmailPart({
						openEmailId: "missing",
						to: "recipient@example.com",
						message: "Replacement",
					}),
				],
			},
		],
	};
	renderHook(useRoomEmailProposals, {
		initialProps: { ...completed, snapshot: { turn } },
	});
	expect(composer.getSnapshot().emailDrafts).toHaveLength(0);
});

it("reviews a completed revision before a paused send, without hydrating unrelated output", () => {
	const { completed, composer } = setup();
	const thread = { ...completed.thread, source: undefined };
	const draftId = composeDraftId("first-call");
	const messages = revisionTurn(thread, {
		id: draftId,
		to: "ryan@example.com",
		cc: "",
		subject: "Test",
		body: "Hi Ryan",
		bodyRevision: 0,
	});
	const last = messages[2];
	last.runStatus = "INPUT_REQUIRED";
	last.parts.push(
		composeEmailPart(
			{ to: "other@example.com", message: "Unrelated" },
			"unrelated",
		),
	);
	last.parts.push({
		type: "tool",
		tool: {
			id: "send",
			parentMessageId: last.id,
			name: "SendEmail",
			title: "Send email",
			status: "INPUT_REQUIRED",
			arguments: { openEmailId: draftId },
			metadata: { SMSS_MCP_UI: { component: "email-send" } },
		},
	});
	const turn = {
		...completed.snapshot.turn,
		phase: "awaiting_approval" as const,
		isRunning: true,
		messages,
		pendingApprovals: [
			{
				toolId: "send",
				parentMessageId: last.id,
				toolName: "SendEmail",
				arguments: { openEmailId: draftId },
			},
		],
	};
	renderHook(useRoomEmailProposals, {
		initialProps: { ...completed, thread, snapshot: { turn } },
	});
	expect(composer.getSnapshot().emailDrafts).toHaveLength(1);
	expect(
		composer.getSnapshot().emailDrafts[0].getSnapshot().values.body,
	).toContain("hope you are well");
	expect(composer.openEmailContext()).toBeUndefined();
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
	renderHook(useRoomEmailProposals, {
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

it.each(["new", "reply"] as const)(
	"applies explicit empty envelope fields to an open %s while preserving omitted fields",
	(mode) => {
		const { completed, composer } = setup();
		composer.requestEmailDraft({
			id: "open-email",
			mode,
			sourceUid: mode === "reply" ? "email" : undefined,
			to: "recipient@example.com",
			cc: "copy@example.com",
			bcc: "private@example.com",
			subject: "Original subject",
			body: "My message",
		});
		const [draft] = composer.getSnapshot().emailDrafts;
		draft.initializeReplyRecipients({ to: ["sender@example.com"], cc: [] });
		const props = (fields: Record<string, unknown>, toolId: string) => ({
			...completed,
			snapshot: {
				...completed.snapshot,
				turn: {
					...completed.snapshot.turn,
					messages: [
						{
							id: "change",
							role: "assistant" as const,
							parts: [
								composeEmailPart(
									{
										openEmailId: "open-email",
										...(mode === "reply"
											? { replyTo: "email" }
											: {}),
										...fields,
									},
									toolId,
								),
							],
						},
					],
				},
			},
		});
		const view = renderHook(useRoomEmailProposals, {
			initialProps: props({ message: "Revised message" }, "body-change"),
		});
		expect(draft.getSnapshot().values).toMatchObject({
			to: "recipient@example.com",
			cc: "copy@example.com",
			bcc: "private@example.com",
			subject: "Original subject",
		});
		view.rerender(
			props(
				{ to: "", cc: "", bcc: "", subject: "", message: "  \n" },
				"clear-envelope",
			),
		);
		expect(draft.getSnapshot().values).toMatchObject({
			to: "",
			cc: "",
			bcc: mode === "reply" ? "private@example.com" : "",
			subject: mode === "reply" ? "Original subject" : "",
			body: "<p>Revised message</p>",
		});
		view.unmount();
	},
);

it("opens a forward of the thread's email, with no note needed", () => {
	const { completed, composer } = setup();
	const forward = {
		...completed.snapshot.turn.messages[0],
		parts: [composeEmailPart({ forward: "email", to: "me@example.com" })],
	};
	renderHook(useRoomEmailProposals, {
		initialProps: {
			...completed,
			snapshot: {
				...completed.snapshot,
				turn: { ...completed.snapshot.turn, messages: [forward] },
			},
		},
	});
	const [draft] = composer.getSnapshot().emailDrafts;
	expect(draft.seed).toMatchObject({
		mode: "forward",
		sourceUid: "email",
		to: "me@example.com",
		body: "",
	});
	composer.requestEmailDraft(draft.seed);
	expect(composer.openEmailContext()).toMatchObject({ forward: "email" });
});
