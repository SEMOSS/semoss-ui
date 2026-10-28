import { type PointerEvent, type ReactElement, useState } from "react";
import { cn } from "@semoss/ui/next";
import type { ServingGpuPoint } from "@/api/model-serving";
import { formatPointTime } from "./serving-gpu-format";

export interface SparklineProps {
	/** What the line shows, such as "Utilization over the last hour"; the chart's name */
	label: string;
	/** The points, oldest first */
	points: readonly ServingGpuPoint[];
	/** The value axis, low to high */
	domain: readonly [number, number];
	/** The time axis in seconds since the epoch, so a short history keeps its place in the window */
	timeDomain: readonly [number, number];
	/** Seconds between points; a longer gap breaks the line instead of bridging it */
	stepSeconds: number;
	/** A value with its unit, for the readout */
	format: (value: number) => string;
	/** What the line under the chart says while no point is pointed at */
	caption: string;
	className?: string;
}

/** The drawing's own units; the SVG stretches them to its box */
const WIDTH = 100;
const HEIGHT = 32;
/** Room above and below the line for the end dot */
const PAD = 4;

/** Where a point is drawn, in the drawing's units */
const position = (
	[time, value]: ServingGpuPoint,
	domain: readonly [number, number],
	timeDomain: readonly [number, number],
): { x: number; y: number } => {
	const span = timeDomain[1] - timeDomain[0] || 1;
	const range = domain[1] - domain[0] || 1;
	const along = Math.min(1, Math.max(0, (time - timeDomain[0]) / span));
	const height = Math.min(1, Math.max(0, (value - domain[0]) / range));
	return {
		x: along * WIDTH,
		y: PAD + (1 - height) * (HEIGHT - 2 * PAD),
	};
};

/** The line through the points, broken where points are missing. */
function linePath(
	points: readonly ServingGpuPoint[],
	domain: readonly [number, number],
	timeDomain: readonly [number, number],
	stepSeconds: number,
): string {
	let path = "";
	let previous: number | null = null;
	for (const point of points) {
		const { x, y } = position(point, domain, timeDomain);
		const isGap =
			previous === null || point[0] - previous > stepSeconds * 1.5;
		path += `${isGap ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
		previous = point[0];
	}
	return path;
}

/** The point nearest a time */
function nearest(
	points: readonly ServingGpuPoint[],
	time: number,
): ServingGpuPoint | null {
	let best: ServingGpuPoint | null = null;
	for (const point of points) {
		if (!best || Math.abs(point[0] - time) < Math.abs(best[0] - time)) {
			best = point;
		}
	}
	return best;
}

/**
 * A history as a thin line in the muted ink with the latest point in the
 * accent, for a stat tile. Pointing at it marks the nearest point and reads it
 * out below; the card's table view has every point for keyboard and screen
 * reader users.
 */
export function Sparkline({
	label,
	points,
	domain,
	timeDomain,
	stepSeconds,
	format,
	caption,
	className,
}: SparklineProps): ReactElement {
	const [active, setActive] = useState<ServingGpuPoint | null>(null);
	const latest = points.at(-1) ?? null;
	const marked = active ?? latest;
	const dot = marked ? position(marked, domain, timeDomain) : null;

	const handlePointer = (event: PointerEvent<HTMLDivElement>): void => {
		const box = event.currentTarget.getBoundingClientRect();
		if (box.width <= 0) {
			return;
		}
		const along = Math.min(
			1,
			Math.max(0, (event.clientX - box.left) / box.width),
		);
		setActive(
			nearest(
				points,
				timeDomain[0] + along * (timeDomain[1] - timeDomain[0]),
			),
		);
	};

	return (
		<div className={cn("flex min-w-0 flex-col gap-1", className)}>
			<div
				role="img"
				aria-label={label}
				className="relative h-8 w-full touch-pan-y"
				onPointerMove={points.length > 0 ? handlePointer : undefined}
				onPointerDown={points.length > 0 ? handlePointer : undefined}
				onPointerLeave={() => setActive(null)}
			>
				{points.length > 0 ? (
					<>
						<svg
							aria-hidden="true"
							viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
							preserveAspectRatio="none"
							className="absolute inset-0 size-full overflow-visible"
						>
							<path
								d={linePath(
									points,
									domain,
									timeDomain,
									stepSeconds,
								)}
								className="fill-none stroke-muted-foreground"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
								vectorEffect="non-scaling-stroke"
							/>
						</svg>
						{/* a second layer without a viewBox, so the dot stays round at any width */}
						<svg
							aria-hidden="true"
							className="absolute inset-0 size-full overflow-visible"
						>
							{active && dot ? (
								<line
									x1={`${dot.x}%`}
									x2={`${dot.x}%`}
									y1="0"
									y2="100%"
									className="stroke-muted-foreground/50"
									strokeWidth={1}
								/>
							) : null}
							{dot ? (
								<circle
									cx={`${dot.x}%`}
									cy={`${(dot.y / HEIGHT) * 100}%`}
									r={4}
									className="fill-primary stroke-card"
									strokeWidth={2}
								/>
							) : null}
						</svg>
					</>
				) : null}
			</div>
			<p className="truncate text-muted-foreground text-xs">
				{active
					? `${format(active[1])} at ${formatPointTime(active[0])}`
					: caption}
			</p>
		</div>
	);
}
