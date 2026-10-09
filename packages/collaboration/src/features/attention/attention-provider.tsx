import type { ReactNode } from "react";
import { AttentionContext } from "./attention.context";
import { useAttentionState } from "./use-attention-state";

interface AttentionProviderProps {
	/** Authenticated account and deployment isolate browser-only priority preferences. */
	account: string;
	deployment: string;
	refreshRevision: number;
	children: ReactNode;
}

/** Mount inside the account-and-insight-keyed room source cache so pending data cannot cross owners. */
export function AttentionProvider({
	account,
	deployment,
	refreshRevision,
	children,
}: AttentionProviderProps) {
	const value = useAttentionState(account, deployment, refreshRevision);
	return (
		<AttentionContext.Provider value={value}>
			{children}
		</AttentionContext.Provider>
	);
}
