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
		if (system.config.theme) {
			const store = new RootStore();

			// parse the theme
			let theme: Partial<ThemeMap["playground"]> = {};
			try {
				theme = JSON.parse(
					String(system?.config?.theme?.THEME_MAP) || "{}",
				)?.playground;
			} catch (_e) {}

			// in dev, let theme.local.json sidebar override the backend sidebar
			if (import.meta.env.DEV) {
				try {
					const localSidebar = JSON.parse(
						import.meta.env.VITE_THEME || "{}",
					)?.playground?.sidebar;
					if (localSidebar) {
						theme = { ...theme, sidebar: localSidebar };
					}
				} catch (_e) {}
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
