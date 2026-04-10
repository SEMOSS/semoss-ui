import { useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { RootContext } from "@/contexts";
import { RootStore } from "@/stores";

export const RootLayout = ({ children }) => {
	const { system } = useInsight();

	// set up the store
	const rootStore = useMemo(() => {
		const store = new RootStore();

		// If theme.local.json is present, it takes full priority — skip server theme
		if (import.meta.env.VITE_HAS_LOCAL_THEME) {
			store.initialize({});
			return store;
		}

		if (system.config.theme) {
			// parse the theme
			let theme: Partial<ThemeMap["playground"]> = {};
			try {
				theme = JSON.parse(
					String(system?.config?.theme?.THEME_MAP) || "{}",
				)?.playground;
			} catch (_e) {}

			// Don't let the admin theme overwrite the local sidebar/tour config
			// (theme.local.json is applied first in the RootStore constructor)
			if (theme) {
				delete theme.sidebar;
				delete theme.tour;
			}

			store.initialize(theme);
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
