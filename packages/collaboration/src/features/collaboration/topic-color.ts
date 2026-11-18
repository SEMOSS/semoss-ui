import type { Topic } from "./state/collaboration.types";

/**
 * Hash a topic ID to a consistent color tone class.
 * Used as fallback when topic.color is unset.
 */
const TONES = [
	"bg-chart-1",
	"bg-chart-2",
	"bg-chart-3",
	"bg-chart-4",
	"bg-chart-5",
];

function hashTopicId(topicId: string): string {
	const index =
		[...topicId].reduce(
			(value, letter) => value + letter.charCodeAt(0),
			0,
		) % TONES.length;
	return TONES[index] ?? "bg-chart-1";
}

/**
 * Parse a color input from various formats to normalized hex format.
 * Accepts: #rgb, #rrggbb, rgb(r,g,b), r,g,b
 * Returns: normalized lowercase #rrggbb or null if invalid.
 */
export function parseColor(input: string | null | undefined): string | null {
	if (!input || typeof input !== "string") return null;

	const trimmed = input.trim().toLowerCase();

	if (trimmed === "") return null;

	// Try #rgb or #rrggbb
	if (trimmed.startsWith("#")) {
		const hex = trimmed.slice(1);
		if (/^[0-9a-f]{3}$/.test(hex)) {
			// #rgb -> #rrggbb
			return `#${[...hex].map((c) => c + c).join("")}`;
		}
		if (/^[0-9a-f]{6}$/.test(hex)) {
			// #rrggbb
			return `#${hex}`;
		}
		return null;
	}

	// Try rgb(r,g,b)
	const rgbMatch = trimmed.match(
		/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
	);
	if (rgbMatch) {
		const [, r, g, b] = rgbMatch;
		return rgbFromValues(Number(r), Number(g), Number(b));
	}

	// Try r,g,b
	const csvMatch = trimmed.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
	if (csvMatch) {
		const [, r, g, b] = csvMatch;
		return rgbFromValues(Number(r), Number(g), Number(b));
	}

	return null;
}

/**
 * Convert RGB values to normalized #rrggbb hex.
 * Values must be 0-255; out-of-range returns null.
 */
function rgbFromValues(r: number, g: number, b: number): string | null {
	if (!Number.isInteger(r) || !Number.isInteger(g) || !Number.isInteger(b)) {
		return null;
	}
	if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
		return null;
	}
	return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Convert hex color (e.g., #rrggbb) to RGB object.
 * Assumes input is already normalized from parseColor.
 */
export function toRgb(hex: string): { r: number; g: number; b: number } | null {
	if (!hex || !hex.startsWith("#") || hex.length !== 7) {
		return null;
	}
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return { r, g, b };
}

/**
 * Get the display color for a topic.
 * Returns backgroundColor style object based on topic.color (custom or hashed).
 */
export function topicColor(topic: Topic | { id: string; color: string }): {
	backgroundColor: string;
} {
	if (topic.color) {
		// Custom color: use it as-is
		return { backgroundColor: topic.color };
	}

	// No custom color: derive from hash of topic ID
	const toneClass = hashTopicId(topic.id);
	// Map tone classes to example hex colors (these match the design system)
	const toneToHex: Record<string, string> = {
		"bg-chart-1": "#8a9099",
		"bg-chart-2": "#20b2aa",
		"bg-chart-3": "#ff6347",
		"bg-chart-4": "#ffa500",
		"bg-chart-5": "#1e90ff",
	};

	const hex = toneToHex[toneClass] ?? "#8a9099";
	return { backgroundColor: hex };
}

/**
 * Get the automatic (hashed) color for a topic ID.
 * Used when topic.color is unset to preview the automatic color.
 */
export function getAutomaticColor(topicId: string): string {
	const toneClass = hashTopicId(topicId);
	const toneToHex: Record<string, string> = {
		"bg-chart-1": "#8a9099",
		"bg-chart-2": "#20b2aa",
		"bg-chart-3": "#ff6347",
		"bg-chart-4": "#ffa500",
		"bg-chart-5": "#1e90ff",
	};

	return toneToHex[toneClass] ?? "#8a9099";
}
