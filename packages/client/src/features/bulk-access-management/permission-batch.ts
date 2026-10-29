import type {
	AccessLevel,
	AccessPerson,
	ModelUsageLimit,
	PermissionAllowedChanges,
	PermissionChange,
	PermissionGrant,
	PermissionSubject,
	PermissionsToCopy,
	ResourcePermissions,
} from "@semoss/sdk";
import {
	describeModelUsageLimit,
	hasCostRule,
	isSameModelUsageLimit,
	type ModelUsageLimitSource,
	OWNERS_END_LIMITED_ACCESS_REASON,
	OWNERS_ONLY_LIMIT_REASON,
} from "@semoss/shared";
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
	/**
	 * What the batch gives them now, or null when the batch takes their access
	 * away or does not have them yet
	 */
	kept: PermissionGrant | null;
	/** Whether the batch does not have them yet, so keeping means not adding them */
	isNew: boolean;
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
	/** With `level`, the usage limit everyone gets on a model */
	usageLimit?: ModelUsageLimit | null;
	/** Whether model usage limits are kept; only a model has them */
	keepModelLimits: boolean;
	/**
	 * Whether the user can set usage limits: on a model, its owners and admins
	 * in admin mode. When false, the copy stages levels and end dates only:
	 * each person keeps the limit they have now, and people new to the model
	 * get none. True when not given.
	 */
	canSetLimits?: boolean;
	/**
	 * Whether the target model has known prices. Without them, copied cost rules
	 * are left out, and the people they belonged to are conflicts to settle.
	 */
	costLimitsAvailable?: boolean;
}

/** A model-wide usage limit a batch can change: the public use limit, or the model total */
export type ModelLimitCategory = "PUBLIC" | "MODEL";

/** A model's public use limit or its total, with its limit now and after the batch is saved */
export interface ModelLimitEntry {
	/** Stable key; see {@link getModelLimitKey} */
	key: string;
	/** Which limit */
	category: ModelLimitCategory;
	/** The limit now, or null for no limit defined */
	current: ModelUsageLimit | null;
	/** The limit after the batch is saved, or null for no limit defined */
	staged: ModelUsageLimit | null;
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
	subject.category === "TEAM"
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
 * @param category - the public use limit or the model total
 * @returns its key, which no person or team has
 */
export const getModelLimitKey = (category: ModelLimitCategory): string =>
	`MODEL_LIMIT:${category}`;

/**
 * Whether two grants give the same access: level, end date and model usage
 * limit
 *
 * @param a - one grant
 * @param b - the other
 * @returns whether they match
 */
export const isSameGrant = (a: PermissionGrant, b: PermissionGrant): boolean =>
	a.level === b.level &&
	(a.endDate ?? null) === (b.endDate ?? null) &&
	isSameModelUsageLimit(a.usageLimit, b.usageLimit);

/**
 * @param grant - a grant
 * @returns the grant without a model usage limit, for a target that has none
 */
export const withoutModelLimits = (
	grant: PermissionGrant,
): PermissionGrant => ({
	level: grant.level,
	endDate: grant.endDate ?? null,
});

/**
 * @param grant - a grant
 * @returns the grant as a batch sends it: its level, end date and, on a model,
 * its usage limit. A grant with no limit defined leaves the limit out, which
 * the batch reads as no limit defined.
 */
export const toSentGrant = (grant: PermissionGrant): PermissionGrant => ({
	level: grant.level,
	endDate: grant.endDate ?? null,
	...(grant.usageLimit ? { usageLimit: grant.usageLimit } : {}),
});

/**
 * @param limit - a limit
 * @returns the limit without its cost rules, or null when nothing is left
 */
const withoutCostRules = (
	limit: ModelUsageLimit | null | undefined,
): ModelUsageLimit | null => {
	if (!limit || limit.unlimited) {
		return limit ?? null;
	}
	const rules = limit.rules.filter((rule) => rule.metric !== "COST");
	return rules.length > 0 ? { unlimited: false, rules } : null;
};

/**
 * Whether the user can set usage limits on a model: its owners, and admins in
 * admin mode. Editors can still add people and change levels, but never a
 * limit.
 *
 * @param allowed - what the user may change
 * @returns whether they can set a person's or team's limit, the public use
 * limit and the model total
 */
export const canSetUsageLimits = (allowed: PermissionAllowedChanges): boolean =>
	allowed.canChangeModelLimits;

/**
 * @param allowed - what the user may change
 * @param level - the level a person has after the change
 * @returns whether the user can set the limit of a person at that level
 */
export const canSetPersonLimitAt = (
	allowed: PermissionAllowedChanges,
	level: AccessLevel,
): boolean => canSetUsageLimits(allowed) && allowed.limitLevels.includes(level);

/**
 * Why the user cannot change an entry's usage limit on a model: only owners
 * set usage limits, so everyone else sees every limit read-only
 *
 * @param entry - an entry
 * @param allowed - what the user may change
 * @returns the reason, or null when they can change it
 */
export const getLimitBlockReason = (
	entry: BatchEntry,
	allowed: PermissionAllowedChanges,
): string | null => {
	if (!entry.staged) {
		return "Their access is taken away in your changes";
	}
	const canSet =
		entry.subject.category === "TEAM"
			? canSetUsageLimits(allowed)
			: canSetPersonLimitAt(allowed, entry.staged.level);
	return canSet ? null : OWNERS_ONLY_LIMIT_REASON;
};

/**
 * Why the user cannot take away a person's access on a model: only owners take
 * away the access of someone with a usage limit, since the limit goes with it
 * and they would fall through to another one
 *
 * @param entry - an entry
 * @param allowed - what the user may change
 * @returns the reason, or null when they can take it away
 */
export const getRemoveBlockReason = (
	entry: BatchEntry,
	allowed: PermissionAllowedChanges,
): string | null =>
	entry.subject.category !== "TEAM" &&
	entry.current?.usageLimit &&
	!canSetUsageLimits(allowed)
		? OWNERS_END_LIMITED_ACCESS_REASON
		: null;

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
			category: entry.subject.category,
			id: entry.subject.id,
			type: entry.subject.type,
		};
		if (status === "ADDED" && entry.staged) {
			return [
				{
					key: entry.key,
					change: {
						action: "ADD",
						subject,
						to: toSentGrant(entry.staged),
					},
				},
			];
		}
		if (status === "CHANGED" && entry.staged) {
			return [
				{
					key: entry.key,
					change: {
						action: "CHANGE",
						subject,
						to: toSentGrant(entry.staged),
					},
				},
			];
		}
		if (status === "REMOVED") {
			return [{ key: entry.key, change: { action: "REMOVE", subject } }];
		}
		return [];
	});

/**
 * A model's total and its public use limit, with the user's edits applied.
 * Anything but a model has neither.
 *
 * @param access - who has access now, or null before it loads
 * @param edits - the limits the user staged, by category
 * @returns the model total first, then the public use limit
 */
export const buildModelLimitEntries = (
	access: ResourcePermissions | null,
	edits: ReadonlyMap<ModelLimitCategory, ModelUsageLimit | null>,
): ModelLimitEntry[] => {
	const entries: ModelLimitEntry[] = [];
	const add = (
		category: ModelLimitCategory,
		current: ModelUsageLimit | null,
	) => {
		entries.push({
			key: getModelLimitKey(category),
			category,
			current,
			staged: edits.has(category)
				? (edits.get(category) ?? null)
				: current,
		});
	};
	if (access?.modelTotal) {
		add("MODEL", access.modelTotal.usageLimit);
	}
	if (access?.publicUse) {
		add("PUBLIC", access.publicUse.usageLimit);
	}
	return entries;
};

/**
 * @param entry - a model's total or public use limit
 * @returns whether the batch changes it
 */
export const isModelLimitChanged = (entry: ModelLimitEntry): boolean =>
	!isSameModelUsageLimit(entry.current, entry.staged);

/**
 * The changes a batch makes to a model's total and public use limit
 *
 * @param entries - the model's total and public use limit
 * @returns the changes, with the key of the entry each is for
 */
export const toModelLimitChanges = (
	entries: ModelLimitEntry[],
): { key: string; change: PermissionChange }[] =>
	entries
		.filter(isModelLimitChanged)
		.map((entry): { key: string; change: PermissionChange } => ({
			key: entry.key,
			change: {
				action: "CHANGE",
				subject: { category: entry.category },
				to: { usageLimit: entry.staged },
			},
		}));

/**
 * Brings copied people into a batch. People new to the batch are added with the
 * copied access; people the batch already gives the same access are left as
 * they are; everyone else is a conflict for the user to settle. On a model
 * without known prices, copied cost rules are left out, and the people they
 * belonged to are conflicts too, so the user sees the change before it is
 * staged. A user who cannot set usage limits copies levels and end dates only:
 * each person keeps the limit they have now.
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
	const canSetLimits = options.canSetLimits ?? true;
	for (const row of rows) {
		const copied: PermissionGrant | null = options.level
			? {
					level: options.level,
					...(options.usageLimit !== undefined
						? { usageLimit: options.usageLimit }
						: {}),
				}
			: row.source;
		if (!copied) {
			continue;
		}
		const key = getSubjectKey(row.subject);
		const existing = byKey.get(key);
		const isNew = !existing || (!existing.current && !existing.staged);
		// a user who cannot set limits copies levels and end dates only, so the
		// limit each person has now is carried forward as it is
		const currentLimit = existing?.current?.usageLimit ?? null;
		const kept = !options.keepModelLimits
			? withoutModelLimits(copied)
			: canSetLimits
				? copied
				: {
						...withoutModelLimits(copied),
						...(currentLimit ? { usageLimit: currentLimit } : {}),
					};
		const isCostLeftOut =
			options.keepModelLimits &&
			canSetLimits &&
			options.costLimitsAvailable === false &&
			hasCostRule(kept.usageLimit ?? null);
		const incoming = isCostLeftOut
			? { ...kept, usageLimit: withoutCostRules(kept.usageLimit) }
			: kept;
		if (isNew && !isCostLeftOut) {
			additions.push({
				subject: row.subject,
				person: row.subject,
				staged: incoming,
				note: options.note,
			});
			continue;
		}
		if (
			!isCostLeftOut &&
			existing?.staged &&
			isSameGrant(existing.staged, incoming)
		) {
			continue;
		}
		conflicts.push({
			key,
			person: existing?.person ?? row.subject,
			kept: existing?.staged ?? null,
			isNew,
			incoming,
			note: isCostLeftOut
				? `${options.note}, without its cost rules, since this model has no known prices`
				: options.note,
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

/**
 * @param endDate - when access ends, or null
 * @returns " until Dec 31, 2026", or nothing when it does not end
 */
const describeUntil = (endDate: string | null | undefined): string => {
	const date = formatLocalDateTime(endDate ?? undefined, "MMM D, YYYY");
	return date ? ` until ${date}` : "";
};

/**
 * @param limit - a usage limit, or null for no limit defined
 * @param source - where it is set
 * @returns the limit as the review says it, such as "usage limit 10,000
 *          tokens a day" or "no usage limit defined"
 */
const describeLimitPart = (
	limit: ModelUsageLimit | null | undefined,
	source: ModelUsageLimitSource,
): string =>
	limit
		? `usage limit ${describeModelUsageLimit(limit, source)}`
		: "no usage limit defined";

/**
 * What a change does to someone's access, in a few words for the review. A
 * change to both the level and a model usage limit names both.
 *
 * @param current - their access now, or null
 * @param staged - their access after the batch is saved, or null when it is taken away
 * @param source - where a model limit is set: a person's grant or a team's
 * @returns such as "Editor until Dec 31, 2026", "Read-Only to Editor",
 *          "Read-Only to Editor, usage limit 10,000 tokens a day" or
 *          "Loses Author"
 */
export const describeChangeDetail = (
	current: PermissionGrant | null,
	staged: PermissionGrant | null,
	source: ModelUsageLimitSource = "DIRECT",
): string => {
	if (!staged) {
		return current ? `Loses ${getLevelLabel(current.level)}` : "";
	}
	const level = getLevelLabel(staged.level);
	const until = describeUntil(staged.endDate);
	if (!current) {
		return staged.usageLimit
			? `${level}${until}, ${describeLimitPart(staged.usageLimit, source)}`
			: `${level}${until}`;
	}
	const parts: string[] = [];
	if (current.level !== staged.level) {
		parts.push(`${getLevelLabel(current.level)} to ${level}${until}`);
	} else if ((current.endDate ?? null) !== (staged.endDate ?? null)) {
		parts.push(
			staged.endDate ? `${level}, now${until}` : `${level}, no end date`,
		);
	} else {
		parts.push(level);
	}
	if (!isSameModelUsageLimit(current.usageLimit, staged.usageLimit)) {
		parts.push(describeLimitPart(staged.usageLimit, source));
	}
	return parts.join(", ");
};

/**
 * What a change does to a model's total or public use limit, for the review
 *
 * @param entry - the model's total or public use limit
 * @returns such as "$2,000 a month, was No Limit Defined"
 */
export const describeModelLimitChange = (entry: ModelLimitEntry): string => {
	const source = entry.category === "MODEL" ? "MODEL_TOTAL" : "PUBLIC";
	return `${describeModelUsageLimit(entry.staged, source)}, was ${describeModelUsageLimit(entry.current, source)}`;
};
