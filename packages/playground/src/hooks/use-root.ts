import { useContext } from "react";
import { RootContext } from "@/contexts";

/**
 * Get the root store
 */
export const useRoot = () => {
	const context = useContext(RootContext);

	if (!context) {
		throw new Error("useRoot must be used within a RootContext.Provider");
	}

	return context;
};
