import { ArrowRight } from "lucide-react";
import { Button } from "@semoss/ui/next";
import type { Agent } from "@/types";

export interface WorkspaceCardProps {
	agent: Agent;
	onPrimaryClick?: () => void;
	onSecondaryClick?: () => void;
}

/**
 * Renders a card representing an agent
 *
 * @component
 */
export const WorkspaceCard = ({
	onPrimaryClick,
	onSecondaryClick,
	agent,
}: WorkspaceCardProps) => {
	return (
		<button
			type="button"
			onClick={onPrimaryClick}
			className="flex w-full items-start gap-3 rounded-lg border p-3 hover:bg-accent/50"
		>
			<div className="grid flex-1 gap-1.5 font-normal">
				<p className="font-medium text-sm leading-none">{agent.name}</p>
				<p className="min-h-8 text-muted-foreground text-sm">
					{agent.description}
				</p>
				<Button
					onClick={(e) => {
						e.stopPropagation();
						onSecondaryClick?.();
					}}
					size="sm"
					variant="secondary"
				>
					View Details
					<ArrowRight />
				</Button>
			</div>
		</button>
	);
};
