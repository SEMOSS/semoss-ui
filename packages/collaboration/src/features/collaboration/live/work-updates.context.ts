import { createContext, useContext } from "react";
import type { MailCheck, MailSyncResult } from "./live-state";

export interface WorkUpdatesStatus {
	isRefreshing: boolean;
	lastUpdated: string | null;
	error: string;
	/** The newest mail sync on the server, read with each reload. */
	lastMailCheck: MailCheck | null;
	/** Re-read Brain and Work from the database (on focus, and while a sync or its summaries finish). */
	refresh: () => void;
	/** Re-read a goal after its assistant approval without replacing open editors. */
	refreshTopicGoal: (
		topic: { topicId?: string; topic?: string },
		noteId: string,
	) => void;
	isSyncing: boolean;
	/** Counts from the last finished mail sync in this page. */
	lastSync: MailSyncResult | null;
	syncError: string;
	/** Pull new mail from Microsoft 365, then reload. */
	syncMail: () => void;
	/** The id the server knows a record by, after this page's queued saves (a topic made here starts local). */
	serverId: (id: string) => Promise<string>;
	/** The id this page knows a record by, for an id the server sent; the reverse of `serverId`. */
	localId: (serverId: string) => string;
}
export const WorkUpdatesContext = createContext<WorkUpdatesStatus | null>(null);

/** Isolated/sample surfaces have no background connection. */
export function useWorkUpdates(): WorkUpdatesStatus | null {
	return useContext(WorkUpdatesContext);
}

const sameId = (id: string): string => id;
const sameServerId = async (id: string): Promise<string> => id;

/**
 * Both directions between the ids this page keeps (a record made here keeps its local id for the session) and
 * the ids the server knows; without a live connection every id is the same on both sides.
 */
export function useRecordIds(): Pick<
	WorkUpdatesStatus,
	"serverId" | "localId"
> {
	const updates = useWorkUpdates();
	return {
		serverId: updates?.serverId ?? sameServerId,
		localId: updates?.localId ?? sameId,
	};
}
