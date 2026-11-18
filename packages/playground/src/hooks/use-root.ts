import { useContext } from "react";
import { RootContext } from "@/contexts";

/**
 * Get the root store.
 *
 * @deprecated Read the theme with `usePlaygroundTheme()` from
 * `@/hooks/use-playground-theme`. Kept until the playground's stores move off
 * MobX.
 */
export const useRoot = () => {
	const context = useContext(RootContext);

	if (!context) {
		throw new Error("useRoot must be used within a RootContext.Provider");
	}

	return context;
};
