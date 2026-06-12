import { BarChart3Icon } from "lucide-react";
import { observer } from "mobx-react-lite";

interface RoomStatsBarProps {
	/** Total tokens used in the chat */
	totalTokens: number;
}

/**
 * Formats a token count with K/M suffix
 */
function formatTokens(count: number): string {
	if (count >= 1_000_000) {
		return `${(count / 1_000_000).toFixed(1)}M`;
	}
	if (count >= 1_000) {
		return `${(count / 1_000).toFixed(1)}K`;
	}
	return count.toString();
}

/**
 * Stats bar displaying last message tokens and total tokens
 * Only visible on hover - positioned above the chat input box
 */
export const RoomStatsBar: React.FC<RoomStatsBarProps> = observer(
	({ totalTokens }) => {
		return (
			<div className="group relative">
				<div className="flex items-center justify-end py-1 pr-2">
					{/* Stats shown on hover - appears to the left */}
					<div className="invisible mr-2 flex items-center gap-2 text-muted-foreground text-xs opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
						<span>📊 Total: {formatTokens(totalTokens)}</span>
					</div>

					{/* Icon always visible on the right */}
					<BarChart3Icon className="size-4 text-muted-foreground" />
				</div>
			</div>
		);
	},
);
