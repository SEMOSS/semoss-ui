import { type PropsWithChildren, useMemo } from "react";
import { useStore } from "zustand";
import { useInsight } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { RootContext } from "@/contexts";
import { createRootStore } from "@/stores";

export const RootLayout = ({ children }: PropsWithChildren) => {
	const { system } = useInsight();

	const rootStore = useMemo(() => {
		const store = createRootStore();

		if (system?.config?.theme) {
			let theme: Partial<ThemeMap["playground"]> = {};
			const rawTheme = system.config.theme.THEME_MAP || null || "{}";
			try {
				if (rawTheme) {
					const parsedTheme = JSON.parse(String(rawTheme));
					theme = parsedTheme?.playground || {};
				}
			} catch (_e) {}
			store.getState().initialize(theme);
		}

		return store;
	}, [system.config.theme]);

	const isInitialized = useStore(rootStore, (s) => s.isInitialized);

	if (!isInitialized) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<RootContext.Provider value={rootStore}>
			{children}
		</RootContext.Provider>
	);
};
