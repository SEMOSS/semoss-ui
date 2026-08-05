import { createContext } from "react";
import type { Project, ProjectDependency, Role } from "@semoss/shared";

export type ProjectContextType = {
	/** Type of the project */
	type: Project["project_type"];

	/** Catalog information */
	catalog: {
		/** Name of the catalog */
		name: string;

		/** Path to the catalog */
		path: string;
	};

	project: Project;
	permission: Role;
	dependencies: ProjectDependency[];
	refresh: () => void;
};

export const ProjectContext = createContext<ProjectContextType | undefined>(
	undefined,
);
