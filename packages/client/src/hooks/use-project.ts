import { useContext } from "react";
import { ProjectContext, type ProjectContextType } from "@/contexts";

/**
 * Access the current Project Context
 * @returns the Project Context
 */
export function useProject(): ProjectContextType {
	const context = useContext(ProjectContext);
	if (context === undefined) {
		throw new Error("useProject must be used within ProjectProvider");
	}

	return context;
}
