import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogDependencyRow, CatalogType } from "@semoss/shared";
import { getErrorMessage } from "@semoss/utility/error";
import { setCatalogDependencies } from "@/api/catalog-dependencies";
import {
	addToDraft,
	countDraftChanges,
	createDependencyDraft,
	type DependencyDraft,
	type DependencyOption,
	type DraftLink,
	type DraftLinkFields,
	removeFromDraft,
	restoreInDraft,
	toDraftPayload,
	updateDraftLink,
	validateDependencyDraft,
} from "./catalog-dependency-draft";

/** What {@link useDependencyDraft} reads. */
export interface UseDependencyDraftInput {
	/** The owner's id */
	catalogId: string;
	/** The owner's specific type */
	catalogType: CatalogType;
	/** The owner's rows as saved; the manual ones are what is edited */
	saved: readonly CatalogDependencyRow[];
	/** Called after a save, so the owner's dependencies are read again */
	onSaved: () => void;
}

const NO_PROBLEMS: ReadonlyMap<string, string> = new Map();

/** An edit of an owner's manual dependencies on the Ontology canvas. */
export interface UseDependencyDraftResult {
	/**
	 * The draft's links by target id, in the order they were added, while
	 * editing; null when not editing
	 */
	readonly links: ReadonlyMap<string, DraftLink> | null;
	/** Whether the canvas is being edited */
	readonly isEditing: boolean;
	/** How many changes the draft holds */
	readonly changeCount: number;
	/** What stops a save, by target id */
	readonly problems: ReadonlyMap<string, string>;
	/** Whether the save is running */
	readonly isSaving: boolean;
	/** Why the last save was refused, or null */
	readonly saveError: string | null;
	/** Starts editing from the rows as saved */
	readonly start: () => void;
	/** Stops editing and drops the draft */
	readonly discard: () => void;
	/** Drops every change and keeps editing, from the rows as saved */
	readonly reset: () => void;
	/** Adds a target with its link's name and description */
	readonly add: (target: DependencyOption, fields: DraftLinkFields) => void;
	/** Removes a target; a saved one can be brought back until the save */
	readonly remove: (id: string) => void;
	/** Brings back a target marked for removal */
	readonly restore: (id: string) => void;
	/** Changes a link's name or description */
	readonly update: (id: string, change: Partial<DraftLinkFields>) => void;
	/**
	 * Saves the draft in one call and stops editing. A refused save keeps the
	 * draft and the reason. Resolves with whether it saved.
	 */
	readonly save: () => Promise<boolean>;
}

/**
 * Edits an owner's manual dependencies as a draft, as the automation canvas
 * edits a workflow: nothing reaches the backend until Save, which sends the
 * whole manual set in one `SetCatalogDependencies`, the only way the backend
 * takes them. Leaving the page with changes asks the browser to warn.
 *
 * @param input - The owner, its saved rows, and what to do after a save.
 * @returns The draft and its actions.
 */
export const useDependencyDraft = ({
	catalogId,
	catalogType,
	saved,
	onSaved,
}: UseDependencyDraftInput): UseDependencyDraftResult => {
	const [draft, setDraft] = useState<DependencyDraft | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const links = useMemo(
		() =>
			draft
				? new Map(draft.links.map((link) => [link.catalog_id, link]))
				: null,
		[draft],
	);
	const changeCount = draft ? countDraftChanges(draft, saved) : 0;
	// kept while the draft is unchanged, so the canvas, which marks the links
	// with a problem, rebuilds its edges only when the draft changes
	const problems = useMemo(
		() => (draft ? validateDependencyDraft(draft) : NO_PROBLEMS),
		[draft],
	);

	// closing or reloading the tab with changes asks first
	useEffect(() => {
		if (changeCount === 0) {
			return;
		}
		const warn = (event: BeforeUnloadEvent): void => {
			event.preventDefault();
		};
		window.addEventListener("beforeunload", warn);
		return () => window.removeEventListener("beforeunload", warn);
	}, [changeCount]);

	// the edits only set state, so they keep their identity across renders and
	// the canvas's nodes and edges are rebuilt only when the draft changes
	const change = useCallback(
		(next: (current: DependencyDraft) => DependencyDraft): void => {
			setSaveError(null);
			setDraft((current) => (current ? next(current) : current));
		},
		[],
	);
	const add = useCallback(
		(target: DependencyOption, fields: DraftLinkFields) =>
			change((current) => addToDraft(current, target, fields)),
		[change],
	);
	const remove = useCallback(
		(id: string) => change((current) => removeFromDraft(current, id)),
		[change],
	);
	const restore = useCallback(
		(id: string) => change((current) => restoreInDraft(current, id)),
		[change],
	);
	const update = useCallback(
		(id: string, fields: Partial<DraftLinkFields>) =>
			change((current) => updateDraftLink(current, id, fields)),
		[change],
	);

	const save = async (): Promise<boolean> => {
		if (!draft || problems.size > 0) {
			return false;
		}
		setIsSaving(true);
		setSaveError(null);
		try {
			await setCatalogDependencies(
				catalogId,
				catalogType,
				toDraftPayload(draft),
			);
		} catch (error: unknown) {
			setSaveError(
				getErrorMessage(error, "The dependencies could not be saved"),
			);
			setIsSaving(false);
			return false;
		}
		setIsSaving(false);
		setDraft(null);
		onSaved();
		return true;
	};

	return {
		links,
		isEditing: draft !== null,
		changeCount,
		problems,
		isSaving,
		saveError,
		start: () => {
			setSaveError(null);
			setDraft(createDependencyDraft(saved));
		},
		discard: () => {
			setSaveError(null);
			setDraft(null);
		},
		reset: () => {
			setSaveError(null);
			setDraft(createDependencyDraft(saved));
		},
		add,
		remove,
		restore,
		update,
		save,
	};
};
