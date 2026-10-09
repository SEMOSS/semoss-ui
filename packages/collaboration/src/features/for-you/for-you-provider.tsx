import type { ReactNode } from "react";
import { ForYouContext } from "./for-you.context";
import { useForYouState } from "./use-for-you-state";

interface ForYouProviderProps {
	/** Authenticated account and deployment isolate browser-only priority preferences. */
	account: string;
	deployment: string;
	refreshRevision: number;
	children: ReactNode;
}

/** Mount inside the account-and-insight-keyed room source cache so pending data cannot cross owners. */
export function ForYouProvider({
	account,
	deployment,
	refreshRevision,
	children,
}: ForYouProviderProps) {
	const value = useForYouState(account, deployment, refreshRevision);
	return (
		<ForYouContext.Provider value={value}>
			{children}
		</ForYouContext.Provider>
	);
}
