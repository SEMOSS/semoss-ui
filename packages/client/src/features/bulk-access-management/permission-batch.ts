import type {
	AccessLevel,
	AccessPerson,
	PermissionChange,
	PermissionGrant,
	PermissionSubject,
	PermissionsToCopy,
	ResourcePermissions,
} from "@semoss/sdk";
import { formatLocalDateTime } from "@semoss/utility/date";
import { GROUP_ACCESS_LEVELS } from "@/features/group-access/group-access-levels";

/** A person or team in a permission batch, with their access now and after it is saved */
export interface BatchEntry {
	/** Stable key; see {@link getSubjectKey} */
	key: string;
	/** Who */
	subject: PermissionSubject;
	/** A person's name and email, or null for a team */
	person: AccessPerson | null;
	/** Their access now, or null */
	current: PermissionGrant | null;
	/** Their access after the batch is saved, or null when the batch leaves them none */
	staged: PermissionGrant | null;
	/** Where the staged access came from, such as "Copied from Sales" */
	note: string | null;
}

/** A change the user made to one person or team in the batch */
export interface BatchEdit {
	/** Who */
	subject: PermissionSubject;
	/** A person's name and email, or null for a team */
	person: AccessPerson | null;
	/** Their access after the batch is saved, or null to take it away */
	staged: PermissionGrant | null;
	/** Where it came from */
	note: string | null;
}

/** A copied person whose access on the source differs from what the batch gives them */
export interface BatchConflict {
	/** The person's key */
	key: string;
	/** The person */
	person: AccessPerson;
	/** What the batch gives them now, or null when the batch takes their access away */
	kept: PermissionGrant | null;
	/** What the source gives them */
	incoming: PermissionGrant;
	/** Where the incoming access came from */
	note: string;
}

/** What the batch does to an entry */
export type BatchEntryStatus = "UNCHANGED" | "ADDED" | "CHANGED" | "REMOVED";

/** How copied access comes into a batch */
export interface CopyOptions {
	/** Says where it came from, such as "Copied from Sales" */
	note: string;
	/** Gives everyone this level, as copying a team's members does, in place of their own access */
	level?: AccessLevel;
	/** Whether model usage limits are kept; only an engine has them */
	keepModelLimits: boolean;
}

/** What copying found */
export interface CopyResult {
	/** People new to the batch, to add */
	additions: BatchEdit[];
	/** People the batch already gives different access */
	conflicts: BatchConflict[];
}

/**
 * The key of a person or team. A project's and an engine's people are keyed by
 * id alone, as the backend keys them; teams by type and name.
 *
 * @param subject - the person or team
 * @returns the key
 */
export const getSubjectKey = (subject: PermissionSubject): string =>
	subject.kind === "TEAM"
		? `TEAM:${subject.type}:${subject.id}`
		: `USER:${subject.id}`;

/**
 * @param level - an access level
 * @returns what the access pages call it, such as "Editor"
 */
export const getLevelLabel = (level: AccessLevel): string =>
	GROUP_ACCESS_LEVELS.find((option) => option.value === level)?.label ??
	level;

/**
 * Whether two grants give the same access: level, end date and model limits
 *
 * @param a - one grant
 * @param b - the other
 * @returns whether they match
 */
export const isSameGrant = (a: PermissionGrant, b: PermissionGrant): boolean =>
	a.level === b.level &&
	(a.endDate ?? null) === (b.endDate ?? null) &&
	(a.usageRestriction ?? null) === (b.usageRestriction ?? null) &&
	(a.usageFrequency ?? null) === (b.usageFrequency ?? null) &&
	(a.maxTokens ?? null) === (b.maxTokens ?? null) &&
	(a.maxResponseTime ?? null) === (b.maxResponseTime ?? null);

/**
 * @param grant - a grant
 * @returns the grant without model usage limits, for a target that has none
 */
export const withoutModelLimits = (
	grant: PermissionGrant,
): PermissionGrant => ({
	level: grant.level,
	endDate: grant.endDate ?? null,
});

/**
 * @param entry - an entry
 * @returns what the batch does to it
 */
export const getEntryStatus = (entry: BatchEntry): BatchEntryStatus => {
	if (entry.current && entry.staged) {
		return isSameGrant(entry.current, entry.staged)
			? "UNCHANGED"
			: "CHANGED";
	}
	if (entry.staged) {
		return "ADDED";
	}
	return entry.current ? "REMOVED" : "UNCHANGED";
};

/**
 * The people and teams in a batch: everyone with access now, with the user's
 * edits applied, then the people and teams the batch adds.
 *
 * @param access - who has access now, or null before it loads
 * @param edits - the user's edits, by key
 * @returns the entries
 */
export const buildEntries = (
	access: ResourcePermissions | null,
	edits: ReadonlyMap<string, BatchEdit>,
): BatchEntry[] => {
	const entries: BatchEntry[] = [];
	const seen = new Set<string>();
	const addCurrent = (
		subject: PermissionSubject,
		person: AccessPerson | null,
		current: PermissionGrant,
	) => {
		const key = getSubjectKey(subject);
		if (seen.has(key)) {
			return;
		}
		seen.add(key);
		const edit = edits.get(key);
		entries.push({
			key,
			subject,
			person,
			current,
			staged: edit ? edit.staged : current,
			note: edit?.note ?? null,
		});
	};
	for (const row of access?.people ?? []) {
		addCurrent(row.subject, row.subject, row.access);
	}
	for (const row of access?.teams ?? []) {
		addCurrent(row.subject, null, row.access);
	}
	for (const [key, edit] of edits) {
		if (!seen.has(key) && edit.staged) {
			entries.push({
				key,
				subject: edit.subject,
				person: edit.person,
				current: null,
				staged: edit.staged,
				note: edit.note,
			});
		}
	}
	return entries;
};

/**
 * Records an edit. An edit that leaves an entry with the access it has now is
 * dropped, so undoing a change by hand leaves nothing to save.
 *
 * @param edits - the edits so far
 * @param edit - the new edit
 * @param current - the entry's access now, or null
 * @returns the edits with the new one
 */
export const withEdit = (
	edits: ReadonlyMap<string, BatchEdit>,
	edit: BatchEdit,
	current: PermissionGrant | null,
): Map<string, BatchEdit> => {
	const next = new Map(edits);
	const key = getSubjectKey(edit.subject);
	const isUnchanged =
		current === null
			? edit.staged === null
			: edit.staged !== null && isSameGrant(current, edit.staged);
	if (isUnchanged) {
		next.delete(key);
	} else {
		next.set(key, edit);
	}
	return next;
};

/**
 * The changes a batch makes, with the key of the entry each is for
 *
 * @param entries - the batch's entries
 * @returns the changes, in the entries' order
 */
export const toChanges = (
	entries: BatchEntry[],
): { key: string; change: PermissionChange }[] =>
	entries.flatMap((entry) => {
		const status = getEntryStatus(entry);
		const subject: PermissionSubject = {
			kind: entry.subject.kind,
			id: entry.subject.id,
			type: entry.subject.type,
		};
		if (status === "ADDED" && entry.staged) {
			return [
				{
					key: entry.key,
					change: { action: "ADD", subject, to: entry.staged },
				},
			];
		}
		if (status === "CHANGED" && entry.staged) {
			return [
				{
					key: entry.key,
					change: { action: "CHANGE", subject, to: entry.staged },
				},
			];
		}
		if (status === "REMOVED") {
			return [{ key: entry.key, change: { action: "REMOVE", subject } }];
		}
		return [];
	});

/**
 * Brings copied people into a batch. People new to the batch are added with the
 * copied access; people the batch already gives the same access are left as
 * they are; everyone else is a conflict for the user to settle.
 *
 * @param entries - the batch's entries
 * @param rows - the people copied from the source
 * @param options - how the access comes in
 * @returns the additions and the conflicts
 */
export const mergeCopiedAccess = (
	entries: BatchEntry[],
	rows: PermissionsToCopy[],
	options: CopyOptions,
): CopyResult => {
	const byKey = new Map(entries.map((entry) => [entry.key, entry]));
	const additions: BatchEdit[] = [];
	const conflicts: BatchConflict[] = [];
	for (const row of rows) {
		const copied: PermissionGrant | null = options.level
			? { level: options.level }
			: row.source;
		if (!copied) {
			continue;
		}
		const incoming = options.keepModelLimits
			? copied
			: withoutModelLimits(copied);
		const key = getSubjectKey(row.subject);
		const existing = byKey.get(key);
		if (!existing || (!existing.current && !existing.staged)) {
			additions.push({
				subject: row.subject,
				person: row.subject,
				staged: incoming,
				note: options.note,
			});
			continue;
		}
		if (existing.staged && isSameGrant(existing.staged, incoming)) {
			continue;
		}
		conflicts.push({
			key,
			person: existing.person ?? row.subject,
			kept: existing.staged,
			incoming,
			note: options.note,
		});
	}
	return { additions, conflicts };
};

/**
 * Whether an entry matches a search of its name, email, id or type
 *
 * @param entry - an entry
 * @param search - the search, in lower case, or empty for all
 * @returns whether it matches
 */
export const matchesSearch = (entry: BatchEntry, search: string): boolean =>
	!search ||
	[
		entry.subject.id,
		entry.subject.type,
		entry.person?.name,
		entry.person?.email,
	]
		.filter((value): value is string => typeof value === "string")
		.some((value) => value.toLowerCase().includes(search));

/** How often a model's usage limit resets, as words after the amount */
const LIMIT_PERIODS: Record<string, string> = {
	DAY: " a day",
	DAILY: " a day",
	WEEK: " a week",
	WEEKLY: " a week",
	MONTH: " a month",
	MONTHLY: " a month",
	YEAR: " a year",
	YEARLY: " a year",
	ALL_TIME: " in total",
};

/**
 * A model engine's usage limit in words, such as "10,000 tokens a day"
 *
 * @param grant - the access, or null for none
 * @returns the limit, or "No limit"
 */
export const describeModelLimit = (grant: PermissionGrant | null): string => {
	const restriction = grant?.usageRestriction?.toUpperCase();
	const period =
		LIMIT_PERIODS[grant?.usageFrequency?.toUpperCase() ?? ""] ?? "";
	if (restriction === "TOKEN" && grant?.maxTokens != null) {
		return `${grant.maxTokens.toLocaleString()} tokens${period}`;
	}
	if (restriction === "COMPUTE" && grant?.maxResponseTime != null) {
		return `${grant.maxResponseTime.toLocaleString()} ms${period}`;
	}
	return "No limit";
};

/**
 * @param endDate - when access ends, or null
 * @returns " until Dec 31, 2026", or nothing when it does not end
 */
const describeUntil = (endDate: string | null | undefined): string => {
	const date = formatLocalDateTime(endDate ?? undefined, "MMM D, YYYY");
	return date ? ` until ${date}` : "";
};

/**
 * What a change does to someone's access, in a few words for the review
 *
 * @param current - their access now, or null
 * @param staged - their access after the batch is saved, or null when it is taken away
 * @returns such as "Editor until Dec 31, 2026", "Read-Only to Editor" or
 *          "Loses Author"
 */
export const describeChangeDetail = (
	current: PermissionGrant | null,
	staged: PermissionGrant | null,
): string => {
	if (!staged) {
		return current ? `Loses ${getLevelLabel(current.level)}` : "";
	}
	const level = getLevelLabel(staged.level);
	const until = describeUntil(staged.endDate);
	if (!current) {
		return `${level}${until}`;
	}
	if (current.level !== staged.level) {
		return `${getLevelLabel(current.level)} to ${level}${until}`;
	}
	if ((current.endDate ?? null) !== (staged.endDate ?? null)) {
		return staged.endDate
			? `${level}, now${until}`
			: `${level}, no end date`;
	}
	const limit = describeModelLimit(staged);
	return `${level}, ${limit === "No limit" ? "no usage limit" : limit}`;
};
