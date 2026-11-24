import { useState } from "react";
import {
	type AccessLevel,
	type ModelUsageLimit,
	savePermissionBatches,
} from "@semoss/sdk";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import { isGrantLevel } from "./grant-levels";
import {
	type Grantee,
	type GrantTarget,
	granteeKey,
	toGranteeChangeBatch,
	toRemoveGranteeBatch,
} from "./grants";

/** One permission a table shows: the target that gives it and the one given it */
export interface GrantRow {
	/** The engine or project, with its name when the table lists many targets */
	target: GrantTarget & { name?: string };
	/** The app, agent or engine, with its permission */
	grantee: Grantee;
}

/** A level picked for a row, shown until the rows are read again */
interface PendingLevel {
	/** The row's key */
	key: string;
	/** The level picked */
	level: AccessLevel;
	/** The rows as read when it was picked; it applies only while they are the ones shown */
	rows: unknown;
}

/** What the hook's caller gives it */
interface GrantChangesOptions {
	/**
	 * The list the rows come from, as last read; a level picked shows in its row
	 * until this list is read again
	 */
	rows: unknown;
	/** Whether to save in admin mode; outside it an admin has only their own permissions */
	admin: boolean;
	/** Called after each save, to read the rows again */
	onSaved: () => void;
	/** Called when a permission is taken away, before its confirmation closes */
	onRemoved?: () => void;
}

/** The state and actions of changing the permissions a table shows */
interface GrantChanges {
	/** Whether a level change or a removal is being saved */
	isChanging: boolean;
	/** Why the last level change was refused, or null */
	levelError: string | null;
	/** @returns the level to show for a row: the one just picked, or the one it has */
	levelOf: (row: GrantRow) => AccessLevel;
	/** Saves a level picked for a row, as one permission batch on its target */
	changeLevel: (row: GrantRow, value: string) => Promise<void>;
	/** The row whose usage limit is being edited, or null */
	limitRow: GrantRow | null;
	/** A new key each time the limit dialog opens, so it starts from the row's limit */
	limitDialogKey: number;
	/** Opens the usage limit dialog for a row */
	openLimit: (row: GrantRow) => void;
	/** Closes the usage limit dialog */
	closeLimit: () => void;
	/** Saves the usage limit; a refusal rejects, so the dialog shows it and stays open */
	saveLimit: (usageLimit: ModelUsageLimit | null) => Promise<void>;
	/** The row whose permission is about to be taken away, or null */
	removeRow: GrantRow | null;
	/** Why the last removal was refused, or null */
	removeError: string | null;
	/** Opens the confirmation for taking a row's permission away */
	openRemove: (row: GrantRow) => void;
	/** Closes the confirmation, unless a removal is being saved */
	closeRemove: () => void;
	/** Takes the permission away, as one permission batch on its target */
	remove: () => Promise<void>;
}

/**
 * @param row - a permission a table shows
 * @returns its key, by target and grantee
 */
const rowKey = (row: GrantRow): string =>
	granteeKey(row.target, row.grantee.subject);

/**
 * @param row - a permission
 * @returns " to" or " on" and the target's name, when the row has one, for a toast
 */
const onTarget = (row: GrantRow, word: "to" | "on"): string =>
	row.target.name ? ` ${word} ${row.target.name}` : "";

/**
 * Changes the permissions a table of grants shows, each saved at once as one
 * permission batch on the row's target: a level picked in place, a model's
 * usage limit from its dialog, and taking a permission away after a
 * confirmation. A saved change shows a toast and calls `onSaved` to read the
 * rows again; a level picked shows in its row until then, so it never shows the
 * level from before the save. A refused level change is kept in `levelError`
 * and the row goes back to its level; a refused removal is kept in
 * `removeError` and the confirmation stays open.
 *
 * @param options - the rows, the mode and what to do after a save
 * @returns the state and actions
 */
export const useGrantChanges = ({
	rows,
	admin,
	onSaved,
	onRemoved,
}: GrantChangesOptions): GrantChanges => {
	const [isChanging, setIsChanging] = useState(false);
	const [pendingLevel, setPendingLevel] = useState<PendingLevel | null>(null);
	const [levelError, setLevelError] = useState<string | null>(null);
	const [limitRow, setLimitRow] = useState<GrantRow | null>(null);
	const [limitDialogKey, setLimitDialogKey] = useState(0);
	const [removeRow, setRemoveRow] = useState<GrantRow | null>(null);
	const [removeError, setRemoveError] = useState<string | null>(null);

	const handleSaved = () => {
		setLevelError(null);
		onSaved();
	};

	return {
		isChanging,
		levelError,
		levelOf: (row) =>
			pendingLevel !== null &&
			pendingLevel.rows === rows &&
			pendingLevel.key === rowKey(row)
				? pendingLevel.level
				: row.grantee.access.level,
		changeLevel: async (row, value) => {
			if (!isGrantLevel(value) || value === row.grantee.access.level) {
				return;
			}
			const { name } = row.grantee.subject;
			setIsChanging(true);
			setLevelError(null);
			setPendingLevel({ key: rowKey(row), level: value, rows });
			try {
				await savePermissionBatches(
					[
						toGranteeChangeBatch(row.target, row.grantee, {
							level: value,
						}),
					],
					admin,
				);
			} catch (e) {
				setPendingLevel(null);
				setLevelError(
					getErrorMessage(
						e,
						`Could not change the access of ${name}`,
					),
				);
				setIsChanging(false);
				return;
			}
			setIsChanging(false);
			toast.success(
				`${name} has ${getLevelLabel(value)} access${onTarget(row, "to")}`,
			);
			handleSaved();
		},
		limitRow,
		limitDialogKey,
		openLimit: (row) => {
			setLimitDialogKey((key) => key + 1);
			setLimitRow(row);
		},
		closeLimit: () => setLimitRow(null),
		saveLimit: async (usageLimit) => {
			if (!limitRow) {
				return;
			}
			await savePermissionBatches(
				[
					toGranteeChangeBatch(limitRow.target, limitRow.grantee, {
						usageLimit,
					}),
				],
				admin,
			);
			setLimitRow(null);
			toast.success(
				`Saved the usage limit for ${limitRow.grantee.subject.name}${onTarget(limitRow, "on")}`,
			);
			handleSaved();
		},
		removeRow,
		removeError,
		openRemove: (row) => {
			setRemoveError(null);
			setRemoveRow(row);
		},
		closeRemove: () => {
			if (!isChanging) {
				setRemoveRow(null);
			}
		},
		remove: async () => {
			if (!removeRow) {
				return;
			}
			const { name } = removeRow.grantee.subject;
			setIsChanging(true);
			setRemoveError(null);
			try {
				await savePermissionBatches(
					[
						toRemoveGranteeBatch(
							removeRow.target,
							removeRow.grantee.subject,
						),
					],
					admin,
				);
			} catch (e) {
				setRemoveError(
					getErrorMessage(
						e,
						`Could not remove the access of ${name}`,
					),
				);
				setIsChanging(false);
				return;
			}
			setIsChanging(false);
			onRemoved?.();
			toast.success(
				`${name} no longer has access${onTarget(removeRow, "to")}`,
			);
			setRemoveRow(null);
			handleSaved();
		},
	};
};
