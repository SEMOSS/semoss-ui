import { createContext, createElement, type ReactNode } from "react";
import { useRequiredContext } from "@/app/use-required-context";
import type { Agent } from "@/features/agents/types/agent";

export interface AgentContext {
	agent: Agent;
	agentId: string;
	refresh: () => void;
}

const AgentContextValue = createContext<AgentContext | null>(null);

export function AgentProvider({
	value,
	children,
}: {
	value: AgentContext;
	children: ReactNode;
}) {
	return createElement(AgentContextValue.Provider, { value }, children);
}

export function useAgent() {
	return useRequiredContext(AgentContextValue, "useAgent");
}
