import { shiftDate } from "@/api/enterprise-usage-requests";
import type { UsageFilters, UsageRow } from "./usage.types";

/** Null means unreported, not zero. */
export function numeric(row: UsageRow | undefined, key: string): number | null {
	const value = row?.[key];
	if (
		value === null ||
		value === undefined ||
		value === "" ||
		typeof value === "boolean"
	)
		return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

/** Displays an explicit unavailable marker for missing telemetry. */
export function formatMetric(value: number | null, fractionDigits = 0): string {
	return value === null
		? "-"
		: value.toLocaleString(undefined, {
				maximumFractionDigits: fractionDigits,
			});
}

/** Percentages require an observed denominator. */
export function percentage(
	numerator: number | null,
	denominator: number | null,
): number | null {
	return numerator === null || denominator === null || denominator === 0
		? null
		: (numerator / denominator) * 100;
}

/** A zero baseline has no meaningful percentage change. */
export function periodChange(
	current: number | null,
	previous: number | null,
	periods?: { currentDays: number; benchmarkDays: number },
): string {
	if (current === null || previous === null) return "Benchmark Unavailable";
	if (periods && periods.currentDays !== periods.benchmarkDays) {
		return `${periodChange(current / periods.currentDays, previous / periods.benchmarkDays)} (Per Day)`;
	}
	if (previous === 0)
		return current === 0
			? "No Change From Benchmark"
			: "New Activity Vs. Benchmark";
	const difference = ((current - previous) / previous) * 100;
	return `${difference > 0 ? "+" : ""}${formatMetric(difference, 1)}% Vs. Benchmark`;
}

/** Fills quiet calendar days while preserving missing latency as unavailable. */
export function fillUsageDays(
	rows: UsageRow[],
	filters: UsageFilters,
): UsageRow[] {
	const byDay = new Map(
		rows.map((row) => [String(row.DAY).slice(0, 10), row]),
	);
	const filled: UsageRow[] = [];
	for (
		let date = filters.from;
		date <= filters.to;
		date = shiftDate(date, 1)
	) {
		filled.push(
			byDay.get(date) ?? {
				DAY: date,
				REQUESTS: 0,
				USERS: 0,
				TOKENS: 0,
				INPUT_TOKENS: 0,
				OUTPUT_TOKENS: 0,
				EVENTS: 0,
				FAILED: 0,
				LATENCY_MS: null,
			},
		);
	}
	return filled;
}

export interface UsageKpi {
	label: string;
	value: string;
	description: string;
}

/** Formats model KPIs and benchmark changes while preserving unavailable values. */
export function modelKpis(
	current: UsageRow,
	previous?: UsageRow,
	p95?: UsageRow,
	feedback?: UsageRow,
	periods?: { currentDays: number; benchmarkDays: number },
): UsageKpi[] {
	const metric = (key: string): number | null => numeric(current, key);
	const comparable = (label: string, key: string): UsageKpi => ({
		label,
		value: formatMetric(metric(key)),
		description: ["REQUESTS", "TOKENS"].includes(key)
			? periodChange(metric(key), numeric(previous, key), periods)
			: periods && periods.currentDays !== periods.benchmarkDays
				? `Benchmark: ${formatMetric(numeric(previous, key))} | Unequal Period Lengths`
				: periodChange(metric(key), numeric(previous, key)),
	});
	const latency = metric("LATENCY_MS");
	const p95ms = numeric(p95, "P95_MS");
	const positive = percentage(
		numeric(feedback, "POSITIVE"),
		numeric(feedback, "RATINGS"),
	);
	return [
		comparable("Model Requests", "REQUESTS"),
		comparable("Total Tokens", "TOKENS"),
		comparable("Active Users", "USERS"),
		comparable("Active Apps", "APPS"),
		comparable("Active Models", "MODELS"),
		comparable("Conversations", "ROOMS"),
		{
			label: "Average Latency",
			value:
				latency === null ? "-" : `${formatMetric(latency / 1000, 2)} s`,
			description: "Recorded Model Responses",
		},
		{
			label: "P95 Latency",
			value: p95ms === null ? "-" : `${formatMetric(p95ms / 1000, 2)} s`,
			description: "95% Of Recorded Responses At Or Below",
		},
		{
			label: "Positive Feedback",
			value: positive === null ? "-" : `${formatMetric(positive, 1)}%`,
			description: `${formatMetric(numeric(feedback, "RATINGS"))} Rated Responses`,
		},
	];
}
