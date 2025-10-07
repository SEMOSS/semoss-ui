import { Tooltip } from "@semoss/ui";
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
	return (
		<Tooltip
			title={
				loading
					? "Loading Agent Configuration"
					: agent
						? "Error Loading Agent Configuration"
						: "Using Agent Configuration"
			}
			placement="top"
		>
			<div>TODO</div>
		</Tooltip>
	);
};
