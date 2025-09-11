import { styled, Typography } from "@semoss/ui";

const StyledTitle = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	width: "100%",
	alignItems: "center",
	paddingTop: "8px",
	paddingRight: "16px",
	paddingBottom: "8px",
	paddingLeft: "1px",
}));

const StyledTitleInner = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	justifyContent: "space-between",
	width: "100%",
	alignItems: "center",
	borderLeft: `3px solid ${theme.palette.primary.main}`,
	paddingLeft: "12px",
	overflow: "hidden",
}));

interface RightMenuTitleProps {
	/** Header in the menu */
	name: React.ReactNode;

	/** Content */
	actions?: React.ReactNode;
}

export const RightMenuTitle: React.FC<RightMenuTitleProps> = ({
	name,
	actions,
}) => {
	return (
		<StyledTitle>
			<StyledTitleInner>
				<Typography variant="body1">{name}</Typography>
				{actions}
			</StyledTitleInner>
		</StyledTitle>
	);
};
