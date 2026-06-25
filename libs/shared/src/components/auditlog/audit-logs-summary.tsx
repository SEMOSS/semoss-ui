import type React from "react";
import { Fragment, useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import type { EventData } from "./common";

interface AuditLogsSummaryProps {
	logs: EventData[];
	totalCount: number;
}

const isSuccess = (status: EventData["status"]) =>
	Boolean(status) && status !== "false";

//Nearest-rank percentile over an ascending array.
const percentile = (sorted: number[], p: number) => {
	if (sorted.length === 0) return 0;
	const rank = Math.min(
		sorted.length - 1,
		Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
	);
	return sorted[rank];
};

//962 → "962ms", 37600 → "37.6s".
const formatLatency = (ms: number) =>
	ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;

//2300 → "2.3K", 1_200_000 → "1.2M".
const formatCompact = (n: number) => {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
	return String(n);
};

/**
 * A compact, single-line KPI strip for the audit logs — scannable metrics that sit
 * above the timeline without competing with it. totalCount is the server total
 * (all matched rows); the latency / error / token figures are computed over the
 * currently loaded page.
 */
export const AuditLogsSummary: React.FC<AuditLogsSummaryProps> = ({
	logs,
	totalCount,
}) => {
	const { t } = useTranslation("auditlog");
	const stats = useMemo(() => {
		const latencies = logs
			.map((log) => Number(log.latency))
			.filter((value) => Number.isFinite(value))
			.sort((a, b) => a - b);
		const tokens = logs.reduce(
			(sum, log) => sum + (Number(log.tokens) || 0),
			0,
		);
		const failures = logs.filter((log) => !isSuccess(log.status)).length;
		return {
			p50: percentile(latencies, 50),
			p95: percentile(latencies, 95),
			tokens,
			failures,
		};
	}, [logs]);

	const value = (text: string, danger = false) => (
		<span
			className={`font-semibold ${danger ? "text-destructive" : "text-foreground"}`}
		>
			{text}
		</span>
	);

	const metrics: { key: string; node: React.ReactNode }[] = [
		{
			key: "events",
			node: (
				<>
					{value(totalCount.toLocaleString())} {t("summary.events")}
				</>
			),
		},
		{
			key: "shown",
			node: (
				<>
					{value(logs.length.toLocaleString())} {t("summary.shown")}
				</>
			),
		},
		{
			key: "errors",
			node: (
				<>
					{value(String(stats.failures), stats.failures > 0)}{" "}
					{t("summary.errors")}
				</>
			),
		},
		{
			key: "p50",
			node: (
				<>
					{t("summary.p50")} {value(formatLatency(stats.p50))}
				</>
			),
		},
		{
			key: "p95",
			node: (
				<>
					{t("summary.p95")} {value(formatLatency(stats.p95))}
				</>
			),
		},
		{
			key: "tokens",
			node: (
				<>
					{value(formatCompact(stats.tokens))} {t("summary.tokens")}
				</>
			),
		},
	];

	return (
		<div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-muted-foreground text-sm">
			{metrics.map((metric, index) => (
				<Fragment key={metric.key}>
					{index > 0 && (
						<span className="text-muted-foreground/40">•</span>
					)}
					<span>{metric.node}</span>
				</Fragment>
			))}
			<span
				className="ms-auto text-muted-foreground/70 text-xs"
				title={t("summary.currentPageHint")}
			>
				{t("summary.currentPage")}
			</span>
		</div>
	);
};
