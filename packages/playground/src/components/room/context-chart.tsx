export interface ContextChartProps {
	contextUsedPercent?: number;
}

/**
 * Renders a pie chart showing the percentage of context used.
 *
 * @component
 */
export const ContextChart = ({ contextUsedPercent }: ContextChartProps) => {
	if (contextUsedPercent === undefined) return null;

	const radius = 8;
	const cx = 9;
	const cy = 9;
	const angle = (contextUsedPercent / 100) * 360;
	const radians = (angle * Math.PI) / 180;
	const x = cx + radius * Math.cos(radians - Math.PI / 2);
	const y = cy + radius * Math.sin(radians - Math.PI / 2);
	const largeArc = angle > 180 ? 1 : 0;

	return (
		<div className="flex items-center gap-2">
			<svg width={18} height={18} viewBox="0 0 18 18">
				<title>{`Context usage: ${contextUsedPercent}%`}</title>
				<circle cx={cx} cy={cy} r={radius} className="fill-muted" />
				<path
					d={`M ${cx} ${cy} L ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${x} ${y} Z`}
					className={
						contextUsedPercent > 75
							? "fill-destructive"
							: "fill-muted-foreground"
					}
				/>
			</svg>
			<span className="text-muted-foreground text-sm">
				{contextUsedPercent}%
			</span>
		</div>
	);
};
