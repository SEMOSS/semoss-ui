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

		if (system.config.theme) {
			// parse the theme
			let theme: Partial<ThemeMap["playground"]> = {};
			try {
				theme =
					JSON.parse(String(system?.config?.theme?.THEME_MAP) || "{}")
						?.playground ?? {};
			} catch (_e) {}

			store.initialize(theme);
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
