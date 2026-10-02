import type { ConversationMessage } from "@/features/messages/types/message";
import type { ComposerSubmission } from "@/features/rooms/types/room";
import { composeEmailPart } from "@/features/thread-assistant/compose-email.test-fixtures";
import {
	type SubmittedThreadContext,
	threadCommand,
} from "@/features/thread-assistant/thread-context";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { workSnapshot } from "./work-thread.test-fixtures";

/** Hold initialization until a test explicitly releases the connection. */
export function pendingDraftInitialization(): {
	promise: Promise<void>;
	resolve: () => void;
} {
	let resolve = () => {};
	const promise = new Promise<void>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

/** In-memory transport: no agent or Outlook request leaves the test. */
export function draftTransport() {
	let snapshot = workSnapshot();
	const listeners = new Set<() => void>();
	const publish = (next: typeof snapshot): void => {
		snapshot = next;
		for (const listener of listeners) listener();
	};
	const release = vi.fn();
	const initialize = vi.fn(async () => undefined);
	const send = vi.fn(
		async (
			_title: string,
			context: SubmittedThreadContext,
			submission: ComposerSubmission,
		) => {
			publish({
				...snapshot,
				turn: {
					...snapshot.turn,
					phase: "streaming",
					isRunning: true,
					messages: [
						...snapshot.turn.messages,
						{
							id: `user-${context.emailDraft?.requestId}`,
							role: "user",
							parts: [
								{
									type: "text",
									text: threadCommand(
										context,
										submission.text,
									),
								},
							],
						},
					],
				},
			});
		},
	);
	const session = {
		getSnapshot: () => snapshot,
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		retain: () => release,
		initialize,
		send,
		cancel: vi.fn(async () => {
			publish({
				...snapshot,
				turn: {
					...snapshot.turn,
					isRunning: false,
					phase: "cancelled",
					settlementVersion: snapshot.turn.settlementVersion + 1,
				},
			});
		}),
		reconnect: vi.fn(),
		allowNewRoom: vi.fn(),
		insight: { actions: {} },
	} as unknown as ThreadSession;
	// a string is the assistant's prose; an object is its ComposeEmail arguments
	const complete = (
		response: string | Record<string, unknown> = {
			replyTo: "email",
			message: "Friday works.",
		},
	): void => {
		const answer: ConversationMessage = {
			id: `answer-${snapshot.turn.messages.length}`,
			role: "assistant",
			parts: [
				typeof response === "string"
					? { type: "text", text: response }
					: composeEmailPart(response),
			],
		};
		publish({
			...snapshot,
			turn: {
				...snapshot.turn,
				isRunning: false,
				phase: "completed",
				settlementVersion: snapshot.turn.settlementVersion + 1,
				messages: [...snapshot.turn.messages, answer],
			},
		});
	};
	return { session, initialize, send, release, publish, complete, listeners };
}
