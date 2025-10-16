import { ErrorOutline, LightbulbOutlined } from "@mui/icons-material";
import { Chip, Skeleton, Tooltip } from "@semoss/ui";
import type { Agent } from "@/types";

export interface WorkspaceChipProps {
	agent: Agent | null;
	loading?: boolean;
}

/**
 * Renders a chip showing users which agent configuration is being used
 *
 * @component
 */
export const WorkspaceChip = ({ agent, loading }: WorkspaceChipProps) => {
	/**
	 * Constants
	 **/
	const isAgentValid = agent && !loading;

	return (
		<Tooltip
			title={
				loading
					? "Loading Agent Configuration"
					: isAgentValid
						? "Using Agent Configuration"
						: "Error Loading Agent Configuration"
			}
			placement="top"
		>
			<span>
				<Chip
					icon={
						loading || isAgentValid ? (
							<LightbulbOutlined />
						) : (
							<ErrorOutline />
						)
					}
					label={
						loading ? (
							<Skeleton width="36px" height="100%" />
						) : isAgentValid ? (
							agent.name
						) : (
							"Error loading agent"
						)
					}
				/>
			</span>
		</Tooltip>
	);
};
