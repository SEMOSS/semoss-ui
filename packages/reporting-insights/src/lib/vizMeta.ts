import {
	Activity,
	AreaChart,
	BarChart2,
	Circle,
	CircleDot,
	Cloud,
	Code2,
	Download,
	Filter,
	Globe,
	LayoutGrid,
	LineChart,
	PieChart,
	Radar,
	ScatterChart,
	Table,
	Table2,
} from "lucide-react";
import type { ElementType } from "react";
import type { VisualizationType } from "@/types/dashboard";

/**
 * Single source of truth for each visualization type's icon + human label.
 * Shared by the editor type picker, the viz strip (main app + portal EditMode),
 * and analytics labels (Home "chart mix") so they never drift.
 */
export const VIZ_TYPE_META: Record<
	VisualizationType,
	{ icon: ElementType; label: string; category: VizCategory }
> = {
	kpi: { icon: Activity, label: "KPI", category: "Metrics" },
	bar: { icon: BarChart2, label: "Bar", category: "Comparison" },
	stackbar: { icon: BarChart2, label: "Stacked Bar", category: "Comparison" },
	line: { icon: LineChart, label: "Line", category: "Trends" },
	area: { icon: AreaChart, label: "Area", category: "Trends" },
	scatter: { icon: ScatterChart, label: "Scatter", category: "Distribution" },
	pie: { icon: PieChart, label: "Pie", category: "Part to Whole" },
	radar: { icon: Radar, label: "Radar", category: "Comparison" },
	treemap: { icon: LayoutGrid, label: "Treemap", category: "Part to Whole" },
	pivot: { icon: Table2, label: "Pivot", category: "Metrics" },
	table: { icon: Table, label: "Table", category: "Metrics" },
	worldmap: { icon: Globe, label: "World Map", category: "Map" },
	heatmap: { icon: LayoutGrid, label: "Heat Map", category: "Distribution" },
	halfdonut: {
		icon: PieChart,
		label: "Half Donut",
		category: "Part to Whole",
	},
	boxplot: { icon: BarChart2, label: "Box Plot", category: "Distribution" },
	polarbar: { icon: Radar, label: "Polar Bar", category: "Part to Whole" },
	cluster: { icon: ScatterChart, label: "Cluster", category: "Distribution" },
	htmlblock: { icon: Code2, label: "HTML Block", category: "Report Widgets" },
	multiline: { icon: LineChart, label: "Multi-Line", category: "Trends" },
	wordcloud: { icon: Cloud, label: "Word Cloud", category: "Words" },
	bubble: { icon: Circle, label: "Bubble", category: "Comparison" },
	puck: { icon: CircleDot, label: "Pack", category: "Distribution" },
	sunburst: {
		icon: LayoutGrid,
		label: "Sunburst",
		category: "Part to Whole",
	},
	csvexport: {
		icon: Download,
		label: "Export CSV",
		category: "Report Widgets",
	},
	filter: { icon: Filter, label: "Filter", category: "Report Widgets" },
};

/** Display order for category sections in the type picker. */
export type VizCategory =
	| "Metrics"
	| "Comparison"
	| "Trends"
	| "Part to Whole"
	| "Distribution"
	| "Map"
	| "Words"
	| "Report Widgets";

export const VIZ_CATEGORY_ORDER: VizCategory[] = [
	"Metrics",
	"Comparison",
	"Trends",
	"Part to Whole",
	"Distribution",
	"Map",
	"Words",
	"Report Widgets",
];

export function vizLabel(t: string): string {
	return VIZ_TYPE_META[t as VisualizationType]?.label ?? t;
}
