import type {
	ModelUsageLimit,
	PermissionBatch,
	PermissionBatchValidation,
} from "@semoss/sdk";
import type { Engine, Project } from "@semoss/shared";
import type { GrantLevel } from "@/features/grants/grant-levels";
import {
	GRANTEE_ENGINE_TYPES,
	GRANTEE_PROJECT_TYPES,
	type GrantTypeOption,
	toEngineTypeOptions,
	toProjectTypeOptions,
} from "@/features/grants/grant-types";
import { toAddGranteesBatch } from "@/features/grants/grants";
import type { PickedResource } from "@/features/grants/picked-resource";
import { ALL_ENGINE_TYPES, ALL_PROJECT_TYPES } from "@/utility/catalog";

/** How many permissions the page shows at a time */
export const GRANTS_PAGE_SIZE = 25;

/** The engine types the page shares and filters by: every engine type */
export const SHARED_ENGINE_TYPES: Engine["engine_type"][] = [
	...ALL_ENGINE_TYPES,
];

/**
 * The project types the page shares and filters by: apps, agents, skills,
 * notebooks and automations, every project type but insight projects
 */
export const SHARED_PROJECT_TYPES: Project["project_type"][] =
	ALL_PROJECT_TYPES.filter((type) => type !== "INSIGHT");

/** One side of a kind of access: the projects or the engines on it */
export type GrantSide =
	| {
			/** Projects, such as apps, agents and skills */
			kind: "PROJECT";
			/** What the side is called, such as "App or Agent" */
			noun: string;
			/** The project types it offers */
			types: readonly Project["project_type"][];
			/** The same types, as a type select's options */
			typeOptions: readonly GrantTypeOption[];
	  }
	| {
			/** Engines */
			kind: "ENGINE";
			/** What the side is called, such as "Engine" */
			noun: string;
			/** The engine types it offers */
			types: readonly Engine["engine_type"][];
			/** The same types, as a type select's options */
			typeOptions: readonly GrantTypeOption[];
	  };

/** A kind of access: which kind of resource uses which */
export interface GrantKind {
	/** Its key */
	id:
		| "PROJECTS_USE_PROJECTS"
		| "PROJECTS_USE_ENGINES"
		| "ENGINES_USE_ENGINES";
	/** Its section's title, such as "Apps and Agents That Use Projects" */
	title: string;
	/** What it covers, with an example */
	description: string;
	/** The apps, agents or engines that get access */
	grantee: GrantSide;
	/** The engines or projects that are shared */
	target: GrantSide;
}

/** The apps and agents that get access, the projects whose runs or reactors use a permission */
const APPS_AND_AGENTS: GrantSide = {
	kind: "PROJECT",
	noun: "App or Agent",
	types: GRANTEE_PROJECT_TYPES,
	typeOptions: toProjectTypeOptions(GRANTEE_PROJECT_TYPES),
};

/** Any project, as what is shared */
const PROJECTS: GrantSide = {
	kind: "PROJECT",
	noun: "Project",
	types: SHARED_PROJECT_TYPES,
	typeOptions: toProjectTypeOptions(SHARED_PROJECT_TYPES),
};

/** Any engine, as what is shared */
const ENGINES: GrantSide = {
	kind: "ENGINE",
	noun: "Engine",
	types: SHARED_ENGINE_TYPES,
	typeOptions: toEngineTypeOptions(SHARED_ENGINE_TYPES),
};

/**
 * The kinds of access, one for each pair of kinds an app, agent or engine and
 * what it uses can be: apps and agents using projects, apps and agents using
 * engines, and engines using engines. The page lists each in its own section,
 * and Add Access gives one kind at a time, so its pickers offer only that
 * kind's types.
 */
export const GRANT_KINDS: readonly GrantKind[] = [
	{
		id: "PROJECTS_USE_PROJECTS",
		title: "Apps and Agents That Use Projects",
		description:
			"Projects an app's custom reactors or an agent's runs can use, such as a skill given to an agent.",
		grantee: APPS_AND_AGENTS,
		target: PROJECTS,
	},
	{
		id: "PROJECTS_USE_ENGINES",
		title: "Apps and Agents That Use Engines",
		description:
			"Engines an app's custom reactors or an agent's runs can use, such as a database an app writes to.",
		grantee: APPS_AND_AGENTS,
		target: ENGINES,
	},
	{
		id: "ENGINES_USE_ENGINES",
		title: "Engines That Use Engines",
		description:
			"Engines another engine's own code can use, such as the model a vector database embeds with.",
		grantee: {
			kind: "ENGINE",
			noun: "Engine",
			types: GRANTEE_ENGINE_TYPES,
			typeOptions: toEngineTypeOptions(GRANTEE_ENGINE_TYPES),
		},
		target: ENGINES,
	},
];

/** A pair the Add dialog leaves out, and why */
export interface LeftOutPair {
	/** The engine or project that would give the permission */
	target: PickedResource;
	/** The app, agent or engine that would be given it */
	grantee: PickedResource;
	/** Why it is left out */
	reason: string;
}

/** The batches the Add dialog saves, and the pairs it leaves out */
export interface GrantBatches {
	/** One batch for each target, with a change for each one given access */
	batches: PermissionBatch[];
	/** The pairs left out, and why */
	leftOut: LeftOutPair[];
}

/**
 * @param target - an engine or project that would give a permission
 * @param grantee - an app, agent or engine that would be given it
 * @returns why the pair cannot be given, or null when it can
 */
const findPairProblem = (
	target: PickedResource,
	grantee: PickedResource,
): string | null => {
	if (
		grantee.resourceType === target.resourceType &&
		grantee.id === target.id
	) {
		return "Nothing is given a permission on itself";
	}
	if (
		target.resourceType === "PROJECT" &&
		grantee.resourceType === "ENGINE"
	) {
		return "Engines are given access on engines only";
	}
	return null;
};

/**
 * Builds the permission batches that give every picked app, agent or engine
 * the level on every picked engine and project, one batch for each target, as
 * a target can be in only one. A model's grants carry the usage limit; nothing
 * else's does. Left out, with the reason: a target paired with itself, and an
 * engine paired with a project, since engines are given access on engines only.
 *
 * @param targets - the engines and projects that give the permission
 * @param grantees - the apps, agents and engines given it
 * @param level - the level each one gets
 * @param usageLimit - the limit each one gets on each model, or null for no limit defined
 * @returns the batches and the pairs left out
 */
export const toGrantBatches = (
	targets: readonly PickedResource[],
	grantees: readonly PickedResource[],
	level: GrantLevel,
	usageLimit: ModelUsageLimit | null,
): GrantBatches => {
	const batches: PermissionBatch[] = [];
	const leftOut: LeftOutPair[] = [];
	for (const target of targets) {
		const kept = grantees.filter((grantee) => {
			const reason = findPairProblem(target, grantee);
			if (reason) {
				leftOut.push({ target, grantee, reason });
			}
			return reason === null;
		});
		if (kept.length > 0) {
			batches.push(
				toAddGranteesBatch(
					target,
					kept,
					level,
					target.type === "MODEL" ? usageLimit : null,
				),
			);
		}
	}
	return { batches, leftOut };
};

/** One change the backend refused, named for the person reading the dialog */
export interface RefusedPair {
	/** The engine or project */
	targetName: string;
	/** The app, agent or engine */
	granteeName: string;
	/** The backend's reason */
	reason: string;
}

/**
 * Names each change the backend refused while validating the batches, by the
 * names of its target and the one it gives access, so the dialog can say which
 * pairs to take off. A batch refused as a whole refuses each of its changes.
 *
 * @param batches - the batches validated
 * @param validations - what validating them found, one result per batch in order
 * @param targets - the engines and projects picked
 * @param grantees - the apps, agents and engines picked
 * @returns the refused pairs, empty when every change can be made
 */
export const findRefusedPairs = (
	batches: readonly PermissionBatch[],
	validations: readonly PermissionBatchValidation[],
	targets: readonly PickedResource[],
	grantees: readonly PickedResource[],
): RefusedPair[] => {
	const nameOfTarget = (resourceType: string, id: string): string =>
		targets.find(
			(target) =>
				target.resourceType === resourceType && target.id === id,
		)?.name ?? id;
	const nameOfGrantee = (type: string, id: string): string =>
		grantees.find((grantee) => grantee.type === type && grantee.id === id)
			?.name ?? id;
	return batches.flatMap((batch, batchIndex) => {
		const validation = validations[batchIndex];
		const targetName = nameOfTarget(
			batch.target.resourceType,
			batch.target.id,
		);
		return batch.changes.flatMap((change, changeIndex) => {
			if (change.subject.category !== "ENGINE") {
				return [];
			}
			const result = validation?.changes.find(
				(entry) => entry.index === changeIndex,
			);
			const reason =
				validation?.reason ??
				(result && !result.allowed
					? (result.reason ?? "This change cannot be made")
					: null);
			return reason
				? [
						{
							targetName,
							granteeName: nameOfGrantee(
								change.subject.type,
								change.subject.id,
							),
							reason,
						},
					]
				: [];
		});
	});
};
