import { createContext, useCallback, useContext, useEffect } from "react";
import type {
	MailCheck,
	MailSyncResult,
	PendingReviewCoverage,
	ResourceScope,
} from "./live-state";

export const COLLABORATION_SAVED = "collaboration:records-saved";
export interface ResourceStatus {
	isLoading: boolean;
	error: string;
	complete: boolean;
	checkedAt?: string;
	total?: number;
}
export interface WorkUpdatesStatus {
	resources?: Partial<Record<ResourceScope, ResourceStatus>>;
	loadResource?: (scope: ResourceScope, force?: boolean) => Promise<void>;

	isRefreshing: boolean;
	lastUpdated: string | null;
	error: string;
	/** Complete pending counts from the latest successful refresh; absent before coverage is known. */
	pendingCoverage?: PendingReviewCoverage | null;
	/** The newest mail sync on the server, read with each reload. */
	lastMailCheck: MailCheck | null;
	/** Explicitly refresh the shared topic directory. */
	refresh: () => void;
	isSyncing: boolean;
	/** Counts from the last finished mail sync in this page. */
	lastSync: MailSyncResult | null;
	syncError: string;
	/** Pull new mail from Microsoft 365, then reload. */
	syncMail: () => void;
	/** Coordinate scoped reads with the existing queue-backed saver. */
	settled?: () => Promise<void>;
	localId?: (serverId: string) => string;
	serverId?: (localId: string) => string;
}
export const WorkUpdatesContext = createContext<WorkUpdatesStatus | null>(null);

/** Isolated/sample surfaces have no background connection. */
export function useWorkUpdates(): WorkUpdatesStatus | null {
	return useContext(WorkUpdatesContext);
}

/** Request a resource once per account; mounted pages share the same read and cached result. */
export function useCollaborationResource(scope: ResourceScope, enabled = true) {
	const updates = useWorkUpdates();
	const load = updates?.loadResource;
	useEffect(() => {
		if (enabled) void load?.(scope);
	}, [load, scope, enabled]);
	const refresh = useCallback(() => {
		void load?.(scope, true);
	}, [load, scope]);
	const resource = updates?.resources?.[scope];
	return {
		...resource,
		isLoading:
			enabled && Boolean(load) && (!resource || resource.isLoading),
		error: resource?.error ?? "",
		complete: !load || resource?.complete === true,
		refresh,
	};
}
