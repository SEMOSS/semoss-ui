/**
 * Content sizing/placement for a visualization *within its panel* (does not affect
 * the flexlayout panel). Shared by the app viewer, editor preview, and portal
 * viewer so an author's Size & Position choice renders identically everywhere.
 */
import type { CSSProperties } from "react";
import type { VisualizationStyling } from "@/types/dashboard";

type SizeCfg = NonNullable<VisualizationStyling["size"]>;

const FLEX: Record<"start" | "center" | "end", string> = {
	start: "flex-start",
	center: "center",
	end: "flex-end",
};

/** True when the author has pinned a width or height. */
export function hasContentSize(size?: SizeCfg): boolean {
	return !!(size && (size.width || size.height));
}

/**
 * Returns the outer (panel-filling flex container) and inner (sized box) styles.
 * When no explicit size is set, callers should skip this and let content fill.
 */
export function contentSizeStyles(size?: SizeCfg): {
	outer: CSSProperties;
	inner: CSSProperties;
} {
	const s = size ?? {};
	// Stretch makes the sized box fill the panel edge-to-edge (alignment is moot).
	const justify = s.stretch ? "stretch" : FLEX[s.align ?? "start"];
	const alignItems = s.stretch ? "stretch" : FLEX[s.valign ?? "start"];
	return {
		outer: {
			display: "flex",
			width: "100%",
			height: "100%",
			minWidth: 0,
			minHeight: 0,
			overflow: "auto",
			justifyContent: justify,
			alignItems,
		},
		inner: {
			width: s.width || "100%",
			height: s.height || "100%",
			flex: "0 0 auto",
			minWidth: 0,
			minHeight: 0,
			display: "flex",
			flexDirection: "column",
		},
	};
}
