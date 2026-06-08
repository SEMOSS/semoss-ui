import { type PropsWithChildren, useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { RootContext } from "@/contexts";
import { RootStore } from "@/stores";

export const RootLayout = ({ children }: PropsWithChildren) => {
	const { system } = useInsight();

	// set up the store
	const rootStore = useMemo(() => {
		const store = new RootStore();

		if (system?.config?.theme) {
			// parse the theme
			let theme: Partial<ThemeMap["playground"]> = {};

			const rawTheme = system.config.theme.THEME_MAP || null || "{}";
			try {
				if (rawTheme) {
					const parsedTheme = JSON.parse(String(rawTheme));
					theme = parsedTheme?.playground || {};
				}
			} catch (_e) {}

			store.initialize(theme);

			// Local-only: re-apply local overrides from theme.local.json so they
			// win over the backend theme. See CLAUDE.md.
			const LOCAL_THEME_RAW = import.meta.env.VITE_THEME;
			if (LOCAL_THEME_RAW) {
				try {
					const localTheme = JSON.parse(LOCAL_THEME_RAW) as Partial<
						ThemeMap["playground"]
					>;
					store.initialize(localTheme);
				} catch (_e) {}
			}

			return store;
		}

		return store;
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
