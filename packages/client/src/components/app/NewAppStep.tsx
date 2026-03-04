import type React from "react";
import { useNavigate } from "react-router-dom";
import { Stack, styled, Typography } from "@semoss/ui";

const StyledTypographyHome = styled(Typography)<
	React.ComponentProps<typeof Typography> & {
		onClick?: React.MouseEventHandler<any>;
	}
>(({ theme }) => ({
	color: "#212121",
	FontFamily: "Inter",
	fontSize: "16px",
	fontWeight: 400,
	lineHeight: "24px",
	letterSpacing: "0.15px",
	fontStyle: "normal",
	display: "flex",
	alignItems: "flex-start",
	cursor: "pointer",
}));

const StyledTypographySeperator = styled(Typography)<
	React.ComponentProps<typeof Typography>
>(({ theme }) => ({
	color: "#666",
	FontFamily: "Inter",
	fontSize: "16px",
	fontWeight: 400,
	lineHeight: "24px",
	letterSpacing: "0.15px",
	fontStyle: "normal",
	display: "flex",
	alignItems: "flex-start",
}));

const StyledTypographyAgentBuilder = styled(Typography)<
	React.ComponentProps<typeof Typography>
>(({ theme }) => ({
	display: "flex",
	alignItems: "flex-start",
	color: "#9E9E9E",
	FontFamily: "Inter",
	fontSize: "16px",
	fontWeight: 400,
	lineHeight: "24px",
	letterSpacing: "0.15px",
	fontStyle: "normal",
}));

interface NewAppStepProps {
	/** Content in the step */
	children: React.ReactNode;
}

export const NewAppStep = (props: NewAppStepProps) => {
	const { children } = props;
	const navigate = useNavigate();
	return (
		<Stack>
			<Stack direction={"column"} alignItems={"flex-start"} spacing={1}>
				<Stack direction="row" spacing={1} alignItems="center">
					<StyledTypographyHome
						variant="body1"
						onClick={() => navigate("/")}
					>
						Home
					</StyledTypographyHome>
					<StyledTypographySeperator variant="body1">
						/
					</StyledTypographySeperator>
					<StyledTypographyAgentBuilder variant="body1">
						Start from prompt
					</StyledTypographyAgentBuilder>
				</Stack>
				<Typography variant={"h4"}>Agent Builder</Typography>
			</Stack>
			{children}
		</Stack>
	);
};
