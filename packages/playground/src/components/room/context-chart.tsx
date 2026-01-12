export interface ContextChartProps {
	contextUsedPercent?: number;
}

/**
 * Renders a pie chart showing the percentage of context used.
 *
 * @component
 */
export const ContextChart = ({ contextUsedPercent }: ContextChartProps) => {
	return contextUsedPercent === undefined ? null : (
		<div>{contextUsedPercent}%</div>
	);
};
