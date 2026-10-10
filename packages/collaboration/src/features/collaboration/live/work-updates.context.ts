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
	isSyncing: boolean;
	/** Counts from the last finished mail sync in this page. */
	lastSync: MailSyncResult | null;
	syncError: string;
	/** Pull new mail from Microsoft 365, then reload. */
	syncMail: () => void;
}
export const WorkUpdatesContext = createContext<WorkUpdatesStatus | null>(null);

/** Isolated/sample surfaces have no background connection. */
export function useWorkUpdates(): WorkUpdatesStatus | null {
	return useContext(WorkUpdatesContext);
}
