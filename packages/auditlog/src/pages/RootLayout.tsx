import { useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { RootContext } from "@/contexts";
import { RootStore } from "@/stores";

export const RootLayout = ({ children }) => {
	const _insight = useInsight();

	// set up the store
	const rootStore = useMemo(() => {
		const store = new RootStore();

		// initialize it with the new theme
		store.initialize({
			name: "Audit Log",
			description: "Audit log app",
		});
		return store;
	}, []);

	if (!rootStore.isInitialized) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<RootContext.Provider
			value={{
				root: rootStore,
			}}
		>
			{children}
		</RootContext.Provider>
	);
};
