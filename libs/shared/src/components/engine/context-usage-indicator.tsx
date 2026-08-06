import type React from "react";
import { useRef, useState } from "react";
import { cn, Popover, PopoverContent, PopoverTrigger } from "@semoss/ui/next";

interface ContextUsageIndicatorProps {
	/** CSS classes for styling customization */
	className?: string;

	/** Current token usage for context window indicator */
	tokensUsed?: number;

	/** Maximum token capacity for context window */
	tokensMax?: number;

	/** Optional tooltip content to show when hovering the context indicator */
	tooltipContent?: React.ReactNode;
}

/**
 * ContextUsageIndicator - A small donut chart showing context window usage as a percentage
 *
 * Hovering (or the tooltip content itself) keeps the popover open via a short
 * close delay, so the mouse can travel from the donut into the tooltip.
 */
export const ContextUsageIndicator = ({
	className,
	tokensUsed,
	tokensMax,
	tooltipContent,
}: ContextUsageIndicatorProps) => {
	const [open, setOpen] = useState(false);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isHovering = useRef(false);

	const handleOpen = () => {
		isHovering.current = true;
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setOpen(true);
	};

	const scheduleClose = () => {
		isHovering.current = false;
		closeTimer.current = setTimeout(() => setOpen(false), 150);
	};

	const usedPercent =
		tokensMax && tokensUsed !== undefined
			? (tokensUsed / tokensMax) * 100
			: undefined;

	if (usedPercent === undefined || usedPercent <= 0) {
		return null;
	}

	// Calculate donut chart geometry, rounded to the nearest 12.5% increment
	const roundedPercent = Math.max(
		12.5,
		Math.round(usedPercent / 12.5) * 12.5,
	);
	const radius = 8;
	const cx = 9;
	const cy = 9;
	const angle = (roundedPercent / 100) * 360;
	const radians = (angle * Math.PI) / 180;
	const x = cx + radius * Math.cos(radians - Math.PI / 2);
	const y = cy + radius * Math.sin(radians - Math.PI / 2);
	const largeArc = angle > 180 ? 1 : 0;

	return (
		<Popover
			open={open}
			onOpenChange={(o) => {
				if (!o && isHovering.current) return;
				setOpen(o);
			}}
		>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"flex shrink-0 cursor-pointer items-center",
						className,
					)}
					onClick={(e) => e.stopPropagation()}
					onMouseEnter={handleOpen}
					onMouseLeave={scheduleClose}
				>
					{/** biome-ignore lint/a11y/noSvgWithoutTitle: click interaction is provided by the parent button */}
					<svg width={18} height={18} viewBox="0 0 18 18">
						{/* Outer ring - always visible */}
						<circle
							cx={cx}
							cy={cy}
							r={radius}
							fill="none"
							className={
								roundedPercent >= 75
									? "stroke-destructive"
									: "stroke-muted-foreground"
							}
							strokeWidth={1.5}
							opacity={0.3}
						/>
						{/* Inner fill showing percentage */}
						{roundedPercent >= 100 ? (
							<circle
								cx={cx}
								cy={cy}
								r={radius - 1}
								className={
									roundedPercent >= 75
										? "fill-destructive"
										: "fill-muted-foreground"
								}
								opacity={0.6}
							/>
						) : (
							<path
								d={`M ${cx} ${cy} L ${cx} ${cy - (radius - 1)} A ${radius - 1} ${radius - 1} 0 ${largeArc} 1 ${x * 0.875 + cx * 0.125} ${y * 0.875 + cy * 0.125} Z`}
								className={
									roundedPercent >= 75
										? "fill-destructive"
										: "fill-muted-foreground"
								}
								opacity={0.6}
							/>
						)}
					</svg>
				</button>
			</PopoverTrigger>
			{tooltipContent && (
				<PopoverContent
					side="top"
					className="w-[24rem] text-wrap text-sm"
					onMouseEnter={handleOpen}
					onMouseLeave={scheduleClose}
					onClick={(e) => e.stopPropagation()}
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					{tooltipContent}
				</PopoverContent>
			)}
		</Popover>
	);
};
