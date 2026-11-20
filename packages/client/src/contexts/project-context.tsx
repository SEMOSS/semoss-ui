import { createContext } from "react";
import type { Role } from "@semoss/sdk";
import type { CatalogDependencyRow, Project } from "@semoss/shared";

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
	/**
	 * The project's direct dependencies, automatic and manual, one row per
	 * target and role (see `useCatalogDependencies`)
	 */
	dependencies: CatalogDependencyRow[];
	/** Reads the project, its permission and its dependencies again */
	refresh: () => void;
	/**
	 * Reads only the project's dependencies again, keeping the rows already
	 * read until the new ones arrive, so the page stays mounted
	 */
	refreshDependencies: () => void;

	/** Merges fields into the loaded project without reloading it */
	update: (values: Partial<Project>) => void;
};

export const ProjectContext = createContext<ProjectContextType | undefined>(
	undefined,
);
