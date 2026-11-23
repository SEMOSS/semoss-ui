import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogDependencyRow,
	CatalogType,
} from "@semoss/shared";
import {
	type CatalogDependencyPayload,
	getDependencyDisplayName,
	toCatalogDependencyPayload,
} from "./catalog-dependency";
import type { CatalogGraphNode } from "./catalog-dependency-graph";

/** The longest name a manual dependency can have. */
export const NAME_LIMIT = 255;

/** What a name another link of the same owner has reads. */
export const NAME_TAKEN = "Another dependency already has this name";

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
	/** The link's name, unique per owner; empty for none */
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

/** A target to add, as the picker offers it. */
export type DependencyOption = Pick<
	CatalogDependency,
	"catalog_id" | "catalog_name" | "catalog_type" | "catalog_subtype"
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
 * Adds a target. One already in the draft is left as it is, and one marked
 * for removal is brought back.
 *
 * @param draft - The draft.
 * @param target - The target.
 * @returns The new draft.
 */
export const addToDraft = (
	draft: DependencyDraft,
	target: DependencyOption,
): DependencyDraft => {
	const existing = draft.links.find(
		(link) => link.catalog_id === target.catalog_id,
	);
	if (existing) {
		return existing.isRemoved
			? restoreInDraft(draft, target.catalog_id)
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
				dependency_name: "",
				dependency_description: "",
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
	change: Partial<
		Pick<DraftLink, "dependency_name" | "dependency_description">
	>,
): DependencyDraft => ({
	links: draft.links.map((link) =>
		link.catalog_id === id ? { ...link, ...change } : link,
	),
});

/**
 * The names the other links not marked for removal have, trimmed and in
 * lower case, so a repeat can be found ignoring case and spaces at the ends.
 *
 * @param links - The draft's links.
 * @param exceptId - The link whose own name is left out.
 * @returns The names in use; empty names are left out.
 */
export const getTakenNames = (
	links: Iterable<DraftLink>,
	exceptId: string,
): string[] =>
	[...links].flatMap((link) => {
		const name = link.dependency_name.trim().toLowerCase();
		return link.isRemoved || link.catalog_id === exceptId || !name
			? []
			: [name];
	});

/**
 * What stops the draft being saved, by target: a name another link has
 * (ignoring case and spaces at the ends), or one too long. Links marked for
 * removal are not checked.
 *
 * @param draft - The draft.
 * @returns Each problem's message, by target id; empty when it can be saved.
 */
export const validateDependencyDraft = (
	draft: DependencyDraft,
): ReadonlyMap<string, string> => {
	const problems = new Map<string, string>();
	for (const link of draft.links) {
		const name = link.dependency_name.trim();
		if (link.isRemoved || !name) {
			continue;
		}
		if (name.length > NAME_LIMIT) {
			problems.set(
				link.catalog_id,
				`Use ${NAME_LIMIT} characters or fewer`,
			);
		} else if (
			getTakenNames(draft.links, link.catalog_id).includes(
				name.toLowerCase(),
			)
		) {
			problems.set(link.catalog_id, NAME_TAKEN);
		}
	}
	return problems;
};

/**
 * How many changes the draft holds against the rows as saved: each target
 * added, each removed, and each saved link whose name or description changed.
 *
 * @param draft - The draft.
 * @param saved - The owner's manual rows as saved.
 * @returns The count.
 */
export const countDraftChanges = (
	draft: DependencyDraft,
	saved: readonly CatalogDependencyRow[],
): number => {
	const savedById = new Map(
		saved
			.filter((row) => !row.is_automatic)
			.map((row) => [row.catalog_id, row]),
	);
	let count = 0;
	for (const link of draft.links) {
		if (link.isNew || link.isRemoved) {
			count += 1;
			continue;
		}
		const row = savedById.get(link.catalog_id);
		if (
			row &&
			((row.dependency_name ?? "") !== link.dependency_name.trim() ||
				(row.dependency_description ?? "") !==
					link.dependency_description.trim())
		) {
			count += 1;
		}
	}
	return count;
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
export interface DraftGraphData {
	/** Every node, the targets added in the draft included */
	readonly nodes: readonly CatalogDependency[];
	/** Every link, the owner's manual ones taken from the draft */
	readonly links: readonly CatalogDependencyLink[];
	/**
	 * The targets added in the draft. They were picked from what the user can
	 * open, so nothing is said about their access, and they are never requested
	 */
	readonly addedIds: ReadonlySet<string>;
}

const NO_IDS: ReadonlySet<string> = new Set();

/**
 * The owner's graph with the draft in place of its manual links. Removed
 * links stay, so they can be undone, and a target the graph did not have is
 * drawn from what the picker gave.
 *
 * @param graph - The nodes and links as read.
 * @param links - The draft's links, by target id; null when not editing.
 * @param ownerId - The owner's id.
 * @returns The nodes, the links, and the targets the draft added.
 */
export const applyDraftToGraph = (
	graph: Pick<DraftGraphData, "nodes" | "links">,
	links: ReadonlyMap<string, DraftLink> | null,
	ownerId: string,
): DraftGraphData => {
	if (!links) {
		return { ...graph, addedIds: NO_IDS };
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
		addedIds: new Set(
			drafted.filter((link) => link.isNew).map((link) => link.catalog_id),
		),
	};
};
