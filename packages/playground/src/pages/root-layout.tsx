import { type PropsWithChildren, useMemo } from "react";
import { useInsight } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { RootContext } from "@/contexts/root-context";
import { RootStore } from "@/stores/root/root.store";

export const RootLayout = ({ children }: PropsWithChildren) => {
	const { system } = useInsight();

	// set up the store
	const rootStore = useMemo(() => {
		const store = new RootStore();
		let theme: Partial<ThemeMap["playground"]> = {};

		if (system?.config?.theme) {
			// parse the theme
			const rawTheme = system.config.theme.THEME_MAP || "{}";
			try {
				if (rawTheme) {
					const parsedTheme = JSON.parse(String(rawTheme));
					theme = parsedTheme?.playground || {};
				}
			} catch (_e) {}
		}
		// A deployment without a custom theme still uses the normal app defaults.
		void store.initialize(theme);

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
