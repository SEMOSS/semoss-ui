/**
 * CSV Export widget — a single button visualization that downloads the rows of
 * its own SQL query as a CSV file. Used by both the main app and the portal.
 */
import type { CSSProperties } from "react";
import { useState } from "react";
import { PhiExportWarningModal } from "@/components/PhiExportWarningModal";
import { csvColDisplayName } from "@/lib/tableAggregate";

export interface CsvExportConfig {
	csvExportLabel?: string;
	/** Columns to include in the export. undefined = all columns. */
	exportColumns?: string[];
	/** Per-column aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max'. */
	exportAggregations?: Record<string, string>;
	buttonBgColor?: string;
	borderStyle?: string;
	borderWidth?: string;
	borderColor?: string;
	fontSize?: string;
	fontSizeUnit?: string;
	fontColor?: string;
	textAlign?: "left" | "center" | "right";
	buttonHeight?: string;
	buttonHeightUnit?: string;
	buttonWidth?: string;
	buttonWidthUnit?: string;
	alignment?: "left" | "center" | "right";
}

function processRows(
	rows: Record<string, any>[],
	exportColumns: string[] | undefined,
	aggregations: Record<string, string>,
): Record<string, any>[] {
	if (!rows.length) return rows;
	const allCols = Object.keys(rows[0]);
	const activeCols =
		exportColumns && exportColumns.length > 0
			? exportColumns.filter((c) => allCols.includes(c))
			: allCols;

	const activeAggs = Object.fromEntries(
		activeCols
			.filter((c) => aggregations[c])
			.map((c) => [c, aggregations[c]]),
	);

	if (Object.keys(activeAggs).length === 0) {
		return rows.map((r) =>
			Object.fromEntries(activeCols.map((c) => [c, r[c]])),
		);
	}

	const groupByCols = activeCols.filter((c) => !activeAggs[c]);
	const aggCols = activeCols.filter((c) => activeAggs[c]);
	const groups = new Map<string, Record<string, any>[]>();
	for (const row of rows) {
		const key = groupByCols.map((c) => String(row[c] ?? "")).join("\x00");
		const arr = groups.get(key) ?? [];
		arr.push(row);
		groups.set(key, arr);
	}
	return Array.from(groups.values()).map((grp) => {
		const result: Record<string, any> = {};
		for (const c of groupByCols) result[c] = grp[0][c];
		for (const c of aggCols) {
			const nums = grp.map((r) => Number(r[c])).filter((n) => !isNaN(n));
			const displayKey = csvColDisplayName(c, activeAggs[c]);
			switch (activeAggs[c]) {
				case "sum":
					result[displayKey] = nums.reduce((a, b) => a + b, 0);
					break;
				case "count":
					result[displayKey] = grp.length;
					break;
				case "avg":
					result[displayKey] = nums.length
						? nums.reduce((a, b) => a + b, 0) / nums.length
						: 0;
					break;
				case "min":
					result[displayKey] = nums.length ? Math.min(...nums) : null;
					break;
				case "max":
					result[displayKey] = nums.length ? Math.max(...nums) : null;
					break;
				default:
					result[displayKey] = grp[0][c];
			}
		}
		return result;
	});
}

function toCsv(rows: Record<string, any>[], columns?: string[]): string {
	if (!rows.length) return "";
	const cols = columns?.length ? columns : Object.keys(rows[0]);
	const escape = (v: any) => {
		const s = v != null ? String(v) : "";
		return s.includes(",") || s.includes('"') || s.includes("\n")
			? `"${s.replace(/"/g, '""')}"`
			: s;
	};
	return [
		cols.join(","),
		...rows.map((r) => cols.map((c) => escape(r[c])).join(",")),
	].join("\n");
}

export function downloadCsvFile(
	rows: Record<string, any>[],
	filename: string,
	columns?: string[],
) {
	const csv = toCsv(rows, columns);
	if (!csv) return;
	const a = Object.assign(document.createElement("a"), {
		href: URL.createObjectURL(
			new Blob([csv], { type: "text/csv;charset=utf-8;" }),
		),
		download: filename.endsWith(".csv") ? filename : `${filename}.csv`,
	});
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

interface Props {
	rows: Record<string, any>[];
	columns?: string[];
	title: string;
	/** Optional custom button label — kept for backwards compatibility; config.csvExportLabel takes precedence. */
	label?: string;
	config?: CsvExportConfig;
	/** When true, clicking the button shows a PHI/PII warning modal before downloading. */
	phi?: boolean;
}

export function CsvExportButton({
	rows,
	columns,
	title,
	label,
	config,
	phi,
}: Props) {
	const [showPhiModal, setShowPhiModal] = useState(false);
	const cfg = config ?? {};
	const processedRows = processRows(
		rows ?? [],
		cfg.exportColumns,
		cfg.exportAggregations ?? {},
	);
	const aggs = cfg.exportAggregations ?? {};
	const baseCols =
		cfg.exportColumns && cfg.exportColumns.length > 0
			? cfg.exportColumns
			: columns;
	const exportCols = baseCols?.map((c) => csvColDisplayName(c, aggs[c]));
	const count = processedRows.length;

	const doDownload = () =>
		downloadCsvFile(processedRows, title || "export", exportCols);

	const alignMap: Record<string, CSSProperties["alignItems"]> = {
		left: "flex-start",
		center: "center",
		right: "flex-end",
	};

	const containerStyle: CSSProperties = {
		alignItems: alignMap[cfg.alignment ?? "center"] ?? "center",
	};

	const hasBorder = cfg.borderStyle && cfg.borderStyle !== "none";
	const buttonStyle: CSSProperties = {
		backgroundColor: cfg.buttonBgColor ?? "#40a0ff",
		...(cfg.fontColor ? { color: cfg.fontColor } : {}),
		justifyContent:
			cfg.textAlign === "left"
				? "flex-start"
				: cfg.textAlign === "right"
					? "flex-end"
					: "center",
		...(hasBorder
			? {
					borderStyle:
						cfg.borderStyle as CSSProperties["borderStyle"],
					borderWidth: cfg.borderWidth
						? `${cfg.borderWidth}px`
						: "1px",
					borderColor: cfg.borderColor ?? "#e2e8f0",
				}
			: {}),
		...(cfg.fontSize
			? { fontSize: `${cfg.fontSize}${cfg.fontSizeUnit ?? "px"}` }
			: {}),
		height: `${cfg.buttonHeight ?? "100"}${cfg.buttonHeightUnit ?? "%"}`,
		width: `${cfg.buttonWidth ?? "100"}${cfg.buttonWidthUnit ?? "%"}`,
	};

	return (
		<div
			className="flex h-full w-full flex-col justify-center"
			style={containerStyle}
		>
			<button
				type="button"
				onClick={() => (phi ? setShowPhiModal(true) : doDownload())}
				disabled={!count}
				style={buttonStyle}
				className={[
					"inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-sm text-white shadow-soft",
					"transition-colors disabled:cursor-not-allowed disabled:opacity-40",
				]
					.filter(Boolean)
					.join(" ")}
			>
				{cfg.csvExportLabel || label || "Export to CSV"}
			</button>

			{showPhiModal && (
				<PhiExportWarningModal
					onConfirm={() => {
						doDownload();
						setShowPhiModal(false);
					}}
					onCancel={() => setShowPhiModal(false)}
				/>
			)}
		</div>
	);
}
