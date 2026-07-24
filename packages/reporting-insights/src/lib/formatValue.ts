import type { FormatRule } from "@/types/dashboard";

/**
 * Applies the first matching FormatRule for `column` to `value`.
 * Returns the raw `String(value)` when no rule matches.
 */
export function formatValue(
	value: unknown,
	column: string,
	formatRules: FormatRule[] = [],
): string {
	if (value == null) return "";
	const rule = formatRules.find((r) => r.column === column);
	if (!rule) return String(value);

	let formatted = String(value);

	if (rule.type === "date") {
		formatted = applyDateFormat(value, rule.dateFormat ?? "MM/DD/YYYY");
	} else if (rule.type === "int" || rule.type === "double") {
		const num =
			typeof value === "number" ? value : parseFloat(String(value));
		if (!isNaN(num)) {
			formatted = rule.useDefaultFormat
				? applyDefaultNumericFormat(num, rule.defaultFormat ?? "comma")
				: applyManualNumericFormat(num, rule);
		}
	}

	return `${rule.prepend ?? ""}${formatted}${rule.append ?? ""}`;
}

function applyDefaultNumericFormat(num: number, format: string): string {
	switch (format) {
		case "raw":
			return String(num);
		case "comma":
			return num.toLocaleString("en-US");
		case "dollar":
			return `$${num}`;
		case "dollar-comma":
			return `$${num.toLocaleString("en-US")}`;
		case "percent":
			return `${num}%`;
		case "k":
			return `${(num / 1_000).toFixed(2)}k`;
		case "M":
			return `${(num / 1_000_000).toFixed(2)}M`;
		case "B":
			return `${(num / 1_000_000_000).toFixed(2)}B`;
		case "T":
			return `${(num / 1_000_000_000_000).toFixed(2)}T`;
		case "accounting":
			return num < 0
				? `(${Math.abs(num).toLocaleString("en-US")})`
				: num.toLocaleString("en-US");
		case "scientific":
			return num.toExponential(2);
		default:
			return String(num);
	}
}

function applyManualNumericFormat(num: number, rule: FormatRule): string {
	const dec = rule.roundValue ?? 0;

	if (rule.formatNumber === "accounting") {
		const base = Math.abs(num).toFixed(dec);
		return num < 0
			? `(${withThousands(base, "comma")})`
			: withThousands(base, "comma");
	}
	if (rule.formatNumber === "scientific") return num.toExponential(dec);
	if (rule.formatNumber === "percentage") return `${num.toFixed(dec)}%`;

	let scaled = num;
	switch (rule.formatNumber) {
		case "thousand":
			scaled = num / 1_000;
			break;
		case "million":
			scaled = num / 1_000_000;
			break;
		case "billion":
			scaled = num / 1_000_000_000;
			break;
		case "trillion":
			scaled = num / 1_000_000_000_000;
			break;
	}

	const rounded = scaled.toFixed(dec);
	return withThousands(rounded, rule.delimiter ?? "none");
}

function withThousands(numStr: string, delimiter: string): string {
	if (delimiter === "none") return numStr;
	const groupSep = delimiter === "period" ? "." : ",";
	const decimalSep = delimiter === "period" ? "," : ".";
	const [integer, fraction] = numStr.split(".");
	const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
	return fraction !== undefined
		? `${grouped}${decimalSep}${fraction}`
		: grouped;
}

function applyDateFormat(value: unknown, format: string): string {
	if (!value) return "";
	const date = value instanceof Date ? value : new Date(String(value));
	if (isNaN(date.getTime())) return String(value);

	const Y = date.getFullYear();
	const M = date.getMonth() + 1;
	const D = date.getDate();
	const hrs = date.getHours();
	const min = date.getMinutes();
	const sec = date.getSeconds();

	const MONTH_FULL = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const MONTH_SHORT = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	const DAY_FULL = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];

	const tokens: Record<string, string> = {
		dddd: DAY_FULL[date.getDay()],
		YYYY: String(Y),
		YY: String(Y).slice(-2),
		MMMM: MONTH_FULL[M - 1],
		MMM: MONTH_SHORT[M - 1],
		HH: String(hrs).padStart(2, "0"),
		MM: String(M).padStart(2, "0"),
		DD: String(D).padStart(2, "0"),
		// single-char / ambiguous tokens last
		h: String(hrs % 12 || 12),
		mm: String(min).padStart(2, "0"),
		ss: String(sec).padStart(2, "0"),
		M: String(M),
		D: String(D),
		A: hrs >= 12 ? "PM" : "AM",
	};

	// Replace all tokens in one regex pass (longest alternatives listed first so
	// the engine matches e.g. "MMMM" before "MMM" before "MM" before "M").
	return format.replace(
		/dddd|YYYY|MMMM|MMM|HH|MM|DD|YY|h|mm|ss|M|D|A/g,
		(token) => tokens[token] ?? token,
	);
}
