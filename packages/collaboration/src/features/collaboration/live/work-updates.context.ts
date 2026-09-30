import { createContext, useContext } from "react";

export interface WorkUpdatesStatus {
	isRefreshing: boolean;
	lastUpdated: string | null;
	error: string;
	refresh: () => void;
}
export const WorkUpdatesContext = createContext<WorkUpdatesStatus | null>(null);

/** Isolated/sample surfaces have no background connection. */
export function useWorkUpdates(): WorkUpdatesStatus | null {
	return useContext(WorkUpdatesContext);
}
