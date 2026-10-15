import { useCallback, useEffect, useMemo, useState } from "react";
import {
	type AccessPerson,
	getResourcePermissions,
	type PermissionAllowedChanges,
	type PermissionChange,
	type PermissionGrant,
	type PermissionSubject,
	type PermissionsToCopy,
	type PermissionTargetResource,
	type ResourcePermissions,
} from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";
import {
	type BatchConflict,
	type BatchEdit,
	type BatchEntry,
	buildEntries,
	type CopyOptions,
	getSubjectKey,
	mergeCopiedAccess,
	toChanges,
	withEdit,
} from "./permission-batch";

/** A person or team to add to a permission batch */
export interface BatchAddition {
	/** Who */
	subject: PermissionSubject;
	/** A person's name and email, or null for a team */
	person: AccessPerson | null;
}

export interface UsePermissionBatchResult {
	/** Everyone in the batch, with their access now and after it is saved */
	entries: BatchEntry[];
	/** What the signed in user may change, or null until the access loads */
	allowedChanges: PermissionAllowedChanges | null;
	/** Whether the current access is being read */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** The changes the batch makes, with the key of the entry each is for */
	changes: { key: string; change: PermissionChange }[];
	/** Copied people waiting for the user to choose their access */
	conflicts: BatchConflict[];
	/** Sets an entry's access after the batch is saved; null takes it away */
	setStaged: (entry: BatchEntry, staged: PermissionGrant | null) => void;
	/** Puts an entry back the way it is now */
	restore: (key: string) => void;
	/** Adds people or teams who are not in the batch yet; returns how many were added */
	add: (
		additions: BatchAddition[],
		grant: PermissionGrant,
		note?: string,
	) => number;
	/** Brings copied people into the batch; returns how many were added and how many conflict */
	copy: (
		rows: PermissionsToCopy[],
		options: CopyOptions,
	) => { added: number; conflicts: number };
	/** Settles one conflict: true takes the copied access, false keeps the batch's */
	resolveConflict: (key: string, useIncoming: boolean) => void;
	/** Settles every conflict the same way */
	resolveAllConflicts: (useIncoming: boolean) => void;
	/** Drops every edit and conflict */
	discard: () => void;
	/** Reads the current access again and keeps the batch */
	refresh: () => void;
	/**
	 * Drops the batch after it was saved and reads the access again; nothing is
	 * listed until it is read, so the access from before the save never shows
	 */
	finishApply: () => void;
}

/**
 * Bulk Access Management's state for a project or engine: who has access now,
 * the changes the user is staging, and the copied people whose access conflicts
 * with the batch. Nothing is saved here; the review dialog saves the changes.
 *
 * @param target - the project or engine
 * @param admin - whether to read in admin mode; outside it an admin has only
 * their own permissions
 * @returns the batch and the ways to change it
 */
export const usePermissionBatch = (
	target: PermissionTargetResource,
	admin = false,
): UsePermissionBatchResult => {
	const { kind, id } = target;
	const [access, setAccess] = useState<ResourcePermissions | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [edits, setEdits] = useState<ReadonlyMap<string, BatchEdit>>(
		() => new Map(),
	);
	const [conflicts, setConflicts] = useState<BatchConflict[]>([]);
	const [refreshCount, setRefreshCount] = useState(0);

	useEffect(() => {
		// refreshCount is read so a refresh reads the access again
		if (refreshCount < 0) {
			return;
		}
		let isStale = false;
		setIsLoading(true);
		setError(null);
		getResourcePermissions({ kind, id }, admin)
			.then((next) => {
				if (!isStale) {
					setAccess(next);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setError(getErrorMessage(e, "Could not read the access"));
				}
			})
			.finally(() => {
				if (!isStale) {
					setIsLoading(false);
				}
			});
		return () => {
			isStale = true;
		};
	}, [kind, id, admin, refreshCount]);

	const entries = useMemo(() => buildEntries(access, edits), [access, edits]);
	const changes = useMemo(() => toChanges(entries), [entries]);

	/** The access a key has now, or null */
	const currentOf = (key: string): PermissionGrant | null =>
		entries.find((entry) => entry.key === key)?.current ?? null;

	const setStaged = (entry: BatchEntry, staged: PermissionGrant | null) => {
		setEdits((prev) =>
			withEdit(
				prev,
				{
					subject: entry.subject,
					person: entry.person,
					staged,
					note: staged ? entry.note : null,
				},
				entry.current,
			),
		);
	};

	const restore = (key: string) => {
		setEdits((prev) => {
			const next = new Map(prev);
			next.delete(key);
			return next;
		});
	};

	const add = (
		additions: BatchAddition[],
		grant: PermissionGrant,
		note?: string,
	): number => {
		const byKey = new Map(entries.map((entry) => [entry.key, entry]));
		const added = additions.filter(
			(addition) => !byKey.get(getSubjectKey(addition.subject))?.staged,
		);
		if (added.length === 0) {
			return 0;
		}
		setEdits((prev) =>
			added.reduce<ReadonlyMap<string, BatchEdit>>(
				(next, addition) =>
					withEdit(
						next,
						{ ...addition, staged: grant, note: note ?? null },
						byKey.get(getSubjectKey(addition.subject))?.current ??
							null,
					),
				prev,
			),
		);
		return added.length;
	};

	const copy = (rows: PermissionsToCopy[], options: CopyOptions) => {
		const result = mergeCopiedAccess(entries, rows, options);
		if (result.additions.length > 0) {
			setEdits((prev) =>
				result.additions.reduce<ReadonlyMap<string, BatchEdit>>(
					(next, addition) => withEdit(next, addition, null),
					prev,
				),
			);
		}
		if (result.conflicts.length > 0) {
			// a later copy replaces an open conflict for the same person
			const keys = new Set(
				result.conflicts.map((conflict) => conflict.key),
			);
			setConflicts((prev) => [
				...prev.filter((conflict) => !keys.has(conflict.key)),
				...result.conflicts,
			]);
		}
		return {
			added: result.additions.length,
			conflicts: result.conflicts.length,
		};
	};

	const settle = (settled: BatchConflict[], useIncoming: boolean) => {
		if (useIncoming) {
			setEdits((prev) =>
				settled.reduce<ReadonlyMap<string, BatchEdit>>(
					(next, conflict) =>
						withEdit(
							next,
							{
								subject: conflict.person,
								person: conflict.person,
								staged: conflict.incoming,
								note: conflict.note,
							},
							currentOf(conflict.key),
						),
					prev,
				),
			);
		}
		const keys = new Set(settled.map((conflict) => conflict.key));
		setConflicts((prev) =>
			prev.filter((conflict) => !keys.has(conflict.key)),
		);
	};

	const resolveConflict = (key: string, useIncoming: boolean) => {
		const conflict = conflicts.find((item) => item.key === key);
		if (conflict) {
			settle([conflict], useIncoming);
		}
	};

	const resolveAllConflicts = (useIncoming: boolean) => {
		settle(conflicts, useIncoming);
	};

	const discard = () => {
		setEdits(new Map());
		setConflicts([]);
	};

	const refresh = useCallback(
		() => setRefreshCount((count) => count + 1),
		[],
	);

	const finishApply = () => {
		discard();
		setAccess(null);
		refresh();
	};

	return {
		entries,
		allowedChanges: access?.allowedPermissionChanges ?? null,
		isLoading,
		error,
		changes,
		conflicts,
		setStaged,
		restore,
		add,
		copy,
		resolveConflict,
		resolveAllConflicts,
		discard,
		refresh,
		finishApply,
	};
};
