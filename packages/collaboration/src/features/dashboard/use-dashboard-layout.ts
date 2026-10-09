import { useMemo } from "react";
import {
	type DashboardPreferences,
	readDashboardPreferences,
} from "./dashboard-layout";

/** Read legacy preferences so previously pinned apps remain available in search. */
export function useDashboardLayout(storageKey: string): {
	preferences: DashboardPreferences;
	error: string;
} {
	return useMemo(() => readDashboardPreferences(storageKey), [storageKey]);
}
