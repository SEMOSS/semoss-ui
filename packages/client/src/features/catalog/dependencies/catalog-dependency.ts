import {
	Archive,
	Bolt,
	Bot,
	BrainIcon,
	Cpu,
	Database,
	DatabaseIcon,
	HardDriveIcon,
	LayersIcon,
	LayoutGrid,
	type LucideIcon,
	NotebookText,
	Puzzle,
	ShieldCheck,
	ShieldIcon,
	Sigma,
	SquareFunctionIcon,
	Workflow,
} from "lucide-react";
import type { CatalogDependency, CatalogType, Engine } from "@semoss/shared";
import { TYPE_TO_ROUTE } from "@/constants";
import { isProjectType } from "@/utility/catalog";

/** Whether a catalog type is an engine or a project. */
export type CatalogKind = "engine" | "project";

/** How the dependency views show and route one catalog type. */
export interface DependencyTypeConfig {
	/** Engine or project */
	readonly kind: CatalogKind;
	/** The catalog route an item of this type lives under */
	readonly route: string;
	/** Singular label, such as "Model" or "Agent" */
	readonly label: string;
	/** The type's catalog icon */
	readonly icon: LucideIcon;
}

/**
 * Every catalog type a dependency's owner or target can have. Typed with
 * `satisfies` over `CatalogType`, so a type the backend adds fails type-check
 * here rather than crashing a dependency row at runtime. The backend's
 * INSIGHTS spelling sits beside the UI's INSIGHT.
 */
export const DEPENDENCY_TYPE_CONFIG = {
	CODE: {
		kind: "project",
		route: TYPE_TO_ROUTE.CODE,
		label: "Code",
		icon: LayoutGrid,
	},
	BLOCKS: {
		kind: "project",
		route: TYPE_TO_ROUTE.BLOCKS,
		label: "Blocks",
		icon: LayoutGrid,
	},
	INSIGHT: {
		kind: "project",
		route: TYPE_TO_ROUTE.INSIGHT,
		label: "Insight",
		icon: LayoutGrid,
	},
	INSIGHTS: {
		kind: "project",
		route: TYPE_TO_ROUTE.INSIGHT,
		label: "Insight",
		icon: LayoutGrid,
	},
	SKILL: {
		kind: "project",
		route: TYPE_TO_ROUTE.SKILL,
		label: "Skill",
		icon: Puzzle,
	},
	NOTEBOOK: {
		kind: "project",
		route: TYPE_TO_ROUTE.NOTEBOOK,
		label: "Notebook",
		icon: NotebookText,
	},
	AUTOMATION: {
		kind: "project",
		route: TYPE_TO_ROUTE.AUTOMATION,
		label: "Automation",
		icon: Workflow,
	},
	WORKSPACE: {
		kind: "project",
		route: TYPE_TO_ROUTE.WORKSPACE,
		label: "Agent",
		icon: Bot,
	},
	FUNCTION: {
		kind: "engine",
		route: TYPE_TO_ROUTE.FUNCTION,
		label: "Function",
		icon: Sigma,
	},
	MODEL: {
		kind: "engine",
		route: TYPE_TO_ROUTE.MODEL,
		label: "Model",
		icon: Cpu,
	},
	DATABASE: {
		kind: "engine",
		route: TYPE_TO_ROUTE.DATABASE,
		label: "Database",
		icon: Database,
	},
	VECTOR: {
		kind: "engine",
		route: TYPE_TO_ROUTE.VECTOR,
		label: "Vector",
		icon: Bolt,
	},
	STORAGE: {
		kind: "engine",
		route: TYPE_TO_ROUTE.STORAGE,
		label: "Storage",
		icon: Archive,
	},
	GUARDRAIL: {
		kind: "engine",
		route: TYPE_TO_ROUTE.GUARDRAIL,
		label: "Guardrail",
		icon: ShieldCheck,
	},
} as const satisfies Record<CatalogType, DependencyTypeConfig>;

const isCatalogType = (type: string): type is CatalogType =>
	Object.hasOwn(DEPENDENCY_TYPE_CONFIG, type);

/**
 * How to show and route a dependency's type. A type the table does not know,
 * from a newer backend, falls back on whether it is a project type: projects
 * open in the app pages, which load any project.
 *
 * @param type - The dependency's specific type.
 * @returns Its config.
 */
export const getDependencyTypeConfig = (type: string): DependencyTypeConfig => {
	if (isCatalogType(type)) {
		return DEPENDENCY_TYPE_CONFIG[type];
	}
	return isProjectType(type)
		? {
				kind: "project",
				route: TYPE_TO_ROUTE.PROJECT,
				label: "Project",
				icon: LayoutGrid,
			}
		: { kind: "engine", route: "", label: type, icon: Database };
};

/** Display metadata for one engine category card. */
export interface CategoryMeta {
	/** Card title. */
	readonly label: string;
	/** One-line description under the title. */
	readonly blurb: string;
	/** Empty-state line when nothing of this category is selected. */
	readonly empty: string;
	/** Icon rendered in the card's tile. */
	readonly icon: LucideIcon;
}

/** Card copy and icons per engine category, for the engines panel. */
export const CATEGORY_META = {
	MODEL: {
		label: "Models",
		blurb: "Language and embedding models",
		empty: "No models selected",
		icon: BrainIcon,
	},
	DATABASE: {
		label: "Databases",
		blurb: "Relational and document databases",
		empty: "No databases selected",
		icon: DatabaseIcon,
	},
	STORAGE: {
		label: "Storage",
		blurb: "File and object storage",
		empty: "No storage engines selected",
		icon: HardDriveIcon,
	},
	VECTOR: {
		label: "Vector Databases",
		blurb: "Embedding and similarity search",
		empty: "No vector databases selected",
		icon: LayersIcon,
	},
	FUNCTION: {
		label: "Functions",
		blurb: "Reusable functions the agent can call",
		empty: "No functions selected",
		icon: SquareFunctionIcon,
	},
	GUARDRAIL: {
		label: "Guardrails",
		blurb: "Safety and policy checks",
		empty: "No guardrails selected",
		icon: ShieldIcon,
	},
} as const satisfies Record<Engine["engine_type"], CategoryMeta>;

/**
 * The `SetCatalogDependencies` payload entry for a dependency. The target's
 * specific type goes as it is; nothing is collapsed to a generic PROJECT.
 *
 * @param dependency - The dependency to serialize.
 * @returns The {id, type} wire entry.
 */
export const toCatalogDependencyPayload = (
	dependency: Pick<CatalogDependency, "catalog_id" | "catalog_type">,
): { id: string; type: CatalogType } => ({
	id: dependency.catalog_id,
	type: dependency.catalog_type,
});
