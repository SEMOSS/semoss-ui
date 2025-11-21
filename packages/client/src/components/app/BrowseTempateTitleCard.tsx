import React from "react";
import {
	Card,
	type CardProps,
	IconButton,
	Link,
	styled,
	Typography,
} from "@semoss/ui";
import Agent_Builder from "@/assets/img/Agent_Builder.svg";
import AgentBuilderImage from "@/assets/img/AgentBuilder.png";
import DragAndDrop from "@/assets/img/DragAndDrop.svg";
import DragAndDropImage from "@/assets/img/DragDrop.png";
import Pro_Code from "@/assets/img/Pro_Code.svg";
import ProCodeImage from "@/assets/img/ProCode.png";
import { removeUnderscores } from "@/utility";
import type { AppMetadata } from "./app.types";

const StyledName = styled(Typography)(({ theme }) => ({
	fontWeight: 400,
	color: theme.palette.text.primary,
	fontFamily: "Inter",
	fontSize: theme.typography.body2.fontSize,
	fontStyle: "normal",
	lineHeight: "143%",
	letterSpacing: "0.17px",
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
}));

const StyledProjectType = styled("div")(({ theme }) => ({
	color: theme.palette.text.disabled,
	fontFamily: "Inter",
	fontWeight: "400",
	lineHeight: "19.92px",
	letterSpacing: "0.4px",
	fontStyle: "normal",
	fontSize: theme.typography.body3.fontSize,
}));

const StyledTileCard = styled(
	React.forwardRef<HTMLDivElement, CardProps & { disabled: boolean }>(
		({ disabled, ...props }, ref) => (
			<div ref={ref}>
				<Card {...props} />
			</div>
		),
	),
)<{ disabled: boolean }>(({ disabled, theme }) => ({
	height: "269px",
	width: "307px",
	"&:hover": {
		cursor: disabled ? "default" : "pointer",
	},
	borderRadius: theme.shape.borderRadius,
}));

const StyledTileCardMedia = styled(Card.Media)(({ theme }) => ({
	display: "flex",
	alignItems: "flex-start",
	gap: theme.spacing(1.25),
	alignSelf: "stretch",
	overflowClipMargin: "content-box",
	overflow: "clip",
	objectFit: "cover",
	width: "283px",
	height: "123px",
}));
const StyledCardDescription = styled(Typography)(({ theme }) => ({
	margin: 0,
	fontSize: theme.typography.body3.fontSize,
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "19.92px",
	letterSpacing: "0.4px",
	fontFamily: "Roboto",
	display: "-webkit-box",
	WebkitLineClamp: 2,
	WebkitBoxOrient: "vertical",
	overflow: "hidden",
	textOverflow: "ellipsis",
	wordWrap: "break-word",
	color: theme.palette.text.secondary,
	height: "40px",
}));

const StyledCardHeader = styled(Card.Header)({
	"&.MuiCardHeader-root": {
		padding: 0,
		margin: 0,
		height: "20px",
	},
	".MuiCardHeader-title": {
		width: "250px",
	},
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	alignSelf: "stretch",
});

const ButtonName = styled("p")(({ theme }) => ({
	fontSize: "13px",
	color: theme.palette.secondary.light,
	fontFamily: "Inter",
	fontStyle: "normal",
	fontWeight: "500",
	lineHeight: "22px",
	letterSpacing: "0.46px",
}));

const StyledCardContent = styled(Card.Content)({
	"&.MuiCardContent-root": {
		padding: 0,
		margin: 0,
		gap: 0,
	},
});

const StyledCardActions = styled(Card.Actions)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	alignSelf: "stretch",
	"&.MuiCardActions-root": {
		padding: "0px",
		position: "relative",
	},
	height: "30px",
	width: "284px",
	gap: theme.spacing(5),
}));

const StyledCardActionsWrapper = styled("div")({
	display: "flex",
});

const StyledCardActionsOuterContainer = styled("div")(({ theme }) => ({
	width: "161px",
	height: "30px",
	display: "flex",
	alignItems: "flex-start",
	borderRadius: theme.spacing(0.5),
}));

const StyledCardActionsImageAndTextContainer = styled("div")(({ theme }) => ({
	display: "flex",
	height: "30px",
	padding: theme.spacing(0.5, 0.625),
	gap: theme.spacing(1),
}));

const StyledCardActionsImageContainer = styled("div")({
	display: "flex",
	alignItems: "center",
	height: "18px",
	flexDirection: "column",
	position: "relative",
	top: "2px",
});

const StyledOpenButton = styled(IconButton)({
	display: "flex",
	alignItems: "center",
	"&.MuiIconButton-root": {
		padding: 0,
	},
});

const StyledActionImage = styled("img")({
	width: "16px",
	height: "16px",
});

const StyledMainDiv = styled("div")({
	width: "307px",
	height: "292px",
});

const StyledContent = styled("div")(({ theme }) => ({
	display: "flex",
	padding: theme.spacing(1, 2),
	flexDirection: "column",
	gap: theme.spacing(1),
	alignItems: "flex-start",
	height: "80px",
}));

const StyledFooterDiv = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	height: "30px",
	width: "123px",
	gap: theme.spacing(1),
	justifyContent: "center",
	// flex: '1 0 0',
	borderRadius: "12px",
	background: theme.palette.primary.main,
}));

const StyledParentImageDiv = styled("div", {
	shouldForwardProp: (prop) => prop !== "projectType",
})<{ projectType: string }>(({ theme, projectType }) => ({
	display: "flex",

	padding: theme.spacing(2, 2.098, 0, 2),

	justifyContent: "center",
	alignItems: "center",
	alignSelf: "stretch",
	height: "138px",
	width: "100%",
	background:
		projectType === "BLOCKS"
			? theme.palette.purple["200"]
			: projectType === "CODE"
				? theme.palette.lightGreen["200"]
				: theme.palette.primaryContrast["200"],
}));

const StyledCardContentDiv = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(1),
	alignself: "stretch",
}));

const StyledFooter1Div = styled("div")(({ theme }) => ({
	display: "flex",
	padding: theme.spacing(1, 2),
	alignItems: "center",
	gap: theme.spacing(5),
	alignSelf: "stretch",
	borderTop: `1px solid var(--Secondary-Divider, ${theme.palette.secondary.divider})`,
	background: theme.palette.background.paper,
	height: "30px",
	width: "100%",
}));

interface BrowseTemplateTileCardProps {
	/**
	 * App
	 */
	app: AppMetadata;

	/**
	 * Action that is triggered when clicked
	 * aop - current selected app
	 */
	onAction?: () => void;

	/**
	 * Link to navigate to
	 */
	href?: string;
}

export const BrowseTemplateTileCard = (props: BrowseTemplateTileCardProps) => {
	const { app, onAction = () => null, href = null } = props;

	return (
		<StyledMainDiv>
			<StyledTileCard disabled>
				<Link
					href={href}
					rel="noopener noreferrer"
					color="inherit"
					underline="none"
				>
					<StyledParentImageDiv projectType={app.project_type}>
						<StyledTileCardMedia
							src="img"
							image={
								app.project_type === "BLOCKS"
									? DragAndDropImage
									: app.project_type === "CODE"
										? ProCodeImage
										: AgentBuilderImage
							}
						/>
					</StyledParentImageDiv>
					<StyledContent>
						<StyledCardContentDiv>
							<StyledCardHeader
								title={
									<StyledName
										variant={"body2"}
										title={app.project_name}
									>
										{removeUnderscores(app.project_name)}
									</StyledName>
								}
							/>
							<StyledCardContent>
								<StyledCardDescription
									variant={"caption"}
									title={app.description}
								>
									{app.description
										? app.description
										: "No description available"}
								</StyledCardDescription>
							</StyledCardContent>
						</StyledCardContentDiv>
					</StyledContent>
					<StyledFooter1Div>
						<StyledCardActions>
							<StyledCardActionsWrapper>
								<StyledCardActionsOuterContainer>
									<StyledCardActionsImageAndTextContainer>
										<StyledCardActionsImageContainer>
											<StyledActionImage
												src={
													app.project_type ===
													"BLOCKS"
														? DragAndDrop
														: app.project_type ===
																"CODE"
															? Pro_Code
															: Agent_Builder
												}
												alt={
													app.project_type ===
													"BLOCKS"
														? "Drag and Drop"
														: app.project_type ===
																"CODE"
															? "Pro Code"
															: "Agent Builder"
												}
											/>
										</StyledCardActionsImageContainer>
										<StyledProjectType>
											{app.project_type === "BLOCKS"
												? "Drag and Drop"
												: app.project_type === "CODE"
													? "Pro Code"
													: "Agent Builder"}
										</StyledProjectType>
									</StyledCardActionsImageAndTextContainer>
								</StyledCardActionsOuterContainer>
								<StyledOpenButton onClick={onAction}>
									<StyledFooterDiv>
										<ButtonName>Use Template</ButtonName>
									</StyledFooterDiv>
								</StyledOpenButton>
							</StyledCardActionsWrapper>
						</StyledCardActions>
					</StyledFooter1Div>
				</Link>
			</StyledTileCard>
		</StyledMainDiv>
	);
};
