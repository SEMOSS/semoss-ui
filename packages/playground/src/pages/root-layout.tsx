import { useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { RootContext } from "@/contexts";
import { RootStore } from "@/stores";

export const RootLayout = ({ children }) => {
	const { system } = useInsight();

	// set up the store
	const rootStore = useMemo(() => {
		if (system.config.theme) {
			const store = new RootStore();
			try {
				// initialize it with the new theme
				store.initialize(
					JSON.parse(String(system?.config?.theme?.THEME_MAP)),
				);
			} catch (_e) {}

			return store;
		}
		return null;
	}, [system.config.theme]);

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
