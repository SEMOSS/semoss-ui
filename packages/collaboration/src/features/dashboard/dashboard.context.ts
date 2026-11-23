import { createContext, type RefObject, useContext } from "react";
import type { CalendarEvent } from "@/features/connectors/api/microsoft-schemas";
import type { TwinUpdates } from "@/features/digital-twin/api/twin-updates";
import type { InsightActions } from "@/lib/pixel";
import type { ChatHistory } from "./use-chat-history";
import type { useDashboardLayout } from "./use-dashboard-layout";
import type { VisibleResource } from "./use-visible-resource";

export interface SourceSelection {
	kind: "email" | "calendar";
	id: string;
}
interface DashboardContextValue {
	actions: InsightActions;
	layout: ReturnType<typeof useDashboardLayout>;
	history: ChatHistory;
	calendar: VisibleResource<CalendarEvent[]>;
	/**
	 * What a check found in the owner's Digital Twins and waits for them: one
	 * read for the sidebar's count, Today's line, the twins' cards and each
	 * twin's Updates place, so they agree. Whoever changes it refreshes it.
	 */
	twinUpdates: VisibleResource<TwinUpdates>;
	refreshSources: () => void;
	refreshRevision: number;
	isSearchOpen: boolean;
	setIsSearchOpen: (open: boolean) => void;
	searchReturnFocus: RefObject<HTMLElement | null>;
	sourceReturnFocus: RefObject<HTMLElement | null>;
	source: SourceSelection | null;
	setSource: (source: SourceSelection | null) => void;
	openRoom: (roomId: string) => Promise<void>;
	openingRoom: string | null;
}

export const DashboardContext = createContext<DashboardContextValue | null>(
	null,
);

/** All dashboard consumers share a single set of source reads and saved preferences. */
export function useDashboard(): DashboardContextValue {
	const value = useContext(DashboardContext);
	if (!value) throw new Error("DashboardProvider is required");
	return value;
}

/** Seen where no dashboard is around the caller (isolated surfaces): nothing waits, and nothing is read. */
const NO_TWIN_UPDATES: VisibleResource<TwinUpdates> = {
	data: null,
	error: "",
	isLoading: false,
	checkedAt: null,
	refresh: () => undefined,
};

/** What a check found in the owner's Digital Twins and waits for them: the shell's one read of it. */
export function useTwinUpdates(): VisibleResource<TwinUpdates> {
	return useContext(DashboardContext)?.twinUpdates ?? NO_TWIN_UPDATES;
}
