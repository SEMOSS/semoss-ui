import { useMemo, useSyncExternalStore } from "react";
import type { SavedEmailDraft } from "@/features/connectors/types";
import type { InsightActions } from "@/lib/pixel";
import { OutlookReplySession } from "./outlook-reply-session";

interface OutlookReplyDraft {
	isSaving: boolean;
	isUncertain: boolean;
	isSent: boolean;
	uncertainAction: "save" | "send" | null;
	saved: SavedEmailDraft | null;
	save: (body: string, format?: "text" | "html") => Promise<void>;
	send: (body: string, format?: "text" | "html") => Promise<void>;
	allowRetry: () => void;
}

/** Subscribe to a retained transaction, or own one for standalone composer consumers. */
export function useOutlookReplyDraft(
	actions: InsightActions,
	sourceUid?: string,
	retained?: OutlookReplySession,
): OutlookReplyDraft {
	const session = useMemo(
		() => retained ?? new OutlookReplySession(sourceUid),
		[retained, sourceUid],
	);
	const snapshot = useSyncExternalStore(
		session.subscribe,
		session.getSnapshot,
		session.getSnapshot,
	);
	return {
		...snapshot,
		allowRetry: session.allowRetry,
		save: (body, format = "text") =>
			session.submit(actions, body, format, false),
		send: (body, format = "text") =>
			session.submit(actions, body, format, true),
	};
}
