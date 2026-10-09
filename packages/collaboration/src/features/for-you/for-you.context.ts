import { createContext, useContext } from "react";
import type { useAgentAttention } from "@/features/dashboard/use-agent-attention";
import type { ForYouItem, Priority } from "./for-you.model";

export interface ForYouState {
	items: ForYouItem[];
	isLoading: boolean;
	isComplete: boolean;
	errors: string[];
	refresh: () => void;
	setPriority: (item: ForYouItem, priority: Priority) => void;
	agentAttention: ReturnType<typeof useAgentAttention>;
}

export const ForYouContext = createContext<ForYouState | null>(null);

/** Read the shell-owned pending collection; consumers never start their own polling. */
export function useForYou(): ForYouState {
	const value = useContext(ForYouContext);
	if (!value) throw new Error("useForYou requires ForYouProvider");
	return value;
}
