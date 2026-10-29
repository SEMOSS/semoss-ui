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
}
export const WorkUpdatesContext = createContext<WorkUpdatesStatus | null>(null);

/** Isolated/sample surfaces have no background connection. */
export function useWorkUpdates(): WorkUpdatesStatus | null {
	return useContext(WorkUpdatesContext);
}
