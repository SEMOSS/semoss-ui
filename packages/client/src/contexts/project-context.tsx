import { createContext } from "react";
import type { Project, ProjectDependency, Role } from "@semoss/shared";

export type ProjectContextType = {
	appId: string;
	project: Project;
	permission: Role;
	dependencies: ProjectDependency[];
	tags: string[];
	refresh: () => Promise<void>;
};

export const ProjectContext = createContext<ProjectContextType | undefined>(
	undefined,
);
