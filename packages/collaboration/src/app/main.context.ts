import {
	createContext,
	createElement,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react";
import type { RefreshKeys } from "@/app/refresh-keys";
import { useRequiredContext } from "@/app/use-required-context";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";

export interface MainContext {
	/** Local query versions, incremented when a resource needs refetching. */
	keys: RefreshKeys;
	/** Increment one resource's query version. */
	refresh: (key: string) => void;
	/** @deprecated Data ownership is being moved to feature-local queries. */
	agents: Agent[];
	/** @deprecated Data ownership is being moved to feature-local queries. */
	sessions: Session[];
	setSessions: Dispatch<SetStateAction<Session[]>>;
	updateRoom: (id: string, changes: Partial<Session>) => void;
	pinRoom: (id: string, pinned: boolean) => Promise<void>;
	/** Save using the route's workspace id when editing, even before the list loads. */
	saveAgent: (
		agent: Agent,
		skillIds?: string[],
		workspaceId?: string,
	) => Promise<string>;
	openRoom: (id: string, itemId?: string) => void;
	newRoom: (agentId?: string) => void;
}

const MainContextValue = createContext<MainContext | null>(null);

export function MainProvider({
	value,
	children,
}: {
	value: MainContext;
	children: ReactNode;
}) {
	return createElement(MainContextValue.Provider, { value }, children);
}

export function useMain() {
	return useRequiredContext(MainContextValue, "useMain");
}
