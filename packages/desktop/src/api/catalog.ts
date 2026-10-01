import type {
	CatalogItem,
	DesktopInstanceProfile,
	InstanceConfig,
} from "@/types";
import { runPixel } from "./pixel";

export type CatalogKind =
	| "apps"
	| "models"
	| "vectors"
	| "databases"
	| "functions";

interface ProjectResponse {
	project_id: string;
	project_name: string;
	project_display_name?: string;
	project_type?: string;
	project_permission?: string;
	project_favorite?: number;
	description?: string;
}

interface EngineResponse {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_type: string;
	engine_subtype?: string;
	engine_favorite?: number;
	description?: string;
}

const engineTypeByKind: Record<Exclude<CatalogKind, "apps">, string> = {
	models: "MODEL",
	vectors: "VECTOR",
	databases: "DATABASE",
	functions: "FUNCTION",
};

export const fetchCatalog = async (
	profile: DesktopInstanceProfile,
	config: InstanceConfig,
	kind: CatalogKind,
): Promise<CatalogItem[]> => {
	if (kind === "apps") {
		const projectTypes = Array.isArray(config.projectTypes)
			? config.projectTypes.filter(
					(value): value is string => typeof value === "string",
				)
			: [];
		const { output: projects } = await runPixel<ProjectResponse[]>(
			profile,
			config,
			`MyProjects(metaKeys=["description"], metaFilters=[{}], filterWord=[""], sort=[{"PROJECTNAME":"ASC"}], projectType=${JSON.stringify(projectTypes)}, limit=[100], offset=[0]);`,
		);
		return projects.map((project) => ({
			id: project.project_id,
			name:
				project.project_display_name ||
				project.project_name ||
				project.project_id,
			type: project.project_type || "APP",
			subtype: project.project_permission,
			description: project.description,
			favorite: Boolean(project.project_favorite),
		}));
	}

	const engineType = engineTypeByKind[kind];
	const { output: engines } = await runPixel<EngineResponse[]>(
		profile,
		config,
		`MyEngines(metaKeys=["description"], metaFilters=[{}], engineTypes=['${engineType}'], sort=[{"ENGINENAME":"ASC"}], userT=[true], limit=[100], offset=[0]);`,
	);
	return engines.map((engine) => ({
		id: engine.engine_id,
		name:
			engine.engine_display_name ||
			engine.engine_name ||
			engine.engine_id,
		type: engine.engine_type,
		subtype: engine.engine_subtype,
		description: engine.description,
		favorite: Boolean(engine.engine_favorite),
	}));
};
