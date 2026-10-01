import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	H3,
	Muted,
	Progress,
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { rankingQuery } from "@/api/enterprise-usage-requests";
import type { UsageDimension, UsageFilters } from "./usage.types";
import { formatMetric, numeric } from "./usage-metrics";
import { UsageState } from "./usage-state";
import { useUsageExport } from "./use-usage-export";
import { useUsageQuery } from "./use-usage-query";

interface UsageRankingsProps {
	/** Shared applied report filters. */
	filters: UsageFilters;
	/** Opens the message log for a stable entity identifier. */
	onDrill: (dimension: UsageDimension, id: string) => void;
}

/** Top consumers by token volume, with identity-preserving drill-down. */
export function UsageRankings({ filters, onDrill }: UsageRankingsProps) {
	const [dimension, setDimension] = useState<UsageDimension>("model");
	const { isExporting, exportError, exportStatus, exportReport } =
		useUsageExport();
	const result = useUsageQuery(rankingQuery(filters, dimension));
	const maxTokens = Math.max(
		1,
		...result.rows.map((row) => numeric(row, "TOKENS") ?? 0),
	);
	return (
		<section className="min-w-0 space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<H3>Top Consumers</H3>
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
			<Muted>
				Top 20 By Recorded Tokens In The Selected Period. Bars Are
				Relative To The Largest Consumer. Select A Name To Inspect Its
				Messages. Search By Name Or ID In The Filters To Find Any Other
				Entity.
			</Muted>
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
												"Relative Volume",
												"Input Tokens",
												"Output Tokens",
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
														<Tooltip>
															<TooltipTrigger
																asChild
															>
																<Progress
																	value={
																		((numeric(
																			row,
																			"TOKENS",
																		) ??
																			0) /
																			maxTokens) *
																		100
																	}
																	aria-label={`${row.ENTITY_NAME || row.ENTITY_ID || "Unattributed"} Relative Token Volume`}
																	className="w-24 focus-visible:outline-2 focus-visible:outline-ring"
																	tabIndex={0}
																/>
															</TooltipTrigger>
															<TooltipContent>
																<div>
																	{String(
																		row.ENTITY_NAME ||
																			row.ENTITY_ID ||
																			"Unattributed",
																	)}
																</div>
																<div>
																	Total
																	Tokens:{" "}
																	{formatMetric(
																		numeric(
																			row,
																			"TOKENS",
																		),
																	)}
																</div>
																<div>
																	Requests:{" "}
																	{formatMetric(
																		numeric(
																			row,
																			"REQUESTS",
																		),
																	)}
																</div>
																<div>
																	{formatMetric(
																		(Number(
																			row.TOKENS,
																		) /
																			maxTokens) *
																			100,
																		1,
																	)}
																	% Of The
																	Largest
																	Consumer's
																	Tokens
																</div>
															</TooltipContent>
														</Tooltip>
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
