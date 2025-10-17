import { AlertCircle, Lightbulb } from "lucide-react";
import {
	Badge,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Agent } from "@/types";

export interface AgentChipProps {
	agent: Agent | null;
	loading?: boolean;
}

/**
 * Renders a chip showing users which agent configuration is being used
 *
 * @component
 */
export const AgentChip = ({ agent, loading }: AgentChipProps) => {
	/**
	 * Constants
	 **/
	const isAgentValid = agent && !loading;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Badge
					variant={
						loading || isAgentValid ? "secondary" : "destructive"
					}
					className="flex items-center gap-1"
				>
					{loading || isAgentValid ? (
						<Lightbulb className="h-3 w-3" />
					) : (
						<AlertCircle className="h-3 w-3" />
					)}
					{loading ? (
						<Skeleton className="h-4 w-9" />
					) : isAgentValid ? (
						agent.name
					) : (
						"Error loading agent"
					)}
				</Badge>
			</TooltipTrigger>
			<TooltipContent>
				{loading
					? "Loading Agent Configuration"
					: isAgentValid
						? "Using Agent Configuration"
						: "Error Loading Agent Configuration"}
			</TooltipContent>
		</Tooltip>
	);
};
