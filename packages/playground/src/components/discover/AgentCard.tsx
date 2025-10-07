import { ArrowForward, LightbulbOutlined } from "@mui/icons-material";
import { Button, Stack, styled, Typography } from "@semoss/ui";

export interface AgentCardProps {
	name: string;
	description: string;
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
 * Renders a card representing an agent
 *
 * @component
 */
export const AgentCard = ({
	name,
	onPrimaryClick,
	onSecondaryClick,
	description,
}: AgentCardProps) => {
	return (
		<StyledCardItem
			onClick={onPrimaryClick}
			padding={2}
			height="100%"
			spacing={1.5}
		>
			<Stack>
				<LightbulbOutlined />
				<Typography variant="body1">{name}</Typography>
				<Typography variant="body2" color="text.secondary">
					{description}
				</Typography>
			</Stack>
			<Stack justifyContent="flex-end">
				<div>
					<Button
						onClick={onSecondaryClick}
						endIcon={<ArrowForward />}
						size="small"
						variant="text"
					>
						View Details
					</Button>
				</div>
			</Stack>
		</StyledCardItem>
	);
};
