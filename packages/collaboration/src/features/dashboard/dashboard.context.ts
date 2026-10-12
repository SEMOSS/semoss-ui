import { createContext, type RefObject, useContext } from "react";
import type { CalendarEvent } from "@/features/connectors/api/microsoft-schemas";
import type { InsightActions } from "@/lib/pixel";
import type { ChatHistory } from "./use-chat-history";
import type { useDashboardLayout } from "./use-dashboard-layout";
import type { VisibleResource } from "./use-visible-resource";

export interface SourceSelection {
	kind: "email" | "calendar";
	id: string;
}
export interface DashboardContextValue {
	actions: InsightActions;
	layout: ReturnType<typeof useDashboardLayout>;
	history: ChatHistory;
	calendar: VisibleResource<CalendarEvent[]>;
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
