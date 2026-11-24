import type { Engine, Project } from "@semoss/shared";
import { getEngineLabel, getProjectLabel } from "@/utility/catalog";
import type { GrantTargetType } from "./grant-levels";

/** A type a type select offers */
export interface GrantTypeOption {
	/** The type: a project's type or an engine's catalog type */
	value: string;
	/** Its name */
	label: string;
}

/** A type select's choice of every type */
export const ALL_GRANT_TYPES = "ALL";

/**
 * The project types offered as grantees: the apps whose custom reactors use a
 * permission, and agents, whose runs do. An engine or project can give a
 * permission to a project of any type, and the tables list every one given.
 */
export const GRANTEE_PROJECT_TYPES: Project["project_type"][] = [
	"CODE",
	"BLOCKS",
	"WORKSPACE",
];

/**
 * The engine types offered as grantees: the engines whose own code calls other
 * engines, such as a vector database embedding with a model or a guardrail
 * asking its judge. Venv engines are left out, since engines use them with no
 * permission.
 */
export const GRANTEE_ENGINE_TYPES: Engine["engine_type"][] = [
	"MODEL",
	"VECTOR",
	"GUARDRAIL",
	"FUNCTION",
	"DATABASE",
	"STORAGE",
];

/**
 * @param types - project types
 * @returns each as a type select's option, with its name
 */
export const toProjectTypeOptions = (
	types: readonly Project["project_type"][],
): GrantTypeOption[] =>
	types.map((type) => ({ value: type, label: getProjectLabel(type) }));

/**
 * @param types - engine types
 * @returns each as a type select's option, with its name
 */
export const toEngineTypeOptions = (
	types: readonly Engine["engine_type"][],
): GrantTypeOption[] =>
	types.map((type) => ({ value: type, label: getEngineLabel(type) }));

/**
 * Names a type in the plural, in lower case, for a sentence such as "Only
 * admins can give access to models": apps for code, blocks and insight
 * projects, agents, skills, notebooks and automations, and each engine type.
 *
 * @param kind - whether the type is a project's or an engine's
 * @param type - the type, such as MODEL or SKILL
 * @returns the plural, or "projects" or "engines" for a type it does not know
 */
export const getTypePlural = (
	kind: GrantTargetType,
	type: string | null | undefined,
): string => {
	if (kind === "PROJECT") {
		switch (type) {
			case "CODE":
			case "BLOCKS":
			case "INSIGHT":
				return "apps";
			case "WORKSPACE":
				return "agents";
			case "SKILL":
				return "skills";
			case "NOTEBOOK":
				return "notebooks";
			case "AUTOMATION":
				return "automations";
			default:
				return "projects";
		}
	}
	switch (type) {
		case "DATABASE":
			return "databases";
		case "MODEL":
			return "models";
		case "STORAGE":
			return "storage engines";
		case "FUNCTION":
			return "functions";
		case "VECTOR":
			return "vector databases";
		case "GUARDRAIL":
			return "guardrails";
		default:
			return "engines";
	}
};
