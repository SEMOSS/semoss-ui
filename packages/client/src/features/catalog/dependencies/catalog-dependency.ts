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
import type {
	CatalogDependency,
	CatalogDependencyRole,
	CatalogDependencyRow,
	CatalogType,
	Engine,
} from "@semoss/shared";
import type { CatalogDependencyPayload } from "@/api/catalog-dependencies";
import { getResourcePagePath, isProjectType } from "@/utility/catalog";
import type { TraverseDirection } from "./catalog-dependency-graph";

/** How the dependency views show one catalog type. */
interface DependencyTypeConfig {
	/** Engine or project */
	readonly kind: "ENGINE" | "PROJECT";
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
		kind: "PROJECT",
		label: "Code",
		icon: LayoutGrid,
	},
	BLOCKS: {
		kind: "PROJECT",
		label: "Blocks",
		icon: LayoutGrid,
	},
	INSIGHT: {
		kind: "PROJECT",
		label: "Insight",
		icon: LayoutGrid,
	},
	INSIGHTS: {
		kind: "PROJECT",
		label: "Insight",
		icon: LayoutGrid,
	},
	SKILL: {
		kind: "PROJECT",
		label: "Skill",
		icon: Puzzle,
	},
	NOTEBOOK: {
		kind: "PROJECT",
		label: "Notebook",
		icon: NotebookText,
	},
	AUTOMATION: {
		kind: "PROJECT",
		label: "Automation",
		icon: Workflow,
	},
	WORKSPACE: {
		kind: "PROJECT",
		label: "Agent",
		icon: Bot,
	},
	FUNCTION: {
		kind: "ENGINE",
		label: "Function",
		icon: Sigma,
	},
	MODEL: {
		kind: "ENGINE",
		label: "Model",
		icon: Cpu,
	},
	DATABASE: {
		kind: "ENGINE",
		label: "Database",
		icon: Database,
	},
	VECTOR: {
		kind: "ENGINE",
		label: "Vector",
		icon: Bolt,
	},
	STORAGE: {
		kind: "ENGINE",
		label: "Storage",
		icon: Archive,
	},
	GUARDRAIL: {
		kind: "ENGINE",
		label: "Guardrail",
		icon: ShieldCheck,
	},
} as const satisfies Record<CatalogType, DependencyTypeConfig>;

const isCatalogType = (type: string): type is CatalogType =>
	Object.hasOwn(DEPENDENCY_TYPE_CONFIG, type);

/**
 * How to show a dependency's type. A type the table does not know, from a
 * newer backend, falls back on whether it is a project type.
 *
 * @param type - The dependency's specific type.
 * @returns Its config.
 */
export const getDependencyTypeConfig = (type: string): DependencyTypeConfig => {
	if (isCatalogType(type)) {
		return DEPENDENCY_TYPE_CONFIG[type];
	}
	return isProjectType(type)
		? { kind: "PROJECT", label: "Project", icon: LayoutGrid }
		: { kind: "ENGINE", label: type, icon: Database };
};

/** Display metadata for one engine category card. */
interface CategoryMeta {
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
 * A short label per dependency role, for the role badge on a row. Typed with
 * `satisfies`, so a role the backend adds fails type-check here.
 */
export const DEPENDENCY_ROLE_LABELS = {
	AGENT_MODEL: "Agent Model",
	SUBAGENT: "Subagent",
	SKILL: "Skill",
	TOOLBOX: "Toolbox",
	KNOWLEDGE: "Knowledge",
	GUARDRAIL: "Guardrail",
	JUDGE_MODEL: "Judge Model",
	TOPIC_VECTOR: "Topic Vector",
	EMBEDDER: "Embedder",
	FUNCTION_STORAGE: "Function Storage",
	KEYWORD_ENGINE: "Keyword Engine",
	DOCUMENT_PROCESSOR: "Document Processor",
	PROXY_TARGET: "Proxy Target",
	IMAGE_MODEL: "Image Model",
	ROUTE_MODEL: "Route Model",
	ROUTER_CLASSIFIER: "Router Classifier",
	ROUTER_EMBEDDINGS: "Router Embeddings",
	ROUTER_FALLBACK: "Router Fallback",
	AUTOMATION_NODE: "Automation Node",
	BLOCK_ENGINE: "Block Engine",
	CODE_REFERENCE: "Code Reference",
	MANUAL: "Manual",
} as const satisfies Record<CatalogDependencyRole, string>;

const isDependencyRole = (role: string): role is CatalogDependencyRole =>
	Object.hasOwn(DEPENDENCY_ROLE_LABELS, role);

/**
 * The label of a dependency's role. A role from a newer backend shows as it is.
 *
 * @param role - The row's role.
 * @returns Its short label.
 */
export const getDependencyRoleLabel = (role: string): string =>
	isDependencyRole(role) ? DEPENDENCY_ROLE_LABELS[role] : role;

/**
 * The words for traversing from an item each way: the right-click menu's
 * entry to show it and to hide it, which the "+" on a card says too.
 */
export const TRAVERSE_LABELS = {
	UPSTREAM: { show: "Traverse Upstream", hide: "Hide Upstream" },
	DOWNSTREAM: { show: "Traverse Downstream", hide: "Hide Downstream" },
} as const satisfies Record<TraverseDirection, { show: string; hide: string }>;

/**
 * The sentence an automatic link shows when the backend wrote none: where it
 * comes from. One wording for every place on the Ontology tab.
 *
 * @param ownerType - The type of the item whose configuration records it.
 * @returns The sentence, without a full stop, as a description.
 */
export const describeAutomaticLink = (ownerType: string): string =>
	`Set by the ${getDependencyTypeConfig(ownerType).label.toLowerCase()}'s configuration`;

/** The roles an engine's SMSS sets, so the SMSS tab is where they change. */
const SMSS_ROLES: ReadonlySet<string> = new Set<CatalogDependencyRole>([
	"JUDGE_MODEL",
	"TOPIC_VECTOR",
	"EMBEDDER",
	"FUNCTION_STORAGE",
	"KEYWORD_ENGINE",
	"DOCUMENT_PROCESSOR",
	"PROXY_TARGET",
	"IMAGE_MODEL",
]);

/** The roles a Model Router's routing configuration sets. */
const ROUTER_ROLES: ReadonlySet<string> = new Set<CatalogDependencyRole>([
	"ROUTE_MODEL",
	"ROUTER_CLASSIFIER",
	"ROUTER_EMBEDDINGS",
	"ROUTER_FALLBACK",
]);

/** Where an automatic dependency is changed. */
interface ConfigurationPlace {
	/**
	 * What the place is called, after the owner's name: "SMSS", "Guardrails
	 * Settings", "Model Settings", "Settings", or a project's "Editor"
	 */
	readonly label: string;
	/** Its page, or null when the user has no page to go to */
	readonly path: string | null;
}

/**
 * Where the configuration that records an automatic dependency is edited, so
 * the link can say where to change it: an engine's SMSS tab, its Guardrails
 * or Model settings, or a project's own page for what its editor sets (an
 * agent's model and skills, an automation's steps, an app's blocks or code).
 *
 * @param role - The automatic link's role.
 * @param owner - The item that has the dependency.
 * @returns The place, with its page when it has one.
 */
export const getConfigurationPlace = (
	role: string,
	owner: {
		readonly kind: "ENGINE" | "PROJECT";
		readonly type: string;
		readonly id: string;
	},
): ConfigurationPlace => {
	const page = getResourcePagePath(owner.kind, owner.type, owner.id);
	if (owner.kind === "ENGINE") {
		if (role === "GUARDRAIL") {
			return {
				label: "Guardrails Settings",
				path: page ? `${page}/settings/guardrails` : null,
			};
		}
		if (ROUTER_ROLES.has(role)) {
			return {
				label: "Model Settings",
				path: page ? `${page}/settings/model` : null,
			};
		}
		if (SMSS_ROLES.has(role)) {
			return { label: "SMSS", path: page ? `${page}/smss` : null };
		}
		return { label: "Settings", path: page ? `${page}/settings` : null };
	}
	return { label: "Editor", path: page };
};

/**
 * A key for a dependency row. One target can be a dependency in two roles,
 * so the id alone is not unique.
 *
 * @param dependency - The row.
 * @returns Its id and role.
 */
export const getDependencyKey = (
	dependency: Pick<CatalogDependencyRow, "catalog_id" | "role">,
): string => `${dependency.catalog_id}:${dependency.role}`;

/**
 * The `SetCatalogDependencies` payload entry for a manual dependency. The
 * target's specific type goes as it is; nothing is collapsed to a generic
 * PROJECT. The name and description go only when set, trimmed. The backend
 * replaces only the manual rows, so automatic ones are never sent.
 *
 * @param dependency - The dependency to serialize.
 * @returns The wire entry.
 */
export const toCatalogDependencyPayload = (
	dependency: Pick<CatalogDependency, "catalog_id" | "catalog_type"> &
		Partial<
			Pick<
				CatalogDependencyRow,
				"dependency_name" | "dependency_description"
			>
		>,
): CatalogDependencyPayload => {
	const name = dependency.dependency_name?.trim();
	const description = dependency.dependency_description?.trim();
	return {
		id: dependency.catalog_id,
		type: dependency.catalog_type,
		...(name ? { name } : {}),
		...(description ? { description } : {}),
	};
};

/** An access level a user can hold on, or ask for, an engine or project. */
/** The access levels a user can hold on, or ask for, an engine or project, most first. */
export const ACCESS_LEVELS = ["OWNER", "EDIT", "READ_ONLY"] as const;

export type DependencyAccessLevel = (typeof ACCESS_LEVELS)[number];

/**
 * The words for each access level, shared by the dependency views and the
 * admin Dependency Map so both say the same thing.
 */
export const DEPENDENCY_ACCESS_LEVEL_LABELS = {
	OWNER: "Owner",
	EDIT: "Editor",
	READ_ONLY: "Read-Only",
} as const satisfies Record<DependencyAccessLevel, string>;

/** The backend's permission ids: 1 is owner, 2 editor and 3 read-only. */
const LEVEL_BY_PERMISSION_ID: Readonly<Record<number, DependencyAccessLevel>> =
	{ 1: "OWNER", 2: "EDIT", 3: "READ_ONLY" };

/**
 * The access level a backend permission id stands for.
 *
 * @param id - The permission id, such as an engine's `engine_user_permission`.
 * @returns The level, or undefined for none or an id it does not know.
 */
export const getAccessLevelForPermissionId = (
	id: number | undefined,
): DependencyAccessLevel | undefined =>
	id === undefined ? undefined : LEVEL_BY_PERMISSION_ID[id];

/**
 * The most access a user has, directly or through a team: the backend's ids
 * run from 1 (owner) to 3 (read-only), so the smallest wins. A team's level
 * can come as text.
 *
 * @param ids - The user's own level and their team's, either missing.
 * @returns The level, or undefined for none.
 */
export const getHighestAccessLevel = (
	...ids: readonly (number | string | null | undefined)[]
): DependencyAccessLevel | undefined => {
	let highest: number | undefined;
	for (const id of ids) {
		const value = Number(id);
		if (
			Number.isInteger(value) &&
			value > 0 &&
			(highest === undefined || value < highest)
		) {
			highest = value;
		}
	}
	return getAccessLevelForPermissionId(highest);
};

/**
 * The user's standing on one dependency:
 * - `granted`: they have a level, directly or through a team; `requested` is a
 *   different level they asked for and wait on
 * - `public`: anyone can use it
 * - `requested`: they have no access and asked for `level`
 * - `requestable`: they have no access and can ask for it (it is discoverable)
 * - `private`: they have no access and cannot see what it is
 */
export type DependencyAccess =
	| {
			readonly kind: "granted";
			readonly level: DependencyAccessLevel;
			readonly requested?: DependencyAccessLevel;
	  }
	| { readonly kind: "public" }
	| { readonly kind: "requested"; readonly level: DependencyAccessLevel }
	| { readonly kind: "requestable" }
	| { readonly kind: "private" };

type AccessFields = Pick<
	CatalogDependency,
	| "permission_name"
	| "catalog_global"
	| "catalog_discoverable"
	| "access_permission"
	| "is_private"
>;

const isAccessLevel = (role: unknown): role is DependencyAccessLevel =>
	ACCESS_LEVELS.some((level) => level === role);

/**
 * Whether a dependency is private to the user: no access, and neither public
 * nor discoverable. The backend says so with `is_private` and leaves out its
 * name; older backends are read from the access fields.
 *
 * @param dependency - The dependency.
 * @returns True when the user cannot see what it is.
 */
export const isPrivateDependency = (dependency: AccessFields): boolean =>
	dependency.is_private ??
	(!isAccessLevel(dependency.permission_name) &&
		!dependency.catalog_global &&
		!dependency.catalog_discoverable);

/**
 * The name to show for a dependency: "Private <Type>", such as "Private
 * Database", when it is private to the user, else its name, else its id.
 *
 * @param dependency - The dependency.
 * @returns Its display name.
 */
export const getDependencyDisplayName = (
	dependency: AccessFields &
		Pick<CatalogDependency, "catalog_id" | "catalog_type" | "catalog_name">,
): string =>
	isPrivateDependency(dependency)
		? `Private ${getDependencyTypeConfig(dependency.catalog_type).label}`
		: dependency.catalog_name || dependency.catalog_id;

/**
 * The user's standing on a dependency. A level they hold comes first, then
 * public, then a request that waits, then whether they can ask at all.
 *
 * @param dependency - The dependency.
 * @returns Its access.
 */
export const getDependencyAccess = (
	dependency: AccessFields,
): DependencyAccess => {
	const requested = getAccessLevelForPermissionId(
		dependency.access_permission,
	);
	if (isAccessLevel(dependency.permission_name)) {
		return requested && requested !== dependency.permission_name
			? { kind: "granted", level: dependency.permission_name, requested }
			: { kind: "granted", level: dependency.permission_name };
	}
	if (dependency.catalog_global) {
		return { kind: "public" };
	}
	if (requested) {
		return { kind: "requested", level: requested };
	}
	return isPrivateDependency(dependency)
		? { kind: "private" }
		: { kind: "requestable" };
};

/**
 * Whether the user can ask for access to a dependency here: they have no
 * level on it, it is not public, no request waits, and they can see it.
 *
 * @param access - The dependency's access.
 * @returns True when Request Access applies.
 */
export const canRequestDependency = (access: DependencyAccess): boolean =>
	access.kind === "requestable";

/**
 * Whether the user can use a dependency now: they have a level or it is public.
 *
 * @param access - The dependency's access.
 * @returns True when it works for them.
 */
export const canUseDependency = (access: DependencyAccess): boolean =>
	access.kind === "granted" || access.kind === "public";

/**
 * The short label of a dependency's access, such as "Editor", "Public",
 * "Requested Read-only", "Can request" (the user can see it and ask) or
 * "Hidden" (the user cannot see what it is, so cannot ask).
 *
 * @param access - The dependency's access.
 * @returns Its label.
 */
export const getDependencyAccessLabel = (access: DependencyAccess): string => {
	switch (access.kind) {
		case "granted":
			return DEPENDENCY_ACCESS_LEVEL_LABELS[access.level];
		case "public":
			return "Public";
		case "requested":
			return `Requested ${DEPENDENCY_ACCESS_LEVEL_LABELS[access.level]}`;
		case "requestable":
			return "Can Request";
		case "private":
			return "Hidden";
	}
};

/**
 * How visible a dependency is in the catalog: Public, Discoverable, or Private
 * (neither). These are the catalog's words for an item's visibility.
 *
 * @param dependency - The dependency.
 * @returns Its visibility label.
 */
export const getDependencyVisibilityLabel = (
	dependency: Pick<
		CatalogDependency,
		"catalog_global" | "catalog_discoverable"
	>,
): "Public" | "Discoverable" | "Private" =>
	dependency.catalog_global
		? "Public"
		: dependency.catalog_discoverable
			? "Discoverable"
			: "Private";
