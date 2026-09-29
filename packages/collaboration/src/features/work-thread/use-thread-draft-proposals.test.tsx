import { renderHook } from "@testing-library/react";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { ConversationMessage } from "@/features/messages/types/message";
import { threadCommand } from "@/features/thread-assistant/thread-context";
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
			{
				type: "text",
				text: '```semoss-email-draft\n{"sourceMessageId":"email","body":"Friday works."}\n```',
			},
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

it("reports malformed completed proposals without making an editor", () => {
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
							{
								type: "text",
								text: "```semoss-email-draft\n{}\n```",
							},
						],
					},
				],
			},
		},
	});
	expect(view.result.current).toContain("incomplete draft");
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
				{
					type: "text" as const,
					text: [
						"```semoss-email-draft",
						JSON.stringify({
							sourceMessageId: "email",
							body: `Version ${version}`,
						}),
						"```",
					].join("\n"),
				},
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
