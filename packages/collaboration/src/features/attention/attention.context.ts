import { createContext, useContext } from "react";
import type { useAgentAttention } from "@/features/dashboard/use-agent-attention";
import type { AttentionItem, Priority } from "./attention.model";

export interface AttentionState {
	items: AttentionItem[];
	isLoading: boolean;
	isComplete: boolean;
	errors: string[];
	refresh: () => void;
	setPriority: (
		item: Exclude<AttentionItem, { kind: "work" }>,
		priority: Priority,
	) => void;
	agentAttention: ReturnType<typeof useAgentAttention>;
}

export const AttentionContext = createContext<AttentionState | null>(null);

/** Read the shell-owned pending collection; consumers never start their own polling. */
export function useAttention(): AttentionState {
	const value = useContext(AttentionContext);
	if (!value) throw new Error("useAttention requires AttentionProvider");
	return value;
}
