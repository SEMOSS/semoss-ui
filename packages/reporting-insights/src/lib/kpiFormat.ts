/**
 * KPI number formatting — legacy-parity options: prefix/suffix, configurable
 * thousands/decimal delimiters, rounding to N places, and metric (compact)
 * notation (1.2K / 3.4M). Shared by the KPI visualization in both the app and
 * the generated portal so previews and published dashboards format identically.
 */
import type { VisualizationConfig } from "@/types/dashboard";

/** Round to `places` decimals without floating-point noise (e.g. 1.005 → 1.01). */
function roundTo(n: number, places: number): number {
	if (!isFinite(n)) return 0;
	const f = 10 ** places;
	return Math.round((n + Number.EPSILON) * f) / f;
}

/** Insert a grouping delimiter every three integer digits. */
function groupThousands(intPart: string, sep: string): string {
	if (!sep) return intPart;
	return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** Standard (non-compact) formatting with chosen delimiters. */
function formatStandard(
	value: number,
	decimals: number | "auto" | undefined,
	thousandsSep: string,
	decimalSep: string,
): string {
	const neg = value < 0;
	let s: string;
	if (decimals === undefined || decimals === "auto") {
		// Up to 2 decimals, trailing zeros trimmed.
		s = String(roundTo(Math.abs(value), 2));
	} else {
		s = Math.abs(value).toFixed(Math.max(0, Math.min(6, decimals)));
	}
	const [intPart, fracPart] = s.split(".");
	const grouped = groupThousands(intPart, thousandsSep);
	const body = fracPart ? grouped + decimalSep + fracPart : grouped;
	return (neg ? "-" : "") + body;
}

/** Compact / metric notation: 1_200 → "1.2K", 3_400_000 → "3.4M". */
function formatCompact(
	value: number,
	decimals: number | "auto" | undefined,
	decimalSep: string,
): string {
	const abs = Math.abs(value);
	let div = 1;
	let unit = "";
	if (abs >= 1e12) {
		div = 1e12;
		unit = "T";
	} else if (abs >= 1e9) {
		div = 1e9;
		unit = "B";
	} else if (abs >= 1e6) {
		div = 1e6;
		unit = "M";
	} else if (abs >= 1e3) {
		div = 1e3;
		unit = "K";
	}
	const places =
		decimals === undefined || decimals === "auto"
			? 1
			: Math.max(0, Math.min(6, decimals));
	let s = (value / div).toFixed(places);
	// Trim trailing zeros so "1.0K" reads as "1K" (only when decimals are auto).
	if (decimals === undefined || decimals === "auto")
		s = s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
	return s.replace(".", decimalSep) + unit;
}

/**
 * Format a KPI value per its visualization config. Backward compatible: a config
 * with only the old `kpiFormat` still behaves as before ('auto' = compact).
 */
export function formatKpiNumber(n: number, cfg?: VisualizationConfig): string {
	const c = cfg ?? {};
	if (!isFinite(n)) n = 0;

	const pre = c.kpiPrefix ?? "";
	const suf = c.kpiSuffix ?? "";
	const isCurrency = c.kpiFormat === "currency";
	const isPercent = c.kpiFormat === "percent";

	// Notation: explicit choice wins; otherwise default to the full number
	// (e.g. 100,000 rather than 100K). Users opt into compact via the tool.
	const notation = c.kpiNotation ?? "standard";
	const thousandsSep =
		c.kpiThousandsSep === "none" ? "" : (c.kpiThousandsSep ?? ",");
	const decimalSep = c.kpiDecimalSep ?? ".";

	const body =
		notation === "compact"
			? formatCompact(n, c.kpiDecimals, decimalSep)
			: formatStandard(n, c.kpiDecimals, thousandsSep, decimalSep);

	const currencySym = isCurrency ? "$" : "";
	const percentSym = isPercent ? "%" : "";
	return `${pre}${currencySym}${body}${percentSym}${suf}`;
}
