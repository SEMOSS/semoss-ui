import { type PropsWithChildren, useMemo } from "react";
import { useConfig } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";
import { RootContext } from "@/contexts/root-context";
import { RootStore } from "@/stores/root/root.store";

export const RootLayout = ({ children }: PropsWithChildren) => {
	// the server's THEME_MAP, already parsed; the playground reads its own part
	const playgroundTheme = useConfig((state) => state.theme?.playground);

	// set up the store
	const rootStore = useMemo(() => {
		const store = new RootStore();
		// the server's theme is trusted to match the playground's shape, as before
		const theme = (
			isRecord(playgroundTheme) ? playgroundTheme : {}
		) as Partial<ThemeMap["playground"]>;

		// A deployment without a custom theme still uses the normal app defaults.
		void store.initialize(theme);

		return store;
	}, [playgroundTheme]);

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
