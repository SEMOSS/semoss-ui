import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	H3,
	Muted,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { rankingQuery, summaryQuery } from "@/api/enterprise-usage-requests";
import type { UsageDimension, UsageFilters, UsageRow } from "./usage.types";
import { formatCost, formatMetric, numeric } from "./usage-metrics";
import { UsageNotes } from "./usage-notes";
import { UsageShareBar } from "./usage-share-bar";
import { UsageState } from "./usage-state";
import { useUsageExport } from "./use-usage-export";
import { useUsageQuery } from "./use-usage-query";

/** How to read the rankings. */
const RANKING_NOTES = [
	"Top 20 By Recorded Tokens In The Selected Period.",
	"Token Share And Cost Share Are Each Consumer's Part Of All Tokens And Cost In The Selected Period, So The Bars Add Up To At Most 100%.",
	"Cost Is What The Calls Recorded, With Calls Logged Before Costs Were Recorded At Current Prices.",
	"Select A Name To Inspect Its Messages.",
	"Search By Name Or ID In The Filters To Find Any Other Entity.",
] as const;

interface UsageRankingsProps {
	/** Shared applied report filters. */
	filters: UsageFilters;
	/** Opens the message log for a stable entity identifier. */
	onDrill: (dimension: UsageDimension, id: string) => void;
}

/** What a share bar's total is, and what it is called */
interface ShareTotal {
	/** The amount every consumer's share is of */
	total: number;
	/** What the total is, as the bar's tooltip says it */
	label: string;
}

/**
 * The total a consumer's share is of: everyone's amount in the period, from
 * the summary, or the listed consumers' together until the summary is read or
 * when it cannot be, named so the tooltip says which.
 *
 * @param measure - what is added up, such as "Tokens" or "Cost"
 */
function shareTotal(
	summary: UsageRow | undefined,
	ranked: UsageRow[],
	key: string,
	measure: string,
): ShareTotal {
	const period = numeric(summary, key);
	if (period !== null)
		return { total: period, label: `All ${measure} In The Period` };
	return {
		total: ranked.reduce((sum, row) => sum + (numeric(row, key) ?? 0), 0),
		label: `The Listed Consumers' ${measure}`,
	};
}

/** A ranked consumer's name, or its id when it has none. */
function entityName(row: UsageRow): string {
	return String(row.ENTITY_NAME || row.ENTITY_ID || "Unattributed");
}

/** Top consumers by token volume, with identity-preserving drill-down. */
export function UsageRankings({ filters, onDrill }: UsageRankingsProps) {
	const [dimension, setDimension] = useState<UsageDimension>("model");
	const { isExporting, exportError, exportStatus, exportReport } =
		useUsageExport();
	const result = useUsageQuery(rankingQuery(filters, dimension));
	// everyone's tokens and cost in the period, not only the consumers ranked,
	// so each bar is a consumer's share and the bars add up to at most 100%
	const summary = useUsageQuery(summaryQuery("model", filters));
	const tokenShare = shareTotal(
		summary.rows[0],
		result.rows,
		"TOKENS",
		"Tokens",
	);
	const costShare = shareTotal(
		summary.rows[0],
		result.rows,
		"COST_MICROS",
		"Cost",
	);
	return (
		<section className="min-w-0 space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-1">
					<H3>Top Consumers</H3>
					<UsageNotes title="Top Consumers" notes={RANKING_NOTES} />
				</div>
				<Button
					variant="outline"
					disabled={
						isExporting ||
						result.isLoading ||
						Boolean(result.error) ||
						!result.rows.length
					}
					onClick={() =>
						exportReport({
							view: "ranking",
							format: "csv",
							source: "model",
							filters,
							dimension,
						})
					}
				>
					Export Top 20 CSV
				</Button>
			</div>
			<output
				className={
					isExporting || exportStatus
						? "block text-muted-foreground text-xs"
						: "sr-only"
				}
			>
				{isExporting ? "Preparing Export..." : exportStatus}
			</output>
			{exportError && (
				<Alert variant="destructive">
					<AlertDescription>{exportError}</AlertDescription>
				</Alert>
			)}
			<Tabs
				value={dimension}
				onValueChange={(value) => {
					if (
						value === "model" ||
						value === "user" ||
						value === "app"
					)
						setDimension(value);
				}}
			>
				<TabsList aria-label="Group Model Usage">
					<TabsTrigger value="model">Models</TabsTrigger>
					<TabsTrigger value="user">Users</TabsTrigger>
					<TabsTrigger value="app">Apps</TabsTrigger>
				</TabsList>
				<TabsContent value={dimension}>
					<UsageState result={result} label="Top Consumers">
						{result.rows.length === 0 ? (
							<Muted>No Consumers Match These Filters.</Muted>
						) : (
							<section
								aria-label="Top Consumers"
								// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard scrolling of the bounded table requires a focus target.
								tabIndex={0}
								className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring"
							>
								<Table
									wrapperClassName="overflow-visible"
									className="text-xs [&_td]:py-1 [&_th]:h-8"
								>
									<TableHeader>
										<TableRow>
											{[
												"Name / ID",
												"Requests",
												"Total Tokens",
												"Token Share",
												"Input Tokens",
												"Output Tokens",
												"Cost",
												"Cost Share",
												"Avg. Latency (s)",
												"Users",
											].map((label) => (
												<TableHead
													scope="col"
													key={label}
												>
													{label}
												</TableHead>
											))}
										</TableRow>
									</TableHeader>
									<TableBody>
										{result.rows.map((row) => (
											<TableRow
												key={String(
													row.ENTITY_ID ??
														"unattributed",
												)}
											>
												<TableCell className="max-w-64 whitespace-normal break-words">
													{row.ENTITY_ID ? (
														<>
															<Button
																variant="link"
																className="h-auto max-w-full whitespace-normal break-words p-0 text-left"
																onClick={() =>
																	onDrill(
																		dimension,
																		String(
																			row.ENTITY_ID,
																		),
																	)
																}
															>
																{String(
																	row.ENTITY_NAME ||
																		row.ENTITY_ID,
																)}
															</Button>
															<div className="text-muted-foreground text-xs">
																{String(
																	row.ENTITY_ID,
																)}
															</div>
														</>
													) : (
														"Unattributed"
													)}
												</TableCell>
												<TableCell>
													{formatMetric(
														numeric(
															row,
															"REQUESTS",
														),
													)}
												</TableCell>
												<TableCell>
													{formatMetric(
														numeric(row, "TOKENS"),
													)}
												</TableCell>
												<TableCell>
													{numeric(row, "TOKENS") ===
													null ? (
														"-"
													) : (
														<UsageShareBar
															name={entityName(
																row,
															)}
															measure="Tokens"
															value={
																numeric(
																	row,
																	"TOKENS",
																) ?? 0
															}
															total={
																tokenShare.total
															}
															totalLabel={
																tokenShare.label
															}
															details={[
																`Total Tokens: ${formatMetric(numeric(row, "TOKENS"))}`,
																`Requests: ${formatMetric(numeric(row, "REQUESTS"))}`,
															]}
														/>
													)}
												</TableCell>
												<TableCell>
													{formatMetric(
														numeric(
															row,
															"INPUT_TOKENS",
														),
													)}
												</TableCell>
												<TableCell>
													{formatMetric(
														numeric(
															row,
															"OUTPUT_TOKENS",
														),
													)}
												</TableCell>
												<TableCell className="tabular-nums">
													{formatCost(
														numeric(
															row,
															"COST_MICROS",
														),
													)}
												</TableCell>
												<TableCell>
													{numeric(
														row,
														"COST_MICROS",
													) === null ? (
														"-"
													) : (
														<UsageShareBar
															name={entityName(
																row,
															)}
															measure="Cost"
															value={
																numeric(
																	row,
																	"COST_MICROS",
																) ?? 0
															}
															total={
																costShare.total
															}
															totalLabel={
																costShare.label
															}
															details={[
																`Cost: ${formatCost(numeric(row, "COST_MICROS"))}`,
																`Priced Requests: ${formatMetric(numeric(row, "PRICED_REQUESTS"))} Of ${formatMetric(numeric(row, "REQUESTS"))}`,
															]}
														/>
													)}
												</TableCell>
												<TableCell>
													{formatMetric(
														numeric(
															row,
															"LATENCY_MS",
														) === null
															? null
															: Number(
																	row.LATENCY_MS,
																) / 1000,
														2,
													)}
												</TableCell>
												<TableCell>
													{formatMetric(
														numeric(row, "USERS"),
													)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</section>
						)}
					</UsageState>
				</TabsContent>
			</Tabs>
		</section>
	);
}
