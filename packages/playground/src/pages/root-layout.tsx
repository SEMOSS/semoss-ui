import { type PropsWithChildren, useMemo } from "react";
import { useConfig } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";
import { RootContext } from "@/contexts/root.context";
import { RootStore } from "@/host/root.store";

export const RootLayout = ({ children }: PropsWithChildren) => {
	// the server's THEME_MAP, already parsed by the SDK's config store
	const serverTheme = useConfig((state) => state.theme);

	// set up the store
	const rootStore = useMemo(() => {
		const store = new RootStore();
		const theme = isRecord(serverTheme?.playground)
			? (serverTheme.playground as Partial<ThemeMap["playground"]>)
			: {};
		// A deployment without a custom theme still uses the normal app defaults.
		void store.initialize(theme);

		return store;
	}, [serverTheme]);

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
