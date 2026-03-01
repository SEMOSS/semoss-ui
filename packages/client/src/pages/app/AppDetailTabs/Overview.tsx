import { Box, styled, Typography } from "@semoss/ui";

const StyledBox = styled(Box)(({ theme }) => ({
	padding: theme.spacing(3),
	width: "100%",
}));

// Text
const StyledDescription = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.disabled,
	fontSize: "16px",
}));

const StyledPlaceholderBox = styled(Box)(({ theme }) => ({
	border: `1px solid ${theme.palette.secondary.main}`,
	borderRadius: 2,
	padding: theme.spacing(4),
	textAlign: "center",
}));

interface OverviewProps {
	appInfo: {
		markdown?: string;
	};
}

export const Overview = ({ appInfo }: OverviewProps) => {
	return (
		<StyledBox>
			<Typography variant="h6" gutterBottom>
				Details
			</Typography>
			{appInfo?.markdown ? (
				<StyledDescription variant="body2">
					{appInfo?.markdown}
				</StyledDescription>
			) : (
				<StyledPlaceholderBox>
					<Typography variant="body1" color="text.secondary">
						No markdown available
					</Typography>
				</StyledPlaceholderBox>
			)}
		</StyledBox>
	);
};
