import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogDependencyRow,
	CatalogType,
} from "@semoss/shared";
import type { CatalogDependencyPayload } from "@/api/catalog-dependencies";
import {
	getDependencyDisplayName,
	toCatalogDependencyPayload,
} from "./catalog-dependency";
import type { CatalogGraphNode } from "./catalog-dependency-graph";

/** The longest name a manual dependency can have. */
export const NAME_LIMIT = 255;

/** What a name past the limit reads. */
export const NAME_LIMIT_MESSAGE = `Use ${NAME_LIMIT} characters or fewer`;

/** What a name another link of the same owner has reads. */
export const NAME_TAKEN_MESSAGE = "Another dependency already has this name";

/** One manual dependency while its owner's dependencies are edited. */
export interface DraftLink {
	/** The target's id */
	readonly catalog_id: string;
	/** The target's specific type */
	readonly catalog_type: CatalogType;
	/** The target's name as the user sees it */
	readonly catalog_name: string;
	/** An engine's subtype */
	readonly catalog_subtype?: string;
	/** The user's level on a target added in this edit, as the picker read it */
	readonly permission_name?: CatalogDependency["permission_name"];
	/** Whether a target added in this edit is public */
	readonly catalog_global?: boolean;
	/** Whether a target added in this edit is discoverable */
	readonly catalog_discoverable?: boolean;
	/**
	 * The link's name, unique per owner. Required for a link added or edited
	 * here; a link saved before names were required can have none, as empty
	 */
	readonly dependency_name: string;
	/** What the link is for; empty for none */
	readonly dependency_description: string;
	/** Whether it was added in this edit */
	readonly isNew: boolean;
	/** Whether it is to be removed on save; kept until then, so it can be undone */
	readonly isRemoved: boolean;
}

/** The owner's manual dependencies while they are edited. */
export interface DependencyDraft {
	/** One link per target, in the order they were added */
	readonly links: readonly DraftLink[];
}

/** A target to add, as the picker offers it, with the user's access to it. */
export type DependencyOption = Pick<
	CatalogDependency,
	| "catalog_id"
	| "catalog_name"
	| "catalog_type"
	| "catalog_subtype"
	| "permission_name"
	| "catalog_global"
	| "catalog_discoverable"
>;

/** What a user gives a manual link: its name and description. */
export type DraftLinkFields = Pick<
	DraftLink,
	"dependency_name" | "dependency_description"
>;

/**
 * A draft of an owner's manual dependencies, from the rows as saved. A
 * private target keeps its id, so a save never drops it.
 *
 * @param rows - The owner's manual rows.
 * @returns The draft.
 */
export const createDependencyDraft = (
	rows: readonly CatalogDependencyRow[],
): DependencyDraft => ({
	links: rows
		.filter((row) => !row.is_automatic)
		.map((row) => ({
			catalog_id: row.catalog_id,
			catalog_type: row.catalog_type,
			catalog_name: getDependencyDisplayName(row),
			catalog_subtype: row.catalog_subtype,
			dependency_name: row.dependency_name ?? "",
			dependency_description: row.dependency_description ?? "",
			isNew: false,
			isRemoved: false,
		})),
});

/**
 * Adds a target with its name and description. One already in the draft is
 * left as it is; one marked for removal is brought back with them.
 *
 * @param draft - The draft.
 * @param target - The target.
 * @param fields - The link's name and description.
 * @returns The new draft.
 */
export const addToDraft = (
	draft: DependencyDraft,
	target: DependencyOption,
	fields: DraftLinkFields,
): DependencyDraft => {
	const existing = draft.links.find(
		(link) => link.catalog_id === target.catalog_id,
	);
	if (existing) {
		return existing.isRemoved
			? updateDraftLink(
					restoreInDraft(draft, target.catalog_id),
					target.catalog_id,
					fields,
				)
			: draft;
	}
	return {
		links: [
			...draft.links,
			{
				catalog_id: target.catalog_id,
				catalog_type: target.catalog_type,
				catalog_name: target.catalog_name || target.catalog_id,
				catalog_subtype: target.catalog_subtype,
				permission_name: target.permission_name,
				catalog_global: target.catalog_global,
				catalog_discoverable: target.catalog_discoverable,
				...fields,
				isNew: true,
				isRemoved: false,
			},
		],
	};
};

/**
 * Removes a target: one added in this edit goes at once; a saved one is
 * marked, and goes on save, so it can be undone until then.
 *
 * @param draft - The draft.
 * @param id - The target's id.
 * @returns The new draft.
 */
export const removeFromDraft = (
	draft: DependencyDraft,
	id: string,
): DependencyDraft => ({
	links: draft.links.flatMap((link) =>
		link.catalog_id !== id
			? [link]
			: link.isNew
				? []
				: [{ ...link, isRemoved: true }],
	),
});

/**
 * Brings back a target marked for removal.
 *
 * @param draft - The draft.
 * @param id - The target's id.
 * @returns The new draft.
 */
export const restoreInDraft = (
	draft: DependencyDraft,
	id: string,
): DependencyDraft => ({
	links: draft.links.map((link) =>
		link.catalog_id === id ? { ...link, isRemoved: false } : link,
	),
});

/**
 * Changes a link's name or description.
 *
 * @param draft - The draft.
 * @param id - The target's id.
 * @param change - The new name, description or both.
 * @returns The new draft.
 */
export const updateDraftLink = (
	draft: DependencyDraft,
	id: string,
	change: Partial<DraftLinkFields>,
): DependencyDraft => ({
	links: draft.links.map((link) =>
		link.catalog_id === id ? { ...link, ...change } : link,
	),
});

/**
 * A name for a manual link made where no one types one, such as an engine
 * picked in the Code workbench's Engines panel: the target's name, or the
 * name with " 2", " 3" and so on after it when another link has it, kept to
 * the name limit. A name is required, and unique per owner ignoring case.
 *
 * @param base - The name to start from, such as the target's name.
 * @param takenNames - The names in use, trimmed and in lower case.
 * @returns A name no other link has.
 */
export const getUniqueDependencyName = (
	base: string,
	takenNames: readonly string[],
): string => {
	const start = base.trim().slice(0, NAME_LIMIT) || "Dependency";
	const taken = new Set(takenNames);
	if (!taken.has(start.toLowerCase())) {
		return start;
	}
	for (let count = 2; ; count += 1) {
		const suffix = ` ${count}`;
		const name = `${start.slice(0, NAME_LIMIT - suffix.length)}${suffix}`;
		if (!taken.has(name.toLowerCase())) {
			return name;
		}
	}
};

/**
 * The form a dependency name is compared in: trimmed and in lower case, so a
 * repeat is found ignoring case and spaces at the ends, as the backend does.
 *
 * @param name - The name; empty for none.
 * @returns The name to compare.
 */
export const normalizeDependencyName = (
	name: string | null | undefined,
): string => (name ?? "").trim().toLowerCase();

/**
 * The names a set of links has, to check a name against: each normalized,
 * leaving out empty names, links marked for removal, and one link's own.
 *
 * @param links - The links, such as a draft's or an owner's saved rows.
 * @param exceptId - The target whose own name is left out.
 * @returns The names in use.
 */
export const collectTakenNames = (
	links: Iterable<{
		readonly catalog_id: string;
		readonly dependency_name?: string | null;
		readonly isRemoved?: boolean;
	}>,
	exceptId?: string,
): string[] =>
	[...links].flatMap((link) => {
		const name = normalizeDependencyName(link.dependency_name);
		return link.isRemoved || link.catalog_id === exceptId || !name
			? []
			: [name];
	});

/**
 * What is wrong with a manual dependency's name, if anything: too long, or
 * one another link has. An empty name is not checked here; the link dialog
 * asks for one.
 *
 * @param name - The name, as typed.
 * @param isTaken - Whether another link has a name, given normalized.
 * @returns The problem's message, or undefined when the name will do.
 */
export const getDependencyNameProblem = (
	name: string,
	isTaken: (normalized: string) => boolean,
): string | undefined => {
	const trimmed = name.trim();
	if (trimmed.length > NAME_LIMIT) {
		return NAME_LIMIT_MESSAGE;
	}
	return trimmed && isTaken(normalizeDependencyName(trimmed))
		? NAME_TAKEN_MESSAGE
		: undefined;
};

/**
 * What stops the draft being saved, by target: a name another link has
 * (ignoring case and spaces at the ends), or one too long. Links marked for
 * removal are not checked. Each name is counted once.
 *
 * @param draft - The draft.
 * @returns Each problem's message, by target id; empty when it can be saved.
 */
export const validateDependencyDraft = (
	draft: DependencyDraft,
): ReadonlyMap<string, string> => {
	const counts = new Map<string, number>();
	for (const name of collectTakenNames(draft.links)) {
		counts.set(name, (counts.get(name) ?? 0) + 1);
	}
	const problems = new Map<string, string>();
	for (const link of draft.links) {
		if (link.isRemoved) {
			continue;
		}
		// a name counted more than once is another link's too
		const problem = getDependencyNameProblem(
			link.dependency_name,
			(name) => (counts.get(name) ?? 0) > 1,
		);
		if (problem) {
			problems.set(link.catalog_id, problem);
		}
	}
	return problems;
};

/**
 * The changes the draft holds against the rows as saved, one per link, in
 * words for the change count's tooltip: each target added (with its name),
 * each removed, and each saved link whose name or description changed.
 *
 * @param draft - The draft.
 * @param saved - The owner's manual rows as saved.
 * @returns One sentence per change, in the draft's order.
 */
export const listDraftChanges = (
	draft: DependencyDraft,
	saved: readonly CatalogDependencyRow[],
): string[] => {
	const savedById = new Map(
		saved
			.filter((row) => !row.is_automatic)
			.map((row) => [row.catalog_id, row]),
	);
	return draft.links.flatMap((link) => {
		const name = link.dependency_name.trim();
		if (link.isNew) {
			return [
				name
					? `Added ${link.catalog_name} as ${name}`
					: `Added ${link.catalog_name}`,
			];
		}
		if (link.isRemoved) {
			return [`Removed ${link.catalog_name}`];
		}
		const row = savedById.get(link.catalog_id);
		if (!row) {
			return [];
		}
		const edits = [
			(row.dependency_name ?? "") !== name
				? name
					? `renamed to ${name}`
					: "name cleared"
				: null,
			(row.dependency_description ?? "") !==
			link.dependency_description.trim()
				? "description changed"
				: null,
		].filter((edit): edit is string => edit !== null);
		return edits.length > 0
			? [`${link.catalog_name}: ${edits.join(", ")}`]
			: [];
	});
};

/**
 * The save payload: every link not marked for removal, each with its name and
 * description trimmed and left out when empty.
 *
 * @param draft - The draft.
 * @returns The `SetCatalogDependencies` entries.
 */
export const toDraftPayload = (
	draft: DependencyDraft,
): CatalogDependencyPayload[] =>
	draft.links
		.filter((link) => !link.isRemoved)
		.map((link) => toCatalogDependencyPayload(link));

/**
 * The owner's own manual link to a node, while the links are edited: only a
 * direct dependency of the owner can be one.
 *
 * @param node - The node.
 * @param links - The draft's links, by target id; null when not editing.
 * @returns The link, or undefined when the node has none to edit.
 */
export const getOwnDraftLink = (
	node: Pick<CatalogGraphNode, "id" | "side" | "depth">,
	links: ReadonlyMap<string, DraftLink> | null,
): DraftLink | undefined =>
	node.side === "USES" && node.depth === 1 ? links?.get(node.id) : undefined;

/** The owner's graph as read, or with the draft applied. */
interface DraftGraphData {
	/** Every node, the targets added in the draft included */
	readonly nodes: readonly CatalogDependency[];
	/** Every link, the owner's manual ones taken from the draft */
	readonly links: readonly CatalogDependencyLink[];
}

/**
 * The owner's graph with the draft in place of its manual links. Removed
 * links stay, so they can be undone, and a target the graph did not have is
 * drawn from what the picker gave, the user's access to it included, so it
 * reads as every other dependency does.
 *
 * @param graph - The nodes and links as read.
 * @param links - The draft's links, by target id; null when not editing.
 * @param ownerId - The owner's id.
 * @returns The nodes and the links.
 */
export const applyDraftToGraph = (
	graph: DraftGraphData,
	links: ReadonlyMap<string, DraftLink> | null,
	ownerId: string,
): DraftGraphData => {
	if (!links) {
		return graph;
	}
	const known = new Set(graph.nodes.map((node) => node.catalog_id));
	const drafted = [...links.values()];
	return {
		nodes: [
			...graph.nodes,
			...drafted
				.filter((link) => !known.has(link.catalog_id))
				.map(
					(link): CatalogDependency => ({
						catalog_id: link.catalog_id,
						catalog_type: link.catalog_type,
						catalog_name: link.catalog_name,
						catalog_subtype: link.catalog_subtype,
						permission_name: link.permission_name,
						catalog_global: link.catalog_global,
						catalog_discoverable: link.catalog_discoverable,
						// the picker lists only items the user can see
						is_private: false,
					}),
				),
		],
		links: [
			...graph.links.filter(
				(link) => link.parent_id !== ownerId || link.is_automatic,
			),
			...drafted.map(
				(link): CatalogDependencyLink => ({
					parent_id: ownerId,
					catalog_id: link.catalog_id,
					is_automatic: false,
					role: "MANUAL",
					dependency_name: link.dependency_name.trim() || null,
					dependency_description:
						link.dependency_description.trim() || null,
				}),
			),
		],
	};
};
