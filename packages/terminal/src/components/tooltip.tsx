import type { ReactNode } from "react";

interface TooltipProps {
	label: string;
	children: ReactNode;
	/** Placement of the tooltip relative to the wrapped element. */
	side?: "top" | "bottom" | "left" | "right";
	/**
	 * Cross-axis alignment relative to the trigger. For top/bottom this is
	 * horizontal; for left/right it's vertical. `"start"` aligns to the
	 * leading edge, `"end"` to the trailing edge, `"center"` otherwise.
	 */
	align?: "start" | "center" | "end";
}

/**
 * Fast pure-CSS tooltip. Browser `title` attributes have a ~600ms delay; this
 * uses `group-hover` + `transition delay-75` so the tooltip is up in ~150ms.
 *
 * Note: this is `position: absolute`, not portaled, so the tooltip can be
 * clipped if a parent has `overflow: hidden`. When that happens, prefer the
 * `side` that points away from the constrained edge (e.g. `right` for
 * controls pinned to the left sidebar).
 */
export const Tooltip = ({
	label,
	children,
	side = "top",
	align = "center",
}: TooltipProps) => {
	// Use logical `start-*`/`end-*` for horizontal cross-axis so `align="end"`
	// anchors to the reading-trailing edge in both LTR and RTL — otherwise a
	// physical `right-0` keeps tooltips clipped off-screen on right-anchored
	// buttons (Run / Submit) once the page flips to RTL. Likewise for the
	// left/right side anchors, we use `start-full`/`end-full`.
	let positionClasses: string;
	if (side === "top") {
		const cross =
			align === "start"
				? "start-0"
				: align === "end"
					? "end-0"
					: "start-1/2 -translate-x-1/2 rtl:translate-x-1/2";
		positionClasses = `bottom-full mb-1 ${cross}`;
	} else if (side === "bottom") {
		const cross =
			align === "start"
				? "start-0"
				: align === "end"
					? "end-0"
					: "start-1/2 -translate-x-1/2 rtl:translate-x-1/2";
		positionClasses = `top-full mt-1 ${cross}`;
	} else if (side === "right") {
		const cross =
			align === "start"
				? "top-0"
				: align === "end"
					? "bottom-0"
					: "top-1/2 -translate-y-1/2";
		positionClasses = `start-full ms-1 ${cross}`;
	} else {
		const cross =
			align === "start"
				? "top-0"
				: align === "end"
					? "bottom-0"
					: "top-1/2 -translate-y-1/2";
		positionClasses = `end-full me-1 ${cross}`;
	}

	return (
		<span className="group relative inline-flex">
			{children}
			<span
				className={`pointer-events-none absolute z-50 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-white text-xs opacity-0 shadow-md transition-opacity delay-75 duration-100 group-focus-within:opacity-100 group-hover:opacity-100 ${positionClasses}`}
				role="tooltip"
			>
				{label}
			</span>
		</span>
	);
};
