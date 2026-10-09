import { createContext, useContext } from "react";
import type {
	MailCheck,
	MailSyncResult,
	PendingReviewCoverage,
} from "./live-state";

export interface WorkUpdatesStatus {
	isRefreshing: boolean;
	lastUpdated: string | null;
	error: string;
	/** Complete pending counts from the latest successful refresh; absent before coverage is known. */
	pendingCoverage?: PendingReviewCoverage | null;
	/** The newest mail sync on the server, read with each reload. */
	lastMailCheck: MailCheck | null;
	/** Re-read Brain and Work from the database (automatic, every 30 seconds and on focus). */
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
