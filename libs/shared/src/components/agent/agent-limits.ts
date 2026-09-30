import { useCallback } from "react";
import { useTranslation } from "@semoss/i18n";
import type { AgentWorkspace } from "./agent.types";

export type AgentLimitName =
	| "maxTurns"
	| "maxReflections"
	| "maxSeconds"
	| "maxSubagentDepth"
	| "maxSubagentsPerRun"
	| "maxSpawnsPerTurn";

export type AgentLimitUnit =
	| "turns"
	| "rounds"
	| "seconds"
	| "levels"
	| "subagents";

/**
 * One execution limit. Labels and descriptions live in the `agent` i18n
 * namespace under `limits.<name>`.
 */
export type AgentLimitConfig = {
	name: AgentLimitName;
	unit: AgentLimitUnit;
	/** Smallest accepted value. Mirrors EditWorkspaceReactor's per-field minimum. */
	min: number;
	/** Runtime default used when the field is blank. */
	defaultValue: string;
};

/**
 * Run budgets are ceilings: the runtime uses the lower of what a run
 * requests and the value set here.
 */
export const AGENT_RUN_BUDGET_LIMITS: AgentLimitConfig[] = [
	{ name: "maxTurns", unit: "turns", min: 1, defaultValue: "30" },
	{ name: "maxReflections", unit: "rounds", min: 0, defaultValue: "0" },
	{ name: "maxSeconds", unit: "seconds", min: 0, defaultValue: "0" },
];

export const AGENT_DELEGATION_LIMITS: AgentLimitConfig[] = [
	{ name: "maxSubagentDepth", unit: "levels", min: 0, defaultValue: "1" },
	{
		name: "maxSubagentsPerRun",
		unit: "subagents",
		min: 0,
		defaultValue: "10",
	},
	{ name: "maxSpawnsPerTurn", unit: "subagents", min: 0, defaultValue: "5" },
];

/** Reads each limit from `GetWorkspace`'s config as a string; blank means unset. */
export const getAgentLimitValues = (
	workspace: AgentWorkspace,
): Record<AgentLimitName, string> => {
	const budgets = workspace.config_json?.budgets;
	const spawn = workspace.config_json?.spawn_policy;
	return {
		maxTurns: budgets?.max_turns?.toString() ?? "",
		maxReflections: budgets?.max_reflections?.toString() ?? "",
		maxSeconds: budgets?.max_seconds?.toString() ?? "",
		maxSubagentDepth: spawn?.max_subagent_depth?.toString() ?? "",
		maxSubagentsPerRun: spawn?.max_subagents_per_run?.toString() ?? "",
		maxSpawnsPerTurn: spawn?.max_spawns_per_turn?.toString() ?? "",
	};
};

/**
 * Translated helpers for execution limits: validation messages, readable
 * durations, and view-mode values such as "30 turns (default)".
 */
export const useAgentLimitFormat = () => {
	const { t } = useTranslation("agent");

	/** Error message when `value` is set but not a whole number >= `min`. */
	const validate = useCallback(
		(value: string, min: number): string | undefined => {
			if (value === "" || value == null) return undefined;
			const parsed = Number(value);
			if (!Number.isInteger(parsed))
				return t("limits.errors.wholeNumber");
			if (parsed < min) return t("limits.errors.min", { min });
			return undefined;
		},
		[t],
	);

	/** A seconds value as e.g. "15 min"; undefined for blank or under a minute. */
	const formatDuration = useCallback(
		(value: string): string | undefined => {
			const seconds = Number(value);
			if (!Number.isInteger(seconds) || seconds < 60) return undefined;
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			const rest = seconds % 60;
			return [
				hours ? t("limits.duration.hours", { count: hours }) : "",
				minutes ? t("limits.duration.minutes", { count: minutes }) : "",
				rest ? t("limits.duration.seconds", { count: rest }) : "",
			]
				.filter(Boolean)
				.join(" ");
		},
		[t],
	);

	/** A limit for view mode, e.g. "30 turns (default)" or "No limit". */
	const formatValue = useCallback(
		(value: string, config: AgentLimitConfig): string => {
			const isDefault = value === "" || value == null;
			const raw = isDefault ? config.defaultValue : value;
			let text: string;
			if (config.name === "maxSeconds" && Number(raw) === 0) {
				text = t("limits.noLimit");
			} else if (config.name === "maxSeconds") {
				text =
					formatDuration(raw) ??
					t("limits.count.seconds", { count: Number(raw) });
			} else {
				text = t(`limits.count.${config.unit}`, { count: Number(raw) });
			}
			return isDefault ? t("limits.isDefault", { value: text }) : text;
		},
		[t, formatDuration],
	);

	return { t, validate, formatDuration, formatValue };
};

/** Frames each limit so the limits grid reads as distinct settings. */
export const AGENT_LIMIT_TILE_CLASS_NAME =
	"h-full rounded-md border border-border bg-card p-4";
