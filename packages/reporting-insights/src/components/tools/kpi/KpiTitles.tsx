import { useState } from "react";
import { Select } from "@/components/ui";
import type { ChartTitleConfig, KpiStyling } from "@/types/dashboard";
import { ChartTitle } from "../shared/ChartTitle";

interface KpiTitlesProps {
	/** Configured KPI metric column names. Empty when nothing is in the Metrics drop zone. */
	metricColumns: string[];
	/** Per-metric overrides; key = metric column name. */
	perCardTitles?: KpiStyling["titles"];
	/** Write back the per-card map. Pass `undefined` to clear all overrides. */
	onPerCardChange: (titles: KpiStyling["titles"]) => void;
}

/**
 * Title editor for KPI cards. Renders a metric selector ABOVE the standard
 * title controls so the user picks which card's title to edit. All edits go
 * to per-card overrides (`styling.kpi.titles[metric]`); the dropdown defaults
 * to the first configured metric column. A `•` marker is shown next to
 * metrics that already have an override so the user can see at a glance
 * which cards have been customized.
 *
 * The actual title controls (text / size / color / weight / alignment / font)
 * are reused from the shared `ChartTitle` component — only the selector and
 * routing logic live here.
 */
export function KpiTitles({
	metricColumns,
	perCardTitles,
	onPerCardChange,
}: KpiTitlesProps) {
	const [selectedMetric, setSelectedMetric] = useState<string>(
		metricColumns[0] ?? "",
	);

	// Re-anchor the selection if the previously-selected metric is no longer
	// configured (e.g. user removed it from the Metrics drop zone).
	if (metricColumns.length && !metricColumns.includes(selectedMetric)) {
		setSelectedMetric(metricColumns[0]);
	}

	if (!metricColumns.length) {
		return (
			<p className="px-1 text-stone-400 text-xs">
				Drag a column into the Metrics drop zone to edit its title.
			</p>
		);
	}

	const currentValue: ChartTitleConfig | undefined =
		perCardTitles?.[selectedMetric];

	const handleChange = (next: ChartTitleConfig) => {
		onPerCardChange({ ...(perCardTitles ?? {}), [selectedMetric]: next });
	};

	const handleReset = () => {
		if (!perCardTitles) return;
		// Drop just the selected metric's override; keep the rest.
		const next = { ...perCardTitles };
		delete next[selectedMetric];
		onPerCardChange(Object.keys(next).length ? next : undefined);
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
					{metricColumns.map((col) => {
						const hasOverride = !!perCardTitles?.[col];
						return (
							<option key={col} value={col}>
								{col}
								{hasOverride ? " •" : ""}
							</option>
						);
					})}
				</Select>
				<p className="mt-1 text-[11px] text-stone-400">
					Per-card title for{" "}
					<span className="font-medium text-stone-500">
						{selectedMetric}
					</span>
					. Reset clears this card's override.
				</p>
			</div>

			<ChartTitle
				visualizationType="kpi"
				value={currentValue}
				onChange={handleChange}
				onReset={handleReset}
			/>
		</div>
	);
}
