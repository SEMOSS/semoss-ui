import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@semoss/ui/next";
import type { VisualizationType } from "@/types/dashboard";
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
}

type TabId = "data" | "tools";

export function VizConfigTabs({
	columns,
	visualizationType,
	value,
	onChange,
	rows,
}: VizConfigTabsProps) {
	const [activeTab, setActiveTab] = useState<TabId>("data");

	return (
		<Tabs
			value={activeTab}
			onValueChange={(v) => setActiveTab(v as TabId)}
			className="flex h-full flex-col gap-0"
		>
			<TabsList className="w-full justify-start rounded-none border-stone-200 border-b bg-stone-100/70 px-2">
				<TabsTrigger value="data">Data</TabsTrigger>
				<TabsTrigger value="tools">Tools</TabsTrigger>
			</TabsList>

			<TabsContent
				value="data"
				className="min-h-0 flex-1 overflow-hidden bg-white"
			>
				<VizConfigDropZones
					columns={columns}
					visualizationType={visualizationType}
					value={value}
					onChange={onChange}
				/>
			</TabsContent>
			<TabsContent
				value="tools"
				className="min-h-0 flex-1 overflow-hidden bg-white"
			>
				<ToolsPanel
					visualizationType={visualizationType}
					styling={value.styling}
					columns={columns.map((col) => col.name)}
					sortableColumns={activeDropZoneColumns(value)}
					rows={rows}
					metricColumns={(value.metrics ?? []).map((c) => c.name)}
					hasSizeColumn={Boolean(value.size?.[0]?.name)}
					xKey={value.xAxis?.[0]?.name}
					yKeys={(value.yAxis ?? []).map((c) => c.name)}
					columnAggregations={Object.fromEntries(
						(value.yAxis ?? [])
							.filter((c) => c.aggregation)
							.map((c) => [c.name, c.aggregation as string]),
					)}
					onChange={(styling) => {
						onChange({
							...value,
							styling,
						} as DropZoneDataWithTable);
					}}
				/>
			</TabsContent>
		</Tabs>
	);
}
