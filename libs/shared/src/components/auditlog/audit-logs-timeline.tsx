import * as echarts from "echarts";
import {
	Crop as CropIcon,
	RotateCcw as ResetIcon,
	ZoomIn as ZoomInIcon,
	ZoomOut as ZoomOutIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Sheet,
	SheetContent,
	SheetTitle,
	useTheme,
} from "@semoss/ui/next";
import { AuditLogsDetailDrawer } from "./audit-logs-detail-drawer";
import type { EventData } from "./common";
import { TimeDateFormatter } from "./common";

//Status colors mirror the data table: success is green, failure is red. Unlike
//the request/response split (which we removed), status is a real good/bad signal.
const STATUS_OK_COLOR = "#16a34a";
const STATUS_FAIL_COLOR = "#dc2626";
//Cycled per consecutive part within a span (by-span mode) so each segment of the
//execution is visually distinct and its duration is readable. Avoids green/red so
//the part colors aren't confused with status.
const SPAN_PART_COLORS = [
	"#3b82f6",
	"#8b5cf6",
	"#06b6d4",
	"#f59e0b",
	"#ec4899",
];

const isSuccess = (status: EventData["status"]) =>
	Boolean(status) && status !== "false";

//Granularity options for the time (x) axis labels.
type AxisMode = "time" | "datetime" | "date" | "month";
const AXIS_MODE_LABEL_KEYS: Record<AxisMode, string> = {
	time: "timeline.axisMode.time",
	datetime: "timeline.axisMode.datetime",
	date: "timeline.axisMode.date",
	month: "timeline.axisMode.month",
};
//Row grouping: one lane per event, or one lane per spanId / requestId (trace-style,
//where the group's events stack as parts of the execution along the row).
type RowMode = "event" | "span" | "request";
const ROW_MODE_LABEL_KEYS: Record<RowMode, string> = {
	event: "timeline.rowMode.event",
	span: "timeline.rowMode.span",
	request: "timeline.rowMode.request",
};
const formatAxisValue = (value: number, mode: AxisMode): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	switch (mode) {
		case "month":
			return date.toLocaleDateString(undefined, {
				month: "short",
				year: "numeric",
			});
		case "date":
			return date.toLocaleDateString(undefined, {
				month: "short",
				day: "2-digit",
			});
		case "datetime":
			return date.toLocaleString(undefined, {
				month: "short",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
			});
		default:
			return date.toLocaleTimeString(undefined, {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
	}
};

interface WaterfallRow {
	event: EventData;
	startMs: number;
	endMs: number;
	sessionId: string;
}

interface AuditLogsTimelineProps {
	logs: EventData[];
}

//Minimal shapes for echarts custom-series rendering.
interface RenderItemParams {
	dataIndex: number;
	coordSys: { x: number; y: number; width: number; height: number };
}
interface RenderItemAPI {
	value: (index: number) => number;
	coord: (point: [number, number]) => [number, number];
	size: (data: [number, number]) => [number, number];
}
interface RenderRect {
	type: "rect";
	shape: { x: number; y: number; width: number; height: number; r: number };
	style: { fill: string };
}

/**
 * A DevTools-style waterfall of audit-log activity. Each event is one lane on a
 * real, continuous time axis: the bar's horizontal position is its actual start
 * time and its length is its real duration, so overlap and gaps are meaningful.
 * Bars are colored by status (green ok / red failed). Clicking a bar opens the
 * detail drawer. The row mode can be switched from one lane per event to one lane
 * per spanId or requestId, where the group's events render in sequence on that
 * single row (alternating colors) — a trace-style breakdown of the execution.
 */
export const AuditLogsTimeline: React.FC<AuditLogsTimelineProps> = ({
	logs,
}) => {
	const { t } = useTranslation("auditlog");
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	//Resolved chart copy. Memoized per-language and fed into the chart effect's
	//dependency array so the echarts tooltip (built as an HTML string) re-renders
	//in the new language when the user switches it.
	const chartText = useMemo(
		() => ({
			event: t("common.event"),
			success: t("common.success"),
			failed: t("common.failed"),
			engine: t("timeline.tooltip.engine"),
			user: t("timeline.tooltip.user"),
			latency: t("timeline.tooltip.latency"),
			tokens: t("timeline.tooltip.tokens"),
			start: t("timeline.tooltip.start"),
			end: t("timeline.tooltip.end"),
			span: t("timeline.tooltip.span"),
			session: t("timeline.tooltip.session"),
			request: t("timeline.tooltip.request"),
			response: t("timeline.tooltip.response"),
		}),
		[t],
	);
	const chartRef = useRef<HTMLDivElement>(null);
	const chartInstanceRef = useRef<echarts.ECharts | null>(null);
	//Persisted zoom windows (percent) for both axes, so the current zoom survives
	//chart rebuilds and the rectangle-zoom composes with whatever is already zoomed.
	const [xZoom, setXZoom] = useState({ start: 0, end: 100 });
	const [yZoom, setYZoom] = useState({ start: 0, end: 100 });
	const [axisMode, setAxisMode] = useState<AxisMode>("time");
	const [rowMode, setRowMode] = useState<RowMode>("event");
	const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);
	//Whether the drag-a-rectangle-to-zoom cursor is currently armed.
	const [zoomSelectActive, setZoomSelectActive] = useState(false);
	//Mirror in a ref so the zrender drag handlers (bound once) read the latest value.
	const zoomSelectActiveRef = useRef(zoomSelectActive);
	zoomSelectActiveRef.current = zoomSelectActive;
	//Set by the chart effect; lets Reset / disarming wipe any stray selection masks.
	const clearMasksRef = useRef<(() => void) | null>(null);
	const grouped = rowMode !== "event";

	//Parse + order the rows. Each row becomes one lane (top-to-bottom).
	const rows = useMemo<WaterfallRow[]>(() => {
		const parsed = logs
			.map((event): WaterfallRow | null => {
				const startMs = new Date(event.startTime).getTime();
				let endMs = new Date(event.endTime).getTime();
				const latency = Number(event.latency) || 0;
				if (!Number.isFinite(startMs)) return null;
				//Fall back to latency when end is missing/invalid so the bar has width.
				if (!Number.isFinite(endMs) || endMs < startMs) {
					endMs = startMs + latency;
				}
				return {
					event,
					startMs,
					endMs,
					sessionId: event.sessionId || "—",
				};
			})
			.filter((row): row is WaterfallRow => row !== null);

		parsed.sort((a, b) => a.startMs - b.startMs);
		return parsed;
	}, [logs]);

	//Row layout. "event" → one lane per event. "span"/"request" → one lane per
	//spanId/requestId; every event in the group is a part drawn on that single row
	//at its real start→end, in sequence. subIndex (part order within the group) is
	//used only to alternate the part colors.
	const lanes = useMemo(() => {
		const keyOf = (row: WaterfallRow) =>
			rowMode === "request"
				? row.event.requestId || "—"
				: row.event.spanId || "—";

		if (!grouped) {
			return {
				laneOf: rows.map((_, index) => index),
				subIndexOf: rows.map(() => 0),
				laneCount: rows.length,
				laneLabels: rows.map(
					(row) =>
						row.event.methodName ||
						row.event.engineName ||
						row.event.requestId ||
						"",
				),
			};
		}

		//rows are already sorted by start, so first-appearance order = chronological.
		const order: string[] = [];
		const laneIndexOf = new Map<string, number>();
		for (const row of rows) {
			const key = keyOf(row);
			if (!laneIndexOf.has(key)) {
				laneIndexOf.set(key, order.length);
				order.push(key);
			}
		}
		//Part index within the group (drives the alternating part colors).
		const running = new Map<string, number>();
		const subIndexOf = rows.map((row) => {
			const key = keyOf(row);
			const index = running.get(key) ?? 0;
			running.set(key, index + 1);
			return index;
		});
		//Label each row by its group id (spanId / requestId), not the method.
		const laneLabels = [...order];
		return {
			laneOf: rows.map((row) => laneIndexOf.get(keyOf(row)) ?? 0),
			subIndexOf,
			laneCount: order.length,
			laneLabels,
		};
	}, [rows, rowMode, grouped]);
	const { laneOf, subIndexOf, laneCount, laneLabels } = lanes;

	//Per-event mode: color encodes status (green ok / red failed). Grouped modes:
	//cycle colors across the parts of each group so each part is distinct and its
	//duration is readable (status is still shown in the tooltip).
	const barColors = useMemo(() => {
		if (!grouped) {
			return rows.map((row) =>
				isSuccess(row.event.status)
					? STATUS_OK_COLOR
					: STATUS_FAIL_COLOR,
			);
		}
		return rows.map(
			(_, index) =>
				SPAN_PART_COLORS[subIndexOf[index] % SPAN_PART_COLORS.length],
		);
	}, [rows, grouped, subIndexOf]);

	//Bounded chart height: the time axis stays pinned at the top and a vertical
	//scrollbar (echarts dataZoom) pages through rows, instead of an ever-growing
	//canvas inside a scroll container (which hid the axis and the bottom slider).
	const chartHeight = useMemo(
		() => Math.min(Math.max(laneCount * 28 + 96, 240), 560),
		[laneCount],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: chart is rebuilt when rows/height change
	useEffect(() => {
		if (!chartRef.current || rows.length === 0) return;

		const chart = echarts.init(chartRef.current);
		chartInstanceRef.current = chart;

		const minStart = Math.min(...rows.map((r) => r.startMs));
		const maxEnd = Math.max(...rows.map((r) => r.endMs));
		const pad = Math.max((maxEnd - minStart) * 0.02, 250);

		const seriesData = rows.map((row, index) => ({
			value: [row.startMs, laneOf[index], row.endMs],
		}));

		const tooltipBackground = isDark
			? "rgba(15, 23, 42, 0.96)"
			: "rgba(255, 255, 255, 0.98)";
		const tooltipBorder = isDark ? "#334155" : "#e0e0e0";
		const tooltipText = isDark ? "#e2e8f0" : "#333";
		const tooltipMuted = isDark ? "#94a3b8" : "#888";
		const tooltipDivider = isDark ? "#334155" : "#f0f0f0";
		const axisLineColor = isDark ? "#334155" : "#e0e0e0";
		const axisLabelColor = isDark ? "#94a3b8" : "#666";
		const splitLineColor = isDark ? "#1e293b" : "#f0f0f0";
		const option = {
			backgroundColor: "transparent",
			animation: false,
			tooltip: {
				trigger: "item",
				//Render to <body> so the chart's overflow:auto scroll wrapper can't clip the tooltip.
				appendToBody: true,
				confine: false,
				backgroundColor: tooltipBackground,
				borderColor: tooltipBorder,
				borderRadius: 8,
				padding: [10, 14],
				textStyle: { color: tooltipText, fontSize: 13 },
				extraCssText:
					"box-shadow: 0 8px 24px rgba(0,0,0,0.12); max-width: 320px; white-space: normal;",
				formatter: (params: unknown): string => {
					const dataIndex = (params as { dataIndex: number })
						.dataIndex;
					const row = rows[dataIndex];
					if (!row) return "";
					const e = row.event;
					const ok = isSuccess(e.status);
					const truncate = (text: string | null, max = 70) =>
						text && text.length > max
							? `${text.substring(0, max)}…`
							: (text ?? "");
					const line = (label: string, value: string) =>
						value
							? `<div style="display:flex;gap:8px;margin-top:2px;"><span style="color:${tooltipMuted};min-width:78px;flex-shrink:0;">${label}</span><span style="color:${tooltipText};flex:1;min-width:0;word-break:break-all;overflow-wrap:anywhere;">${value}</span></div>`
							: "";
					const start = TimeDateFormatter(e.startTime);
					const end = TimeDateFormatter(e.endTime);
					return `
						<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.45;">
							<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid ${tooltipDivider};">
								<span style="font-weight:600;">${e.methodName || e.engineName || chartText.event}</span>
								<span style="font-weight:600;color:${ok ? STATUS_OK_COLOR : STATUS_FAIL_COLOR};">${ok ? chartText.success : chartText.failed}</span>
							</div>
							${line(chartText.engine, `${e.engineName ?? ""}${e.engineType ? ` (${e.engineType})` : ""}`)}
							${line(chartText.user, e.userName || e.userId || "")}
							${line(chartText.latency, `${e.latency}ms`)}
							${line(chartText.tokens, e.tokens != null ? String(e.tokens) : "")}
							${line(chartText.start, `${start.date} ${start.time}`)}
							${line(chartText.end, `${end.date} ${end.time}`)}
							${line(chartText.span, e.spanId || "")}
							${line(chartText.session, e.sessionId || "")}
							<div style="margin-top:6px;color:${tooltipMuted};">${chartText.request}</div>
							<div style="color:${tooltipText};word-break:break-word;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${truncate(e.request)}</div>
							<div style="margin-top:4px;color:${tooltipMuted};">${chartText.response}</div>
							<div style="color:${tooltipText};word-break:break-word;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${truncate(e.response)}</div>
						</div>`;
				},
			},
			grid: {
				left: grouped ? "190px" : "120px",
				right: "44px",
				top: "28px",
				bottom: "40px",
				containLabel: false,
			},
			dataZoom: [
				//Horizontal time zoom/scrollbar. start/end restore the current zoom on
				//rebuild so it isn't lost when the chart re-renders.
				{
					id: "xZoom",
					type: "slider",
					xAxisIndex: 0,
					bottom: 4,
					height: 16,
					start: xZoom.start,
					end: xZoom.end,
					//Time is a continuous scale: "none" zooms the range and lets clip:true
					//trim the bars, so long bars spanning the window still render.
					filterMode: "none",
				},
				//Vertical scrollbar through rows (keeps the time axis pinned). "filter"
				//(not "none") so a narrow row-window REMOVES out-of-range lanes instead of
				//collapsing every bar onto the single visible ordinal band.
				{
					id: "yZoom",
					type: "slider",
					yAxisIndex: 0,
					right: 6,
					width: 14,
					start: yZoom.start,
					end: yZoom.end,
					filterMode: "filter",
					brushSelect: false,
					showDetail: false,
				},
			],
			xAxis: {
				type: "time",
				min: minStart - pad,
				max: maxEnd + pad,
				position: "top",
				axisLine: { lineStyle: { color: axisLineColor } },
				axisLabel: {
					color: axisLabelColor,
					fontSize: 11,
					hideOverlap: true,
					formatter: (value: number) =>
						formatAxisValue(value, axisMode),
				},
				splitLine: { show: true, lineStyle: { color: splitLineColor } },
			},
			yAxis: {
				type: "category",
				inverse: true,
				data: Array.from({ length: laneCount }, (_, index) =>
					String(index),
				),
				axisTick: { show: false },
				axisLine: { show: false },
				axisLabel: {
					color: isDark ? "#cbd5e1" : "#555",
					fontSize: 11,
					width: grouped ? 180 : 110,
					overflow: "truncate",
					formatter: (value: string) =>
						laneLabels[Number(value)] ?? "",
				},
			},
			series: [
				{
					type: "custom",
					clip: true,
					//Tell the dataZooms which value dimensions map to each axis so their
					//filterMode targets the right dimension (x = start..end, y = lane).
					encode: { x: [0, 2], y: 1 },
					data: seriesData,
					renderItem: (
						params: RenderItemParams,
						api: RenderItemAPI,
					): RenderRect | null => {
						const startCoord = api.coord([
							api.value(0),
							api.value(1),
						]);
						const endCoord = api.coord([
							api.value(2),
							api.value(1),
						]);
						const bandHeight = api.size([0, 1])[1];
						const barHeight = Math.max(
							Math.min(bandHeight * 0.55, 14),
							4,
						);
						//Leave a 1px gap so consecutive parts on a row read as distinct.
						const width = Math.max(
							endCoord[0] - startCoord[0] - 1,
							2,
						);
						return {
							type: "rect",
							shape: {
								x: startCoord[0],
								y: startCoord[1] - barHeight / 2,
								width,
								height: barHeight,
								r: 2,
							},
							style: {
								fill:
									barColors[params.dataIndex] ??
									STATUS_OK_COLOR,
							},
						};
					},
				},
			],
		};

		chart.setOption(option as echarts.EChartsOption);

		chart.on("click", (params: { dataIndex?: number }) => {
			//Ignore clicks while the highlight (drag-to-zoom) cursor is armed.
			if (zoomSelectActiveRef.current) return;
			if (params.dataIndex != null && rows[params.dataIndex]) {
				setSelectedEvent(rows[params.dataIndex].event);
				setDrawerOpen(true);
			}
		});

		//Manual drag-a-rectangle-to-zoom: when the highlight cursor is armed, dragging
		//on the plot draws a selection mask and zooms both axes to that region. This is
		//done with zrender events (rather than the toolbox feature) so it works reliably.
		const zr = chart.getZr();
		let dragStart: [number, number] | null = null;
		//Track EVERY mask we add so we can always remove all of them — a single
		//reference can leak (e.g. a new drag starts over a leftover, or mouseup lands
		//off-canvas so zrender never fires), stranding blue boxes on the chart.
		const masks = new Set<echarts.graphic.Rect>();
		//The mask currently being dragged (resized on mousemove).
		let activeMask: echarts.graphic.Rect | null = null;
		const clearMask = () => {
			for (const mask of masks) {
				zr.remove(mask);
			}
			masks.clear();
			activeMask = null;
			dragStart = null;
		};
		//Expose cleanup so Reset and disarming the cursor can wipe any stray masks.
		clearMasksRef.current = clearMask;
		const onZrDown = (event: { offsetX: number; offsetY: number }) => {
			if (!zoomSelectActiveRef.current) return;
			//Remove any leftover selection before starting a fresh one.
			clearMask();
			dragStart = [event.offsetX, event.offsetY];
			const maskEl = new echarts.graphic.Rect({
				shape: {
					x: event.offsetX,
					y: event.offsetY,
					width: 0,
					height: 0,
				},
				style: {
					fill: "rgba(59,130,246,0.15)",
					stroke: "#3b82f6",
					lineWidth: 1,
				},
				z: 100,
				silent: true,
			});
			masks.add(maskEl);
			activeMask = maskEl;
			zr.add(maskEl);
		};
		const onZrMove = (event: { offsetX: number; offsetY: number }) => {
			if (!dragStart || !activeMask) return;
			activeMask.setShape({
				x: Math.min(dragStart[0], event.offsetX),
				y: Math.min(dragStart[1], event.offsetY),
				width: Math.abs(event.offsetX - dragStart[0]),
				height: Math.abs(event.offsetY - dragStart[1]),
			});
		};
		const onZrUp = (event: { offsetX: number; offsetY: number }) => {
			if (!dragStart) return;
			const [sx, sy] = dragStart;
			const ex = event.offsetX;
			const ey = event.offsetY;
			clearMask();
			//Ignore tiny drags (treated as a click).
			if (Math.abs(ex - sx) < 4 && Math.abs(ey - sy) < 4) return;
			//Zoom the time (x) axis to the drawn span.
			const x1 = chart.convertFromPixel(
				{ xAxisIndex: 0 },
				Math.min(sx, ex),
			) as number;
			const x2 = chart.convertFromPixel(
				{ xAxisIndex: 0 },
				Math.max(sx, ex),
			) as number;
			chart.dispatchAction({
				type: "dataZoom",
				dataZoomId: "xZoom",
				startValue: x1,
				endValue: x2,
			});
			//Also zoom the row (y) axis to the rows the rectangle covers. This is safe now
			//that yZoom uses filterMode:"filter": out-of-window lanes are REMOVED rather than
			//clamped onto the single visible ordinal band, so a thin selection narrows to
			//those rows instead of collapsing every event onto one (the earlier bug came from
			//filterMode:"none"). Skip if the drag fell outside the plottable row area.
			const yTop = chart.convertFromPixel(
				{ yAxisIndex: 0 },
				Math.min(sy, ey),
			) as number;
			const yBottom = chart.convertFromPixel(
				{ yAxisIndex: 0 },
				Math.max(sy, ey),
			) as number;
			const yStart = Math.min(yTop, yBottom);
			const yEnd = Math.max(yTop, yBottom);
			if (Number.isFinite(yStart) && Number.isFinite(yEnd)) {
				chart.dispatchAction({
					type: "dataZoom",
					dataZoomId: "yZoom",
					startValue: yStart,
					endValue: yEnd,
				});
			}
			//Stay armed so the user can keep drawing zoom regions until they toggle
			//the highlight button off.
		};
		zr.on("mousedown", onZrDown);
		zr.on("mousemove", onZrMove);
		zr.on("mouseup", onZrUp);
		//If the pointer is released anywhere (including outside the canvas, where zrender
		//never fires mouseup), cancel the in-progress selection so no stray box is left.
		const onWindowUp = () => {
			if (dragStart) clearMask();
		};
		window.addEventListener("mouseup", onWindowUp);

		//After any zoom (slider drag, rectangle highlight, or buttons) read the
		//authoritative current windows off the chart so our state always matches what
		//is shown — and so a rebuild restores the exact same zoom.
		chart.on("dataZoom", () => {
			const dataZooms =
				(
					chart.getOption() as {
						dataZoom?: Array<{
							id?: string;
							start?: number;
							end?: number;
						}>;
					}
				).dataZoom ?? [];
			const x = dataZooms.find((d) => d.id === "xZoom");
			const y = dataZooms.find((d) => d.id === "yZoom");
			if (x && typeof x.start === "number" && typeof x.end === "number") {
				setXZoom({ start: x.start, end: x.end });
			}
			if (y && typeof y.start === "number" && typeof y.end === "number") {
				setYZoom({ start: y.start, end: y.end });
			}
		});

		//Keep the chart sized to its container — covers window resizes AND container
		//changes that don't fire a window resize (panels, sidebars, devtools docking).
		const handleResize = () => chart.resize();
		window.addEventListener("resize", handleResize);
		const resizeObserver = new ResizeObserver(() => chart.resize());
		if (chartRef.current) resizeObserver.observe(chartRef.current);

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("mouseup", onWindowUp);
			clearMask();
			clearMasksRef.current = null;
			resizeObserver.disconnect();
			chart.dispose();
			chartInstanceRef.current = null;
		};
	}, [rows, lanes, barColors, chartHeight, axisMode, chartText, isDark]);

	//Zoom the time (x) axis around the center of the CURRENT window, so the buttons
	//compose with whatever is already zoomed (slider/rectangle).
	const applyXZoom = (start: number, end: number) => {
		setXZoom({ start, end });
		chartInstanceRef.current?.dispatchAction({
			type: "dataZoom",
			dataZoomId: "xZoom",
			start,
			end,
		});
	};

	const handleZoomIn = () => {
		const range = xZoom.end - xZoom.start;
		if (range <= 5) return;
		const center = (xZoom.start + xZoom.end) / 2;
		const newRange = range * 0.6;
		applyXZoom(
			Math.max(0, center - newRange / 2),
			Math.min(100, center + newRange / 2),
		);
	};

	const handleZoomOut = () => {
		const range = xZoom.end - xZoom.start;
		if (range >= 100) return;
		const center = (xZoom.start + xZoom.end) / 2;
		const newRange = Math.min(100, range * 1.4);
		applyXZoom(
			Math.max(0, center - newRange / 2),
			Math.min(100, center + newRange / 2),
		);
	};

	//Arm/disarm the rectangle-zoom cursor. While armed, dragging on the chart zooms
	//into that region; toggling off restores normal click-to-open-drawer behavior.
	const toggleHighlightZoom = () => {
		setZoomSelectActive((active) => {
			//Disarming clears any selection box still on screen.
			if (active) clearMasksRef.current?.();
			return !active;
		});
	};

	//Restore the full time + row range.
	const resetZoom = () => {
		//Wipe any stray selection masks that may have been left on the chart.
		clearMasksRef.current?.();
		setXZoom({ start: 0, end: 100 });
		setYZoom({ start: 0, end: 100 });
		chartInstanceRef.current?.dispatchAction({
			type: "dataZoom",
			dataZoomId: "xZoom",
			start: 0,
			end: 100,
		});
		chartInstanceRef.current?.dispatchAction({
			type: "dataZoom",
			dataZoomId: "yZoom",
			start: 0,
			end: 100,
		});
	};

	const handleDrawerClose = () => {
		setDrawerOpen(false);
		setTimeout(() => setSelectedEvent(null), 300);
	};

	const header = (
		<div className="flex flex-wrap items-center justify-between gap-2 p-4">
			<span className="font-semibold text-[18px] text-foreground">
				{t("timeline.title")}
			</span>
			<div className="flex flex-wrap items-center gap-2">
				<Select
					value={rowMode}
					onValueChange={(value) => setRowMode(value as RowMode)}
				>
					<SelectTrigger className="h-8 w-[150px] text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{(Object.keys(ROW_MODE_LABEL_KEYS) as RowMode[]).map(
							(mode) => (
								<SelectItem key={mode} value={mode}>
									{t(ROW_MODE_LABEL_KEYS[mode])}
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>
				<Select
					value={axisMode}
					onValueChange={(value) => setAxisMode(value as AxisMode)}
				>
					<SelectTrigger className="h-8 w-[150px] text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{(Object.keys(AXIS_MODE_LABEL_KEYS) as AxisMode[]).map(
							(mode) => (
								<SelectItem key={mode} value={mode}>
									{t(AXIS_MODE_LABEL_KEYS[mode])}
								</SelectItem>
							),
						)}
					</SelectContent>
				</Select>
				<fieldset
					className="inline-flex gap-1 rounded-md border border-border bg-background shadow-sm"
					style={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}
				>
					<Button
						variant={zoomSelectActive ? "secondary" : "ghost"}
						className="rounded-[4px_0_0_4px] px-[4px] py-[4px]"
						onClick={toggleHighlightZoom}
						title={t("timeline.highlightZoom")}
						aria-pressed={zoomSelectActive}
					>
						<CropIcon className="text-muted-foreground" />
					</Button>
					<Button
						variant="ghost"
						className="rounded-none px-[4px] py-[4px]"
						onClick={handleZoomIn}
						title={t("timeline.zoomIn")}
						disabled={xZoom.end - xZoom.start <= 5}
					>
						<ZoomInIcon className="text-muted-foreground" />
					</Button>
					<Button
						variant="ghost"
						className="rounded-none px-[4px] py-[4px]"
						onClick={handleZoomOut}
						title={t("timeline.zoomOut")}
						disabled={xZoom.start === 0 && xZoom.end === 100}
					>
						<ZoomOutIcon className="text-muted-foreground" />
					</Button>
					<Button
						variant="ghost"
						className="rounded-[0_4px_4px_0] px-[4px] py-[4px]"
						onClick={resetZoom}
						title={t("timeline.resetZoom")}
						disabled={
							xZoom.start === 0 &&
							xZoom.end === 100 &&
							yZoom.start === 0 &&
							yZoom.end === 100
						}
					>
						<ResetIcon className="text-muted-foreground" />
					</Button>
				</fieldset>
			</div>
		</div>
	);

	if (rows.length === 0) {
		return (
			<div className="rounded-[8px] border border-border bg-card p-0 pb-2 shadow-sm">
				{header}
				<div className="p-4 text-center">
					<span className="font-normal text-[14px] text-muted-foreground">
						{t("common.noLogs")}
					</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="rounded-[8px] border border-border bg-card p-0 pb-2 shadow-sm">
				{header}
				<div className="w-full px-2 pb-2">
					<div
						className="w-full rounded-md bg-background"
						style={{ height: `${chartHeight}px` }}
						ref={chartRef}
					/>
				</div>
			</div>
			<Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
				<SheetContent
					side="right"
					className="min-w-[500px] transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
				>
					<SheetTitle className="sr-only">
						{t("detail.title")}
					</SheetTitle>
					<AuditLogsDetailDrawer
						logDetails={selectedEvent}
						handleDrawerClose={handleDrawerClose}
					/>
				</SheetContent>
			</Sheet>
		</>
	);
};
