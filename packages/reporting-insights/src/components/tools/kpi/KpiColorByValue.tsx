import { useState } from "react";
import { Select } from "@/components/ui";
import type { KpiColorRule } from "@/types/dashboard";
import { ColorByValue } from "../shared/ColorByValue";

interface KpiColorByValueProps {
	/** Configured KPI metric column names. */
	metricColumns: string[];
	/** The full flat list of KPI color rules (across all metrics). */
	value: KpiColorRule[];
	onChange: (rules: KpiColorRule[]) => void;
}

/**
 * Per-card Color by Value editor for KPI. Mirrors the title tool: a metric
 * selector picks which card's rules are being edited, and the underlying shared
 * `ColorByValue` is scoped to that metric (its rules are filtered in, new rules
 * are fixed to the selected metric). All edits merge back into the single flat
 * `styling.kpi.colorRules` array the renderer reads. A `•` marks metrics that
 * already have rules.
 */
export function KpiColorByValue({
	metricColumns,
	value,
	onChange,
}: KpiColorByValueProps) {
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
				Drag a column into the Metrics drop zone to add color rules.
			</p>
		);
	}

	const selectedRules = value.filter(
		(r) => r.metricColumn === selectedMetric,
	);
	const others = value.filter((r) => r.metricColumn !== selectedMetric);

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
					{metricColumns.map((col) => {
						const hasRules = value.some(
							(r) => r.metricColumn === col,
						);
						return (
							<option key={col} value={col}>
								{col}
								{hasRules ? " •" : ""}
							</option>
						);
					})}
				</Select>
				<p className="mt-1 text-[11px] text-stone-400">
					Color rules for{" "}
					<span className="font-medium text-stone-500">
						{selectedMetric}
					</span>
					's card.
				</p>
			</div>

			<ColorByValue
				columns={metricColumns}
				visualizationType="kpi"
				value={selectedRules}
				fixedMetricColumn={selectedMetric}
				onChange={(rules) =>
					onChange([...others, ...(rules as KpiColorRule[])])
				}
				onReset={() => onChange(others)}
			/>
		</div>
	);
}
