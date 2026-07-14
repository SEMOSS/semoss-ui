import { type ReactNode, useState } from "react";
import { InsightProvider } from "@semoss/sdk/react";
import {
	type ConnectedEngine,
	EngineConnectContext,
} from "./engine-connect-context";

interface EngineConnectProviderProps {
	children: ReactNode;
}

/**
 * Wraps the whole /components/playground content tree in a real
 * InsightProvider — same ad hoc pattern packages/client's own
 * floating-terminal.tsx already uses, since this app has no root-level
 * InsightProvider. This is what lets ChatPanel/PromptOptimizer/EngineSelect/
 * McpMenuButton demos hit the real, already-authenticated backend live,
 * rather than being marked "not shown live here" the way the internal
 * sandbox does.
 */
export const EngineConnectProvider = ({
	children,
}: EngineConnectProviderProps) => {
	const [engine, setEngine] = useState<ConnectedEngine | null>(null);

	return (
		<InsightProvider>
			<EngineConnectContext.Provider value={{ engine, setEngine }}>
				{children}
			</EngineConnectContext.Provider>
		</InsightProvider>
	);
};
