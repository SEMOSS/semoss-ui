import { useContext } from "react";
import { DashboardContext } from "@/contexts";

/**
 * Get the dashboard store
 */
export const useDashboard = () => {
	const context = useContext(DashboardContext);

	if (!context) {
		throw new Error(
			"useDashboard must be used within a DashboardContext.Provider",
		);
	}

	return context;
};
