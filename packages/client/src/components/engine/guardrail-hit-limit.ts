import { z } from "@semoss/ui/next";
import { isRecord } from "@semoss/utility/object";
import type {
	GuardrailConfigIssue,
	GuardrailFailureAction,
	GuardrailPipelineFormValue,
} from "./engine-guardrail-settings.constants";

/**
 * Types and pure helpers for an engine's guardrail hit limits: how many hits of
 * which checks close the room, or lock the user out of the engine. The limits
 * sit beside the pipelines in pipeline.json and name checks by their checkId.
 */

/** Whose hits a limit counts: the room's, or the user's in a rolling window */
const GUARDRAIL_HIT_LIMIT_SCOPES = ["ROOM", "USER"] as const;

/** The units a window or a lock is entered in, each as minutes */
export const GUARDRAIL_DURATION_UNITS = {
	minutes: 1,
	hours: 60,
	days: 1440,
} as const;

/** The longest a window or a lock can be, as the backend allows: a year */
const MAX_MINUTES = 366 * 1440;

/** The most hits a limit can take, as the backend allows: Java's largest int */
const MAX_HITS = 2147483647;

const durationUnitSchema = z.enum(["minutes", "hours", "days"]);

export const guardrailHitLimitSchema = z.object({
	/** The form's key for the limit */
	id: z.string(),
	/** The limit's id in pipeline.json */
	limitId: z.string(),
	/** The checkIds whose hits count */
	checks: z.array(z.string()),
	/** How many hits reach the limit, as the number field holds it */
	hits: z.string(),
	scope: z.enum(GUARDRAIL_HIT_LIMIT_SCOPES),
	windowAmount: z.string(),
	windowUnit: durationUnitSchema,
	lockAmount: z.string(),
	lockUnit: durationUnitSchema,
	message: z.string(),
});

export type GuardrailHitLimitFormValue = z.infer<
	typeof guardrailHitLimitSchema
>;
export type GuardrailHitLimitScope = GuardrailHitLimitFormValue["scope"];
export type GuardrailDurationUnit = keyof typeof GUARDRAIL_DURATION_UNITS;

/** A check a hit limit can count, as the limit editor lists it */
export interface GuardrailHitLimitCheck {
	/** The check's id, which the limit names it by */
	checkId: string;

	/** The guardrail engine the check runs */
	name: string;

	/** Where the check runs and what it does, such as "askRoom request, blocks" */
	detail: string;
}

const ACTION_WORDS: Record<GuardrailFailureAction, string> = {
	block: "blocks",
	mask: "masks",
	respond: "answers",
};

/**
 * Every check of the configuration, in rule order, as a hit limit lists them.
 *
 * @param pipelines - The rules.
 * @param engineName - The name of a guardrail engine, by its id.
 * @returns The checks.
 */
export const guardrailHitLimitChecks = (
	pipelines: GuardrailPipelineFormValue[],
	engineName: (engineId: string) => string | undefined,
): GuardrailHitLimitCheck[] =>
	pipelines.flatMap((pipeline) => {
		const method = pipeline.method.trim();
		const call = method === "*" ? "every call" : method || "no call";
		return (["input", "output"] as const).flatMap((phase) =>
			pipeline[phase].map((entry) => ({
				checkId: entry.checkId,
				name: entry.guardrailEngineId
					? (engineName(entry.guardrailEngineId) ??
						entry.guardrailEngineId)
					: "No guardrail engine selected",
				detail: `${call} ${phase === "input" ? "request" : "response"}, ${
					ACTION_WORDS[
						phase === "output" ? "block" : entry.failureAction
					]
				}`,
			})),
		);
	});

/**
 * The next id in order for a prefix, such as check3 after check0 to check2: one
 * past the highest number the ids hold, so an id is never handed out twice
 * even after one in the middle is removed.
 *
 * @param prefix - The ids' prefix, such as check or limit.
 * @param ids - The ids already used.
 * @returns The id.
 */
export const nextOrderedId = (prefix: string, ids: string[]): string => {
	const pattern = new RegExp(`^${prefix}(\\d+)$`);
	let next = 0;
	for (const id of ids) {
		const match = pattern.exec(id);
		if (match) {
			next = Math.max(next, Number(match[1]) + 1);
		}
	}
	return `${prefix}${next}`;
};

let hitLimitKeySeed = 0;

/**
 * A new limit: three hits of the given checks close the room. Switched to a
 * user limit, it counts a day of hits and locks the user out for an hour.
 *
 * @param checks - The checkIds whose hits it counts.
 * @param others - The limits the configuration has, which its id follows.
 * @returns The limit.
 */
export const createGuardrailHitLimit = (
	checks: string[] = [],
	others: GuardrailHitLimitFormValue[] = [],
): GuardrailHitLimitFormValue => ({
	id: `hit-limit-${++hitLimitKeySeed}`,
	limitId: nextOrderedId(
		"limit",
		others.map((limit) => limit.limitId),
	),
	checks,
	hits: "3",
	scope: "ROOM",
	windowAmount: "1",
	windowUnit: "days",
	lockAmount: "1",
	lockUnit: "hours",
	message: "",
});

/**
 * A number of minutes in the largest unit it fills evenly, such as 120 as 2
 * hours.
 *
 * @param minutes - The minutes.
 * @returns The amount and unit.
 */
export const durationFromMinutes = (
	minutes: number,
): { amount: string; unit: GuardrailDurationUnit } => {
	for (const unit of ["days", "hours"] as const) {
		const size = GUARDRAIL_DURATION_UNITS[unit];
		if (minutes >= size && minutes % size === 0) {
			return { amount: String(minutes / size), unit };
		}
	}
	return { amount: String(minutes), unit: "minutes" };
};

/** A whole number of at least 1 and at most max, or null */
const wholeNumber = (text: string, max: number): number | null => {
	const trimmed = text.trim();
	if (!/^\d+$/.test(trimmed)) {
		return null;
	}
	const value = Number(trimmed);
	return value >= 1 && value <= max ? value : null;
};

/** A duration in minutes, or null when it is not a whole number of units */
const durationMinutes = (
	amount: string,
	unit: GuardrailDurationUnit,
): number | null => {
	const size = GUARDRAIL_DURATION_UNITS[unit];
	const value = wholeNumber(amount, Math.floor(MAX_MINUTES / size));
	return value === null ? null : value * size;
};

const UNIT_WORDS: Record<GuardrailDurationUnit, [string, string]> = {
	minutes: ["minute", "minutes"],
	hours: ["hour", "hours"],
	days: ["day", "days"],
};

/** A duration in words, such as "1 hour" or "2 days", or null when invalid */
const durationWords = (
	amount: string,
	unit: GuardrailDurationUnit,
): string | null => {
	if (durationMinutes(amount, unit) === null) {
		return null;
	}
	const value = Number(amount.trim());
	return `${value} ${UNIT_WORDS[unit][value === 1 ? 0 : 1]}`;
};

/**
 * What a limit does, in one sentence, such as "Locks the user out for 1 hour
 * once they reach 3 hits within 1 day."
 *
 * @param limit - The limit.
 * @returns The sentence, or null while one of its numbers is not valid.
 */
export const describeGuardrailHitLimit = (
	limit: GuardrailHitLimitFormValue,
): string | null => {
	const hits = wholeNumber(limit.hits, MAX_HITS);
	if (hits === null) {
		return null;
	}
	if (limit.scope === "ROOM") {
		return hits === 1
			? "Closes the room on its first hit."
			: `Closes the room once it reaches ${hits} hits.`;
	}
	const window = durationWords(limit.windowAmount, limit.windowUnit);
	const lock = durationWords(limit.lockAmount, limit.lockUnit);
	if (window === null || lock === null) {
		return null;
	}
	return `Locks the user out for ${lock} once they reach ${hits} ${
		hits === 1 ? "hit" : "hits"
	} within ${window}.`;
};

/**
 * Reads the hitLimits list GetEngineGuardrailConfig returned, keeping each
 * entry shaped as a limit.
 *
 * @param raw - The list.
 * @returns The limits, in order.
 */
export const guardrailHitLimitsFromResponse = (
	raw: unknown,
): GuardrailHitLimitFormValue[] => {
	if (!Array.isArray(raw)) {
		return [];
	}
	return raw.flatMap((entry) => {
		if (!isRecord(entry) || typeof entry.limitId !== "string") {
			return [];
		}
		const limit = createGuardrailHitLimit(
			Array.isArray(entry.checks)
				? entry.checks.filter(
						(check): check is string => typeof check === "string",
					)
				: [],
		);
		limit.limitId = entry.limitId;
		limit.hits = typeof entry.hits === "number" ? String(entry.hits) : "";
		limit.scope = entry.scope === "USER" ? "USER" : "ROOM";
		if (typeof entry.windowMinutes === "number") {
			const window = durationFromMinutes(entry.windowMinutes);
			limit.windowAmount = window.amount;
			limit.windowUnit = window.unit;
		}
		if (typeof entry.lockMinutes === "number") {
			const lock = durationFromMinutes(entry.lockMinutes);
			limit.lockAmount = lock.amount;
			limit.lockUnit = lock.unit;
		}
		limit.message = typeof entry.message === "string" ? entry.message : "";
		return [limit];
	});
};

/**
 * The limits as pipeline.json stores them, for UpdateEngineGuardrailConfig.
 * Run on a value that has no limit issues.
 *
 * @param limits - The limits.
 * @returns The hitLimits list.
 */
export const guardrailHitLimitsToConfig = (
	limits: GuardrailHitLimitFormValue[],
): Record<string, unknown>[] =>
	limits.map((limit) => {
		const config: Record<string, unknown> = {
			limitId: limit.limitId,
			checks: limit.checks,
			hits: Number(limit.hits.trim()),
			scope: limit.scope,
		};
		if (limit.scope === "USER") {
			config.windowMinutes = durationMinutes(
				limit.windowAmount,
				limit.windowUnit,
			);
			config.lockMinutes = durationMinutes(
				limit.lockAmount,
				limit.lockUnit,
			);
		}
		if (limit.message.trim()) {
			config.message = limit.message.trim();
		}
		return config;
	});

/**
 * Every problem with the limits, each targeted at its limit.
 *
 * @param limits - The limits.
 * @param checkIds - The checkIds of the checks the configuration has now.
 * @returns The issues, in the order the limits are listed.
 */
export const collectGuardrailHitLimitIssues = (
	limits: GuardrailHitLimitFormValue[],
	checkIds: Set<string>,
): GuardrailConfigIssue[] => {
	const issues: GuardrailConfigIssue[] = [];
	limits.forEach((limit, index) => {
		const name = `Hit limit ${index + 1}`;
		const target = { limitId: limit.id };
		if (limit.checks.length === 0) {
			issues.push({
				message: `${name} counts no checks. Choose the checks whose hits count.`,
				severity: "error",
				...target,
			});
		} else if (limit.checks.some((check) => !checkIds.has(check))) {
			issues.push({
				message: `${name} counts a check that was removed. Choose the checks again.`,
				severity: "error",
				...target,
			});
		}
		if (wholeNumber(limit.hits, MAX_HITS) === null) {
			issues.push({
				message: `${name} needs a whole number of hits, from 1 to ${MAX_HITS}.`,
				severity: "error",
				...target,
			});
		}
		if (limit.scope === "USER") {
			if (
				durationMinutes(limit.windowAmount, limit.windowUnit) === null
			) {
				issues.push({
					message: `${name} needs a whole number for how far back it counts hits, up to a year.`,
					severity: "error",
					...target,
				});
			}
			if (durationMinutes(limit.lockAmount, limit.lockUnit) === null) {
				issues.push({
					message: `${name} needs a whole number for how long the user is locked out, up to a year.`,
					severity: "error",
					...target,
				});
			}
		}
	});
	return issues;
};
