/** What gives a permission: an engine, or a project such as a skill or an app */
export type GrantTargetType = "ENGINE" | "PROJECT";

/**
 * The levels an engine or a project gives an app, an agent or an engine, from
 * least to most access. None of them is ever an Author, so the target's
 * settings stay with its owners.
 */
export const GRANT_LEVELS = ["READ_ONLY", "EDIT"] as const;

/** A level an engine or a project gives an app, an agent or an engine */
export type GrantLevel = (typeof GRANT_LEVELS)[number];

/** The level a grantee starts with when it is given a permission */
export const DEFAULT_GRANT_LEVEL: GrantLevel = "READ_ONLY";

/**
 * What each level lets the one given it do, in the sentences a person reads
 * before picking a level
 */
const LEVEL_SENTENCES: Readonly<Record<GrantTargetType, string>> = {
	ENGINE: "Read-Only lets them read from the engine: query it, ask a model or embed with it, list and download its files, and search a vector database. Editor also lets them write to it, upload and delete its files and documents, and use its connection.",
	PROJECT:
		"Read-Only lets them read the project: its files, insights and reactors, such as an agent loading a skill.",
};

/**
 * What each level lets the one given it do, short enough for a table cell; a
 * project's Editor has none
 */
const LEVEL_SUMMARIES: Readonly<
	Record<GrantTargetType, Readonly<Partial<Record<GrantLevel, string>>>>
> = {
	ENGINE: {
		READ_ONLY: "Reads it: queries, asks or embeds, lists and searches",
		EDIT: "Reads and writes it, and uses its connection",
	},
	PROJECT: {
		READ_ONLY: "Reads its files, insights and reactors",
	},
};

/**
 * @param level - an access level, or a value picked in a select
 * @returns whether an engine or a project can give it
 */
export const isGrantLevel = (level: string): level is GrantLevel =>
	GRANT_LEVELS.some((option) => option === level);

/**
 * @param resourceType - what gives the permission
 * @returns what Read-Only and Editor let the one given them do there
 */
export const describeGrantLevels = (resourceType: GrantTargetType): string =>
	LEVEL_SENTENCES[resourceType];

/**
 * @param resourceType - what gives the permission
 * @param level - the level given
 * @returns what the level lets the one given it do there, or null for a level
 * a grantee is never given and for Editor on a project
 */
export const summarizeGrantLevel = (
	resourceType: GrantTargetType,
	level: string,
): string | null =>
	isGrantLevel(level) ? (LEVEL_SUMMARIES[resourceType][level] ?? null) : null;

/**
 * The word a page uses for an engine or project of a type: engine, app, agent,
 * skill, notebook, automation or project.
 *
 * @param resourceType - ENGINE or PROJECT
 * @param type - a project's type, such as SKILL; unused for an engine
 * @returns the word, in lower case
 */
export const getTargetNoun = (
	resourceType: GrantTargetType,
	type: string | null | undefined,
): string => {
	if (resourceType === "ENGINE") {
		return "engine";
	}
	switch (type) {
		case "WORKSPACE":
			return "agent";
		case "SKILL":
			return "skill";
		case "NOTEBOOK":
			return "notebook";
		case "AUTOMATION":
			return "automation";
		case "CODE":
		case "BLOCKS":
		case "INSIGHT":
			return "app";
		default:
			return "project";
	}
};
