import type { ReactElement, ReactNode } from "react";

export interface GpuStatTileProps {
	/** What the tile shows, such as "Utilization" */
	label: string;
	/** The live value with its unit; null when there is no reading */
	value: string | null;
	/** The tile's trend, such as a sparkline */
	children?: ReactNode;
}

/** One live value of a GPU or node, with its trend below it. */
export function GpuStatTile({
	label,
	value,
	children,
}: GpuStatTileProps): ReactElement {
	return (
		<div className="flex min-w-0 flex-col gap-1">
			<span className="text-muted-foreground text-xs">{label}</span>
			{/* one height for both, so a reading arriving does not move the tile */}
			{value === null ? (
				<span className="flex h-7 items-center text-muted-foreground text-sm">
					No reading
				</span>
			) : (
				<span className="flex h-7 items-center font-semibold text-xl">
					{value}
				</span>
			)}
			{children}
		</div>
	);
}
