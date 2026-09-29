import type { ComposerDraft } from "@/features/rooms/components/room-composer.types";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { OutlookReplySession } from "./outlook-reply-session";
import type { ThreadComposerMode } from "./thread-composer-controls";

interface WorkComposerSnapshot {
	mode: ThreadComposerMode | null;
	draft: ComposerDraft;
	selected: string[];
	revision: number;
	isSubmitting: boolean;
	error: string;
}

/** App-lifetime editor state; independent of the bounded cache of backend insights. */
export class WorkComposerSession {
	private snapshot: WorkComposerSnapshot = {
		mode: null,
		draft: { document: null, text: "", files: [] },
		selected: [],
		revision: 0,
		isSubmitting: false,
		error: "",
	};
	private listeners = new Set<() => void>();
	private replies = new Map<string | undefined, OutlookReplySession>();
	private reconciled = new WeakMap<ThreadSession, number>();

	getSnapshot = (): WorkComposerSnapshot => this.snapshot;
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	private update(patch: Partial<WorkComposerSnapshot>): void {
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}
	setMode = (mode: ThreadComposerMode): void => {
		if (!this.snapshot.isSubmitting && this.snapshot.mode !== mode)
			this.update({ mode });
	};
	setSelected = (selected: string[]): void => {
		this.update({ selected });
	};
	setDraft = (revision: number, draft: ComposerDraft): void => {
		// A detached editor must never restore content cleared by a completed request.
		if (revision === this.snapshot.revision && !this.snapshot.isSubmitting)
			this.update({ draft });
	};
	getReply = (sourceUid?: string): OutlookReplySession => {
		let reply = this.replies.get(sourceUid);
		if (!reply) {
			reply = new OutlookReplySession(sourceUid);
			this.replies.set(sourceUid, reply);
		}
		return reply;
	};
	private clear(): void {
		this.update({
			draft: { document: null, text: "", files: [] },
			selected: [],
			revision: this.snapshot.revision + 1,
			error: "",
		});
	}
	/** Clear only when the existing chat reconciliation confirms a previously uncertain submit. */
	reconcile = (session: ThreadSession, resetKey: number): void => {
		const previous = this.reconciled.get(session) ?? 0;
		this.reconciled.set(session, resetKey);
		if (resetKey > previous) this.clear();
	};
	/** Keep content and errors here even when the initiating route unmounts. */
	async submit(operation: () => Promise<void>): Promise<void> {
		if (this.snapshot.isSubmitting)
			throw new Error("Your message is already being submitted.");
		this.update({ isSubmitting: true, error: "" });
		try {
			await operation();
			this.clear();
		} catch (cause) {
			this.update({
				error:
					cause instanceof Error
						? cause.message
						: "Your message could not be submitted.",
			});
			throw cause;
		} finally {
			this.update({ isSubmitting: false });
		}
	}
}
