import { LineChart } from "echarts/charts";
import {
	AriaComponent,
	BrushComponent,
	GridComponent,
	TooltipComponent,
} from "echarts/components";
import { type EChartsCoreOption, init, use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { RotateCcw } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	H4,
	Muted,
	readChartTokens,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import type { UsageDateRange, UsageRow } from "./usage.types";
import { formatMetric, numeric } from "./usage-metrics";

use([
	LineChart,
	GridComponent,
	TooltipComponent,
	BrushComponent,
	AriaComponent,
	SVGRenderer,
]);

interface TrendSeries {
	key: string;
	label: string;
	/** One of the five semantic chart colors. */
	color: 1 | 2 | 3 | 4 | 5;
	/** Converts stored values to chart units. */
	divisor?: number;
}
interface UsageTrendProps {
	/** Heading and accessible chart name. */
	title: string;
	/** Current daily data, including quiet days. */
	rows: UsageRow[];
	/** Benchmark daily data aligned by ordinal day. */
	comparisonRows?: UsageRow[];
	/** Named series using semantic chart colors. */
	series: TrendSeries[];
	/** Applied selection, shared across report tabs. */
	selectedRange: UsageDateRange | null;
	/** Applies the inclusive date range selected by dragging across the plot. */
	onRange: (range: UsageDateRange) => void;
	/** Restores the report window preceding the chart selection. */
	onClearRange: () => void;
}

/** Converts ECharts' category brush interval to bounded, inclusive calendar dates. */
export function usageBrushRange(
	event: unknown,
	rows: UsageRow[],
): UsageDateRange | null {
	if (
		!event ||
		typeof event !== "object" ||
		!("areas" in event) ||
		!Array.isArray(event.areas)
	)
		return null;
	const area: unknown = event.areas[0];
	if (
		!area ||
		typeof area !== "object" ||
		!("coordRange" in area) ||
		!Array.isArray(area.coordRange)
	)
		return null;
	const [left, right] = area.coordRange;
	if (
		typeof left !== "number" ||
		typeof right !== "number" ||
		!Number.isFinite(left) ||
		!Number.isFinite(right) ||
		!rows.length
	)
		return null;
	if (Math.max(left, right) < 0 || Math.min(left, right) > rows.length - 1)
		return null;
	const from = Math.max(
		0,
		Math.min(rows.length - 1, Math.ceil(Math.min(left, right))),
	);
	const to = Math.max(
		0,
		Math.min(rows.length - 1, Math.floor(Math.max(left, right))),
	);
	return from <= to
		? { from: String(rows[from].DAY), to: String(rows[to].DAY) }
		: null;
}

/** ECharts trends with native hover tooltips, direct date brushing, and local reset. */
export function UsageTrend({
	title,
	rows,
	comparisonRows,
	series,
	selectedRange,
	onRange,
	onClearRange,
}: UsageTrendProps) {
	const titleId = useId();
	const chartElement = useRef<HTMLDivElement>(null);
	const valueLabel = (
		row: UsageRow | undefined,
		item: TrendSeries,
	): string => {
		const value = numeric(row, item.key);
		return formatMetric(
			value === null ? null : value / (item.divisor ?? 1),
			2,
		);
	};
	useEffect(() => {
		const element = chartElement.current;
		if (!element) return;
		const instance = init(element, undefined, { renderer: "svg" });
		const days = Math.max(rows.length, comparisonRows?.length ?? 0);
		const unequal = comparisonRows && comparisonRows.length !== rows.length;
		const draw = () => {
			const tokens = readChartTokens(element);
			const options: EChartsCoreOption = {
				animation: false,
				toolbox: { show: false },
				textStyle: {
					color: tokens.foreground,
					fontFamily: tokens.fontFamily,
				},
				grid: {
					left: 8,
					right: 12,
					top: 12,
					bottom: 8,
					containLabel: true,
				},
				xAxis: {
					type: "category",
					boundaryGap: false,
					data: Array.from({ length: days }, (_, index) =>
						unequal ? `Day ${index + 1}` : String(rows[index].DAY),
					),
					axisLabel: { color: tokens.muted, hideOverlap: true },
					axisLine: { lineStyle: { color: tokens.border } },
				},
				yAxis: {
					type: "value",
					min: 0,
					axisLabel: {
						color: tokens.muted,
						formatter: (value: number) =>
							Intl.NumberFormat(undefined, {
								notation: "compact",
							}).format(value),
					},
					splitLine: { lineStyle: { color: tokens.border } },
				},
				aria: {
					enabled: true,
					description: `${title}. Current Values Use Solid Lines; Benchmarks Use Dashed Lines. Daily Values Are Available In The Data Table.`,
				},
				tooltip: {
					trigger: "axis",
					renderMode: "richText",
					confine: true,
					enterable: true,
					backgroundColor: tokens.background,
					borderColor: tokens.border,
					textStyle: { color: tokens.foreground },
					axisPointer: { type: "line", snap: true },
					formatter: (params: unknown) => {
						const point: unknown = Array.isArray(params)
							? params[0]
							: params;
						if (
							!point ||
							typeof point !== "object" ||
							!("dataIndex" in point) ||
							typeof point.dataIndex !== "number"
						)
							return "";
						const index = point.dataIndex;
						const describe = (
							data: UsageRow[] | undefined,
							prefix: string,
						): string[] =>
							data?.[index]
								? [
										`${prefix}: ${String(data[index]?.DAY ?? "Unavailable")}`,
										...series.map((item) => {
											const value = numeric(
												data[index],
												item.key,
											);
											return `${item.label}: ${formatMetric(value === null ? null : value / (item.divisor ?? 1), 2)}`;
										}),
									]
								: [];
						return [
							...describe(rows, "Current"),
							...describe(comparisonRows, "Benchmark"),
						].join("\n");
					},
				},
				brush: {
					// Disable ECharts' default rectangle/lasso/keep/clear toolbar.
					// This dashboard filters the date axis only; Reset lives in the header.
					toolbox: [],
					xAxisIndex: 0,
					brushType: "lineX",
					z: 3,
					brushMode: "single",
					transformable: true,
					removeOnClick: false,
					brushStyle: {
						color: "transparent",
						borderColor: tokens.primary,
						borderWidth: 1.5,
					},
					outOfBrush: { colorAlpha: 1 },
				},
				series: series.flatMap((item) =>
					[false, true].flatMap((benchmark) => {
						const data = benchmark ? comparisonRows : rows;
						if (!data) return [];
						return [
							{
								name: `${item.label}${benchmark ? " (Benchmark)" : ""}`,
								type: "line",
								connectNulls: false,
								showSymbol: rows.length <= 31,
								symbol: benchmark ? "emptyCircle" : "circle",
								symbolSize: 4,
								lineStyle: {
									color: tokens.colors[item.color - 1],
									type: benchmark ? "dashed" : "solid",
									width: 2,
								},
								itemStyle: {
									color: tokens.colors[item.color - 1],
								},
								data: Array.from(
									{ length: days },
									(_, index) => {
										const value = numeric(
											data[index],
											item.key,
										);
										return value === null
											? null
											: value / (item.divisor ?? 1);
									},
								),
							},
						];
					}),
				),
			};
			instance.setOption(options, { notMerge: true });
			instance.dispatchAction({
				type: "takeGlobalCursor",
				key: "brush",
				brushOption: { brushType: "lineX", brushMode: "single" },
			});
		};
		const handleBrush = (event: unknown) => {
			const range = usageBrushRange(event, rows);
			if (
				range &&
				rows.length > 1 &&
				(range.from !== String(rows[0].DAY) ||
					range.to !== String(rows.at(-1)?.DAY))
			)
				onRange(range);
			else instance.dispatchAction({ type: "brush", areas: [] });
		};
		instance.on("brushEnd", handleBrush);
		draw();
		const sizeObserver = new ResizeObserver(() => instance.resize());
		sizeObserver.observe(element);
		const themeObserver = new MutationObserver(draw);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class", "style"],
		});
		return () => {
			themeObserver.disconnect();
			sizeObserver.disconnect();
			instance.dispose();
		};
	}, [rows, comparisonRows, series, title, onRange]);

	return (
		<section
			aria-labelledby={titleId}
			className="min-w-0 space-y-2 rounded-md border p-3"
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<H4 id={titleId} className="text-sm">
					{title}
				</H4>
				{selectedRange && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onClearRange}
						aria-label={`Reset Date Filter On ${title}`}
					>
						<RotateCcw aria-hidden="true" /> Reset
					</Button>
				)}
			</div>
			<Muted className="block text-xs">
				{selectedRange
					? `${selectedRange.from} - ${selectedRange.to} | All Tabs`
					: "Drag To Filter Current Dates | Applies To All Tabs"}
			</Muted>
			<div
				ref={chartElement}
				role="img"
				className="h-44 w-full"
				aria-label={`${title} Chart`}
			/>
			<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
				{series.map((item) => (
					<span
						key={item.key}
						className="inline-flex items-center gap-1"
					>
						<span
							aria-hidden="true"
							className={`size-2 rounded-full ${["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"][item.color - 1]}`}
						/>
						{item.label}
					</span>
				))}
				{comparisonRows && (
					<Muted>Solid: Current | Dashed: Benchmark</Muted>
				)}
			</div>
			<Collapsible>
				<CollapsibleTrigger asChild>
					<Button variant="ghost" size="sm">
						Daily Data
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<section
						aria-label={`${title} Daily Data`}
						// biome-ignore lint/a11y/noNoninteractiveTabindex: the bounded data table must support keyboard scrolling.
						tabIndex={0}
						className="max-h-64 overflow-auto focus-visible:outline-2 focus-visible:outline-ring"
					>
						<Table
							wrapperClassName="overflow-visible"
							className="text-xs [&_td]:py-1 [&_th]:h-8"
						>
							<TableHeader>
								<TableRow>
									<TableHead scope="col">Date</TableHead>
									{series.map((item) => (
										<TableHead scope="col" key={item.key}>
											{item.label}
										</TableHead>
									))}
									{comparisonRows && (
										<>
											<TableHead scope="col">
												Benchmark Date
											</TableHead>
											{series.map((item) => (
												<TableHead
													scope="col"
													key={item.key}
												>
													Benchmark {item.label}
												</TableHead>
											))}
										</>
									)}
								</TableRow>
							</TableHeader>
							<TableBody>
								{Array.from(
									{
										length: Math.max(
											rows.length,
											comparisonRows?.length ?? 0,
										),
									},
									(_, index) => (
										<TableRow
											key={`${rows[index]?.DAY ?? "outside"}-${comparisonRows?.[index]?.DAY ?? "outside"}`}
										>
											<TableCell>
												{String(
													rows[index]?.DAY ?? "-",
												)}
											</TableCell>
											{series.map((item) => (
												<TableCell key={item.key}>
													{valueLabel(
														rows[index],
														item,
													)}
												</TableCell>
											))}
											{comparisonRows && (
												<>
													<TableCell>
														{String(
															comparisonRows[
																index
															]?.DAY ?? "-",
														)}
													</TableCell>
													{series.map((item) => (
														<TableCell
															key={item.key}
														>
															{valueLabel(
																comparisonRows[
																	index
																],
																item,
															)}
														</TableCell>
													))}
												</>
											)}
										</TableRow>
									),
								)}
							</TableBody>
						</Table>
					</section>
				</CollapsibleContent>
			</Collapsible>
		</section>
	);
}
