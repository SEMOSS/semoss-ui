import { Cpu, HelpCircle } from "lucide-react";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

export interface ContextChartProps {
	tokensUsed?: number;
	tokensMax?: number;
}

/**
 * Renders a pie chart showing the percentage of context used.
 *
 * @component
 */
export const ContextChart = ({ tokensUsed, tokensMax }: ContextChartProps) => {
	// Calculate the percentage of context used
	const contextUsedPercent =
		tokensMax > 0 && tokensUsed !== undefined
			? (tokensUsed / tokensMax) * 100
			: undefined;

	// Only show the chart when usage is above 12.5% to avoid clutter
	if (contextUsedPercent === undefined || contextUsedPercent < 12.5)
		return null;

	/**
	 * Helper function to format token counts for display
	 * Converts large numbers to readable format (e.g., 1500 -> 1.5k, 2000000 -> 2.0m)
	 */
	const formatTokens = (tokens: number) => {
		if (tokens >= 1000000) {
			return `${(tokens / 1000000).toFixed(1)}M`;
		}
		if (tokens >= 1000) {
			return `${(tokens / 1000).toFixed(1)}k`;
		}
		return tokens.toString();
	};

	/**
	 * Constants
	 */
	// Round to nearest 12.5% increment for smoother visual transitions
	const roundedPercent = Math.round(contextUsedPercent / 12.5) * 12.5;

	// SVG circle calculations for the pie chart
	const radius = 8;
	const cx = 9;
	const cy = 9;
	const angle = (roundedPercent / 100) * 360;
	const radians = (angle * Math.PI) / 180;
	const x = cx + radius * Math.cos(radians - Math.PI / 2);
	const y = cy + radius * Math.sin(radians - Math.PI / 2);
	// Use large arc flag when angle exceeds 180 degrees
	const largeArc = angle > 180 ? 1 : 0;

	return (
		<HoverCard openDelay={10}>
			<HoverCardTrigger asChild>
				<div className="relative">
					<div className="flex cursor-pointer items-center gap-2">
						{/** biome-ignore lint/a11y/noSvgWithoutTitle: hover status is applied to provide description for interactive svg */}
						<svg width={18} height={18} viewBox="0 0 18 18">
							<circle
								cx={cx}
								cy={cy}
								r={radius}
								className={
									roundedPercent >= 75
										? "fill-destructive opacity-10"
										: "fill-muted"
								}
							/>
							{roundedPercent >= 100 ? (
								<circle
									cx={cx}
									cy={cy}
									r={radius}
									className={
										roundedPercent >= 75
											? "fill-destructive"
											: "fill-muted-foreground"
									}
								/>
							) : (
								<path
									d={`M ${cx} ${cy} L ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y} Z`}
									className={
										roundedPercent >= 75
											? "fill-destructive"
											: "fill-muted-foreground"
									}
								/>
							)}
						</svg>
					</div>
				</div>
			</HoverCardTrigger>

			<HoverCardContent
				side="top"
				align="center"
				className="w-70 border-gray-200 bg-white"
			>
				<div className="flex flex-col gap-2">
					{/* Header with Memory title and help icon */}
					<div className="flex items-center gap-1.5">
						<p className="font-semibold text-base text-card-foreground">
							Memory
						</p>
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className="h-3.5 w-3.5 shrink-0 cursor-help stroke-[2.5] text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent side="right" className="max-w-xs">
								<p className="text-sm">
									Memory refers to the context window
									available for your conversation. Tokens
									represent the smallest units of text that
									the AI processes. As you use tokens in your
									conversation, the available memory
									decreases.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>

					{/* Tokens usage display section */}
					<div className="flex w-full items-center justify-between font-medium text-muted-foreground text-sm">
						{/* Left side: Icon and label */}
						<div className="flex items-center gap-1.5">
							<Cpu className="h-5 w-5" />
							<p>Tokens used</p>
						</div>
						{/* Right side: Token count (used / max) */}
						<p>
							{formatTokens(tokensUsed)}
							{" / "}
							{formatTokens(tokensMax)}
						</p>
					</div>
				</div>
			</HoverCardContent>
		</HoverCard>
	);
};
