import type { ReactNode } from "react";

interface TooltipProps {
	label: string;
	children: ReactNode;
	/** Vertical placement of the tooltip relative to the wrapped element. */
	side?: "top" | "bottom";
	/**
	 * Horizontal alignment relative to the trigger. Use `"start"` for buttons
	 * near the left edge (tooltip grows rightward), `"end"` for buttons near
	 * the right edge (tooltip grows leftward), `"center"` otherwise.
	 */
	align?: "start" | "center" | "end";
}

/**
 * Fast pure-CSS tooltip. Browser `title` attributes have a ~600ms delay; this
 * uses `group-hover` + `transition delay-75` so the tooltip is up in ~150ms.
 */
export const Tooltip = ({
	label,
	children,
	side = "top",
	align = "center",
}: TooltipProps) => {
	const verticalClasses =
		side === "top" ? "bottom-full mb-1" : "top-full mt-1";
	const horizontalClasses =
		align === "start"
			? "left-0"
			: align === "end"
				? "right-0"
				: "left-1/2 -translate-x-1/2";

	return (
		<span className="group relative inline-flex">
			{children}
			<span
				className={`pointer-events-none absolute z-50 max-w-[min(260px,calc(100vw-1rem))] break-words rounded bg-zinc-800 px-2 py-1 text-white text-xs opacity-0 shadow-md transition-opacity delay-75 duration-100 group-focus-within:opacity-100 group-hover:opacity-100 ${verticalClasses} ${horizontalClasses}`}
				role="tooltip"
			>
				{label}
			</span>
		</span>
	);
};
