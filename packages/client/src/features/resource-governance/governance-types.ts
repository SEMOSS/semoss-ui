import type { Engine, Project } from "@semoss/shared";
import {
	ALL_ENGINE_TYPES,
	ALL_PROJECT_TYPES,
	getEngineLabel,
	getProjectLabel,
} from "@/utility/catalog";

/** A type of project or engine that Resource Governance lists. */
export type GovernanceType =
	| {
			kind: "PROJECT";
			/** The project type, as the backend names it */
			type: Project["project_type"];
			/** Its name in the type dropdown */
			label: string;
	  }
	| {
			kind: "ENGINE";
			/** The engine type, as the backend names it */
			type: Engine["engine_type"];
			/** Its name in the type dropdown */
			label: string;
	  };

/** What the page calls a project or an engine, whatever its type. */
export const GOVERNANCE_NOUNS = {
	PROJECT: { singular: "project", plural: "projects" },
	ENGINE: { singular: "engine", plural: "engines" },
} as const satisfies Record<
	GovernanceType["kind"],
	{ singular: string; plural: string }
>;

/**
 * The types in the dropdown: every project type, insights included, then every
 * engine type.
 */
export const GOVERNANCE_TYPES: readonly GovernanceType[] = [
	...ALL_PROJECT_TYPES.map(
		(type): GovernanceType => ({
			kind: "PROJECT",
			type,
			label: getProjectLabel(type),
		}),
	),
	...ALL_ENGINE_TYPES.map(
		(type): GovernanceType => ({
			kind: "ENGINE",
			type,
			label: getEngineLabel(type),
		}),
	),
];

/**
 * A type from the page's address.
 *
 * @param type - The type in the address, such as MODEL.
 * @return Its entry, or undefined for a type the page does not list.
 */
export const findGovernanceType = (
	type: string | undefined,
): GovernanceType | undefined =>
	GOVERNANCE_TYPES.find((entry) => entry.type === type);
