import { useState } from "react";
import { Select } from "@/components/ui";
import type { VizFilterGroup } from "@/lib/vizFilter";
import type { KpiStyling } from "@/types/dashboard";
import { FilterVisualization } from "../shared/FilterVisualization";

interface KpiFilterVisualizationProps {
	/** Configured KPI metric column names. */
	metricColumns: string[];
	/** Data columns available to build rules against. */
	columns: string[];
	/** Sample rows from the editor preview — used to suggest values. */
	rows?: Array<Record<string, unknown>>;
	/** Per-metric filter trees, keyed by metric column. */
	value?: KpiStyling["vizFilters"];
	/** Write back the per-metric map; pass `undefined` to clear all. */
	onChange: (vizFilters: KpiStyling["vizFilters"]) => void;
}

/**
 * Per-card Filter Visualization editor for KPI. Mirrors the title tool: a metric
 * selector picks which card's filter is being edited, and each card keeps its own
 * rule tree under `styling.kpi.vizFilters[metric]`. So two KPI cards built from the
 * same query can show differently-filtered values. A `•` marks metrics that
 * already have a filter.
 */
export function KpiFilterVisualization({
	metricColumns,
	columns,
	rows,
	value,
	onChange,
}: KpiFilterVisualizationProps) {
	const [selectedMetric, setSelectedMetric] = useState<string>(
		metricColumns[0] ?? "",
	);

	// Re-anchor if the selected metric was removed from the Metrics drop zone.
	if (metricColumns.length && !metricColumns.includes(selectedMetric)) {
		setSelectedMetric(metricColumns[0]);
	}

	if (!metricColumns.length) {
		return (
			<p className="px-1 text-stone-400 text-xs">
				Drag a column into the Metrics drop zone to filter its card.
			</p>
		);
	}

	const current = value?.[selectedMetric];

	const handleChange = (next: VizFilterGroup) => {
		onChange({ ...(value ?? {}), [selectedMetric]: next });
	};
	const handleReset = () => {
		if (!value) return;
		const next = { ...value };
		delete next[selectedMetric];
		onChange(Object.keys(next).length ? next : undefined);
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Apply to
				</label>
				<Select
					value={selectedMetric}
					onChange={(e) => setSelectedMetric(e.target.value)}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				>
					{metricColumns.map((col) => (
						<option key={col} value={col}>
							{col}
							{value?.[col] ? " •" : ""}
						</option>
					))}
				</Select>
				<p className="mt-1 text-[11px] text-stone-400">
					Filter for{" "}
					<span className="font-medium text-stone-500">
						{selectedMetric}
					</span>
					's card. Reset clears this card's filter.
				</p>
			</div>

			<FilterVisualization
				columns={columns}
				rows={rows}
				value={current}
				onChange={handleChange}
				onReset={handleReset}
			/>
		</div>
	);
}
