import { useTranslation } from "@semoss/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";

export interface RoomContextChartProps {
	tokensUsed?: number;
	tokensMax?: number;
}

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
 * Renders a pie chart showing the percentage of context used.
 *
 * @component
 */
export const RoomContextChart = ({
	tokensUsed,
	tokensMax,
}: RoomContextChartProps) => {
	const { t } = useTranslation("room");

	// Calculate the percentage of context used
	const contextUsedPercent =
		tokensMax > 0 && tokensUsed !== undefined
			? (tokensUsed / tokensMax) * 100
			: undefined;

	// Only show the chart when usage is above 12.5% to avoid clutter
	if (contextUsedPercent === undefined || contextUsedPercent < 12.5)
		return null;

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
		<Tooltip>
			<TooltipTrigger asChild>
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
			</TooltipTrigger>

			<TooltipContent
				side="top"
				align="center"
				className="w-80 max-w-xs text-wrap"
			>
				<div className="w-full space-y-1">
					<p className="w-full">{t("contextWindow.description")}</p>
					<p className="flex w-full items-baseline justify-between gap-3">
						<span>{t("contextWindow.memoryUsedTitle")}</span>
						<span className="whitespace-nowrap text-right tabular-nums">
							{t("contextWindow.memoryUsedValue", {
								used: formatTokens(tokensUsed),
								total: formatTokens(tokensMax),
								percent: contextUsedPercent.toFixed(1),
							})}
						</span>
					</p>
				</div>
			</TooltipContent>
		</Tooltip>
	);
};
