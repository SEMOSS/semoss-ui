import { createContext, useContext } from "react";
import type { WorkspaceMessage } from "@/features/collaboration/state/collaboration.types";
import type { AgentEmailAttachment } from "@/features/connectors/api/agent-email-attachments";
import type { EmailDraftEditor } from "@/features/connectors/api/email-draft-editor";
import type { RoomSource } from "@/features/rooms/source-import/room-source";
import type { InsightActions } from "@/lib/pixel";
import type { RoomEmailStore } from "./room-email-store";

/** Email writes use the retained room's existing insight and transport. */
export interface RoomEmailSession {
	insight: { insightId: string; actions: InsightActions };
	retain: () => () => void;
	readEmailAttachment: (file: AgentEmailAttachment) => Promise<File>;
}

interface RoomEmailContextValue {
	store: RoomEmailStore;
	session: RoomEmailSession;
	source: RoomSource | null;
	sourceMessages: WorkspaceMessage[];
	isSourceLoading: boolean;
	sourceError: string | null;
	reloadSource: () => void;
	hasSourceEmail: boolean;
	openSource: (returnFocusId?: string) => void;
	selectSourceMessage: (messageId: string) => void;
	replyToSource: (messageId: string) => void;
	openDraft: (draftId: string) => void;
	requestSend: (draft: EmailDraftEditor) => void;
}

/** Optional email behavior beside the ordinary room transcript and workbench. */
export const RoomEmailContext = createContext<RoomEmailContextValue | null>(
	null,
);

/** Resolve the owning room instead of depending on a source-thread workspace. */
export function useRoomEmail(): RoomEmailContextValue {
	const value = useContext(RoomEmailContext);
	if (!value) throw new Error("Email panels require an open room.");
	return value;
}
