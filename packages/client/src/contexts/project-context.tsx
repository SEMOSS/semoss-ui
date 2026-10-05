import { createContext } from "react";
import type { Role } from "@semoss/sdk";
import type { Project, ProjectDependency } from "@semoss/shared";

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

	/** Merges fields into the loaded project without reloading it */
	update: (values: Partial<Project>) => void;
};

export const ProjectContext = createContext<ProjectContextType | undefined>(
	undefined,
);
