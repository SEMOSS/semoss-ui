import { ErrorOutline, LightbulbOutlined } from "@mui/icons-material";
import { Chip, Skeleton, Tooltip } from "@semoss/ui";
import type { Workspace } from "@/types";

export interface WorkspaceChipProps {
	workspace: Workspace | null;
	loading?: boolean;
}

/**
 * Renders a chip showing users which workspace configuration is being used
 *
 * @component
 */
export const WorkspaceChip = ({ workspace, loading }: WorkspaceChipProps) => {
	/**
	 * Constants
	 **/
	const isWorkspaceValid = workspace && !loading;

	return (
		<Tooltip
			title={
				loading
					? "Loading Workspace Configuration"
					: isWorkspaceValid
						? "Using Workspace Configuration"
						: "Error Loading Workspace Configuration"
			}
			placement="top"
		>
			<span>
				<Chip
					icon={
						loading || isWorkspaceValid ? (
							<LightbulbOutlined />
						) : (
							<ErrorOutline />
						)
					}
					label={
						loading ? (
							<Skeleton width="36px" height="100%" />
						) : isWorkspaceValid ? (
							workspace.name
						) : (
							"Error loading workspace"
						)
					}
				/>
			</span>
		</Tooltip>
	);
};
