import { ArrowForward, LightbulbOutlined } from "@mui/icons-material";
import { Button, Skeleton, Stack, styled, Typography } from "@semoss/ui";
import type { Agent } from "@/types";

export interface WorkspaceCardProps {
	agent: Agent | null;
	onPrimaryClick?: () => void;
	onSecondaryClick?: () => void;
}

const StyledCardItem = styled(Stack)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	borderWidth: "1px",
	borderStyle: "solid",
	borderColor: theme.palette.secondary.border,
	borderRadius: theme.shape.borderRadius,
	cursor: "pointer",
}));

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceCard = ({
	onPrimaryClick,
	onSecondaryClick,
	agent,
}: WorkspaceCardProps) => {
	/**
	 * Constants
	 */
	const isAgentValid = agent !== null;

	return (
		<StyledCardItem
			onClick={onPrimaryClick}
			padding={2}
			height="100%"
			spacing={1.5}
		>
			<Stack>
				<LightbulbOutlined />
				<Typography variant="body1">
					{isAgentValid ? (
						agent.name
					) : (
						<Skeleton width="100%" height="100%" />
					)}
				</Typography>
				<Typography variant="body2" color="textSecondary">
					{isAgentValid ? (
						agent.description
					) : (
						<Skeleton width="100%" height="100%" />
					)}
				</Typography>
			</Stack>
			<Stack justifyContent="flex-end">
				<div>
					<Button
						onClick={(e) => {
							e.stopPropagation();
							onSecondaryClick?.();
						}}
						endIcon={<ArrowForward />}
						size="small"
						variant="text"
						disabled={!isAgentValid}
					>
						View Details
					</Button>
				</div>
			</Stack>
		</StyledCardItem>
	);
};
