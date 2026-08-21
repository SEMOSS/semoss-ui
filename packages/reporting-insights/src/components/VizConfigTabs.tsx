import { useState } from "react";
import type {
	ColorPalette as ColorPaletteType,
	VisualizationType,
} from "@/types/dashboard";
import { ToolsPanel } from "./tools/ToolsPanel";
import {
	type Column,
	type DropZoneData,
	type DropZoneDataWithTable,
	VizConfigDropZones,
} from "./VizConfigDropZones";

// Re-export types for external use
export type { Column, DropZoneData, DropZoneDataWithTable };

/**
 * Collect unique column names from whatever drop zones are currently populated.
 * Works for any viz type — iterates all zone arrays generically plus tableColumns.
 */
function activeDropZoneColumns(value: DropZoneDataWithTable): string[] {
	const names = new Set<string>();
	// Table type stores its columns as a string array
	value.tableColumns?.forEach((c) => names.add(c));
	// All other zone arrays contain DroppedColumn objects with a `name` field
	for (const [key, val] of Object.entries(value)) {
		if (
			key === "tableColumns" ||
			key === "columnAggregations" ||
			key === "styling"
		)
			continue;
		if (Array.isArray(val)) {
			for (const item of val) {
				if (
					item &&
					typeof item === "object" &&
					"name" in item &&
					typeof (item as any).name === "string"
				) {
					const name = (item as any).name as string;
					if (name) names.add(name);
				}
			}
		}
	}
	return Array.from(names);
}

interface VizConfigTabsProps {
	columns: Column[];
	visualizationType: VisualizationType;
	value: DropZoneDataWithTable;
	onChange: (data: DropZoneDataWithTable) => void;
	/** Sample rows from the editor preview — used by the Filter Visualization tool. */
	rows?: Array<Record<string, unknown>>;
	customColorPalettes?: ColorPaletteType[];
	onCustomColorPalettesChange?: (palettes: ColorPaletteType[]) => void;
}

type TabId = "data" | "tools";

export function VizConfigTabs({
	columns,
	visualizationType,
	value,
	onChange,
	rows,
	customColorPalettes,
	onCustomColorPalettesChange,
}: VizConfigTabsProps) {
	const [activeTab, setActiveTab] = useState<TabId>("data");

	return (
		<div className="flex h-full flex-col">
			{/* Tab header */}
			<div className="flex border-stone-200 border-b bg-stone-50/50">
				<button
					onClick={() => setActiveTab("data")}
					className={`-mb-px border-b-2 px-5 py-2.5 font-semibold text-sm transition-colors ${
						activeTab === "data"
							? "border-indigo-500 bg-white text-indigo-600"
							: "border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-700"
					}`}
				>
					Data
				</button>
				<button
					onClick={() => setActiveTab("tools")}
					className={`-mb-px border-b-2 px-5 py-2.5 font-semibold text-sm transition-colors ${
						activeTab === "tools"
							? "border-indigo-500 bg-white text-indigo-600"
							: "border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-700"
					}`}
				>
					Tools
				</button>
			</div>

			{/* Tab content */}
			<div className="flex-1 overflow-hidden bg-white">
				{activeTab === "data" && (
					<VizConfigDropZones
						columns={columns}
						visualizationType={visualizationType}
						value={value}
						onChange={onChange}
					/>
				)}
				{activeTab === "tools" && (
					<ToolsPanel
						visualizationType={visualizationType}
						styling={value.styling}
						columns={columns.map((col) => col.name)}
						sortableColumns={activeDropZoneColumns(value)}
						rows={rows}
						// KPI: configured metric columns (used by the per-card title selector)
						metricColumns={(value.metrics ?? []).map((c) => c.name)}
						// World Map: signal whether the user has dropped a column into the Size zone
						// — used to enable/disable the marker-size sliders.
						hasSizeColumn={Boolean(value.size?.[0]?.name)}
						// Bar / Line / Combo / Treemap: drop-zone columns + per-column aggregations.
						xKey={
							visualizationType === "treemap"
								? value.label?.[0]?.name
								: value.xAxis?.[0]?.name
						}
						yKeys={
							visualizationType === "combo"
								? [
										...new Set([
											...(value.barSeries ?? []).map(
												(c) => c.name,
											),
											...(value.lineSeries ?? []).map(
												(c) => c.name,
											),
										]),
									]
								: visualizationType === "treemap"
									? (value.size ?? []).map((c) => c.name)
									: visualizationType === "sunburst" ||
											visualizationType === "pie"
										? (value.value ?? []).map((c) => c.name)
										: (value.yAxis ?? []).map((c) => c.name)
						}
						columnAggregations={Object.fromEntries(
							(visualizationType === "combo"
								? [
										...(value.barSeries ?? []),
										...(value.lineSeries ?? []),
									]
								: visualizationType === "treemap"
									? (value.size ?? [])
									: visualizationType === "sunburst" ||
											visualizationType === "pie"
										? (value.value ?? [])
										: (value.yAxis ?? [])
							)
								.filter((c) => c.aggregation)
								.map((c) => [c.name, c.aggregation as string]),
						)}
						customColorPalettes={customColorPalettes}
						onCustomColorPalettesChange={
							onCustomColorPalettesChange
						}
						onChange={(styling) => {
							onChange({
								...value,
								styling,
							} as DropZoneDataWithTable);
						}}
					/>
				)}
			</div>
		</div>
	);
}
