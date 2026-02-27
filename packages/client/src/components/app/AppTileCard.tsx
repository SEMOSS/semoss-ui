import {
	AccessTime,
	BarChartRounded,
	Bookmark,
	BookmarkBorder,
	CodeRounded,
	DashboardRounded,
	MoreVert,
	OpenInNewOutlined,
} from "@mui/icons-material";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Card,
	type CardProps,
	Chip,
	IconButton,
	Link,
	Menu,
	Skeleton,
	Stack,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import ImageSkeleton from "@/assets/img/Image_Skeleton.svg";
import { AppDeleteModal } from "@/components/app";
import { AddAppCloneModal } from "@/components/app/save-app/AddAppCloneModal";
import { formatToDataTestId, removeUnderscores } from "@/utility";
import type { AppMetadata } from "./app.types";

const StyledTileCard = styled(
	React.forwardRef<HTMLDivElement, CardProps & { disabled: boolean }>(
		({ disabled, ...props }, ref) => (
			<div ref={ref}>
				<Card {...props} />
			</div>
		),
	),
)<{ disabled: boolean }>(({ disabled, theme }) => ({
	minHeight: "247px",
	"&:hover": {
		cursor: disabled ? "default" : "pointer",
		boxShadow: "none",
	},
	borderRadius: theme.shape.borderRadius,
}));

const StyledContainer = styled("div")({
	position: "relative",
});

const StyledOverlayContent = styled("div")(({ theme }) => ({
	position: "absolute",
	top: 0,
	right: 0,
	display: "flex",
	justifyContent: "flex-end",
	paddingTop: theme.spacing(2),
	paddingRight: theme.spacing(2),
}));

const StyledPublishedByContainer = styled("div")(({ theme }) => ({
	display: "flex",
	justifyContent: "flex-start",
	alignItems: "center",
	gap: theme.spacing(0.5),
	alignSelf: "stretch",
	color: theme.palette.text.secondary,
	height: "24px",
}));

const StyledPublishedByLabel = styled(Typography)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	flex: "1 0 0",
	fontSize: "12px",
	color: theme.palette.text.disabled,
	fontFamily: "Roboto",
	fontStyle: "normal",
	fontWeight: "400",
	letterSpacing: "0.4px",
}));

const StyledAccessTimeIcon = styled(AccessTime)(({ theme }) => ({
	"&.MuiSvgIcon-root": {
		color: theme.palette.text.disabled,
		height: "16px",
		width: "16px",
	},
}));

const StyledCardDescription = styled(Typography)(({ theme }) => ({
	margin: 0,
	fontSize: "12px",
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
	},
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	alignSelf: "stretch",
});

const ButtonName = styled("p")(({ theme }) => ({
	fontSize: "13px",
	color: theme.palette.primary.main,
	fontFamily: "Inter",
	fontStyle: "normal",
	fontWeight: "500",
	lineHeight: "22px",
	letterSpacing: "0.46px",
}));

const ViewDetailsButtonName = styled("p")(({ theme }) => ({
	fontSize: "13px",
	color: theme.palette.primary.main,
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
		// gap: '0px',//default spacing is 8px
	},
});

const StyledTagChip = styled(Chip, {
	shouldForwardProp: (prop) => prop !== "maxWidth",
})<{ maxWidth?: string }>(({ maxWidth = "200px" }) => ({
	maxWidth: maxWidth,
	textOverflow: "ellipsis",
	height: "24px",
}));

const StyledCardActions = styled(Card.Actions)({
	display: "flex",
	padding: "0px 8px 0px 11px",
	alignItems: "center",
	justifyContent: "space-between",
	alignSelf: "stretch",
	"&.MuiCardActions-root": {
		padding: 0,
		position: "relative",
		gap: 0,
	},
});

const StyledIconButton = styled(IconButton)(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
	height: "28px",
	width: "28px",
	borderRadius: "24px",
	zIndex: 1,
	"&.MuiButtonBase-root :hover": {
		backgroundColor: theme.palette.background.paper,
		borderRadius: "24px",
		$icon: {
			color: "red",
		},
	},
}));

const StyledOpenButton = styled(IconButton)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	"&.MuiIconButton-root": {
		padding: 0,
	},
	"&.MuiIconButton-root :hover": {
		backgroundColor: theme.palette.primary.hover,
	},
}));

const StyledPlaceholder = styled("div")({
	height: "20px",
});

const StyledMainDiv = styled("div")({
	width: "322px",
	minHeight: "307px",
});

const StyledSkeletonImage = styled("div")(({ theme }) => ({
	borderRadius: "4px",
	backgroundColor: theme.palette.grey[500],
	position: "relative",
	overflow: "hidden",
	display: "flex",
}));

const StyledSkeletonContent = styled("div")(({ theme }) => ({
	display: "flex",
	padding: theme.spacing(1, 2),
	flexDirection: "column",
	gap: theme.spacing(1),
	alignItems: "flex-start",
}));

const StyledSkeletonChip = styled("div")({
	display: "flex",
	flexDirection: "row",
});

const StyledSkeletonDate = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(0.5),
	flexDirection: "row",
}));

const StyledSkeletonFooter = styled("div")({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	width: "100%",
});

const StyledContent = styled("div")(({ theme }) => ({
	display: "flex",
	padding: theme.spacing(1, 2),
	flexDirection: "column",
	gap: theme.spacing(1),
	alignItems: "flex-start",
	borderTopLeftRadius: theme.shape.borderRadius,
	borderTopRightRadius: theme.shape.borderRadius,
	position: "relative",
}));

const StyledFooter = styled("div")({
	display: "flex",
	alignItems: "center",
});

const StyledFooterDiv = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	height: "30px",
	width: "123px",
	gap: theme.spacing(1),
	justifyContent: "center",
	flex: "1 0 0",
	borderRadius: "12px",
	background: theme.palette.background.paper,
	border: `1px solid ${theme.palette.primary.main}`,
}));

const ViewDetailsButton = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	height: "30px",
	width: "123px",
	gap: theme.spacing(1),
	justifyContent: "center",
	flex: "1 0 0",
	borderRadius: "12px",
	background: theme.palette.background.paper,
}));

const StyledCardContentSection = styled("div")(({ theme }) => ({
	height: "8px",
	backgroundColor: theme.palette.background.paper,
	position: "absolute",
	borderTopLeftRadius: "50px",
	borderTopRightRadius: "50px",
	width: "100%",
	top: "70px",
	border: "1px solid transparent",
}));

const SkeletonMain = styled(Skeleton)(({ theme }) => ({
	backgroundImage: `url(${ImageSkeleton})`,
	backgroundRepeat: "no-repeat",
	backgroundPosition: "center",
	backgroundSize: "contain",
	position: "relative",
	top: theme.spacing(0.625), // 5px
	"&.MuiSkeleton-root": {
		backgroundColor: theme.palette.secondary.light,
	},
}));

const SkeletonIcon = styled(Skeleton)(({ theme }) => ({
	borderRadius: theme.shape.borderRadius, // 8px (assuming theme default is 8)
	background: `linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, ${theme.palette.grey[600]} 50%)`,
	position: "absolute",
	top: theme.spacing(1), // 8px
	right: theme.spacing(2), // 16px
}));

const SkeletonDefault = styled(Skeleton)(({ theme }) => ({
	borderRadius: "17.5px",
	background: `linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, ${theme.palette.grey[600]} 50%)`,
}));

const SkeletonMoreVertIcon = styled(Skeleton)(({ theme }) => ({
	borderRadius: "8px",
	background: `linear-gradient(270deg, rgba(219, 219, 219, 0.30) 0%, ${theme.palette.grey[600]} 50%)`,
}));

const OpenInNewOutlinedIcon = styled(OpenInNewOutlined)(({ theme }) => ({
	background: theme.palette.background.paper,
	color: theme.palette.primary.main,
}));

const StyledMenu = styled(Menu)(({ theme }) => ({
	".MuiPopover-paper": {
		display: "flex",
		alignItems: "center",
		borderRadius: 4,
		background: theme.palette.background.paper,
		boxShadow: "0px 5px 24px 0px rgba(0, 0, 0, 0.32)",
	},
}));

interface AppTileCardProps {
	/**
	 * App
	 */
	app: AppMetadata;

	/**
	 * Background
	 */
	background?: string;

	/**
	 * Action that is triggered when clicked
	 * aop - current selected app
	 */
	onAction?: () => void;

	/**
	 * Link to navigate to
	 */
	href?: string;

	/**
	 * is app favorited
	 */
	isFavorite?: boolean;

	/**
	 * toggle favorite bookmark
	 */
	favorite?: (value: boolean) => void;

	/**
	 * type of app to match image
	 */
	appType?: string;

	/**
	 * is the app a default system app
	 */
	systemApp?: boolean;

	/**
	 * Show bookmark
	 */
	isDiscoverable?: boolean;

	/**
	 * Action triggered when deleted
	 */
	onDelete?: () => void;

	/**
	 * Whether the card is loading (shows skeleton)
	 */
	isLoading?: boolean;
	/**
	 * Whether to show the skeleton loader
	 */
	showSkeleton?: boolean;
}

export const AppTileCard = (props: AppTileCardProps) => {
	const {
		app,
		onAction = () => null,
		href = null,
		isFavorite,
		favorite,
		appType,
		systemApp,
		isDiscoverable = false,
		onDelete,
		isLoading,
		showSkeleton,
	} = props;

	const notification = useNotification();
	const navigate = useNavigate();

	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [isAppDeleteModalOpen, setIsAppDeleteModalOpen] = useState(false);
	const [loading, setLoading] = useState(true); // Add loading state

	const open = Boolean(anchorEl);
	const navigateApp = (appId: string) => {
		if (!appId) {
			return;
		}

		navigate(`/app/${appId}`);
	};
	const copyProjectId = (projectId: string) => {
		try {
			navigator.clipboard.writeText(projectId);

			notification.add({
				color: "success",
				message: "Successfully copied to clipboard",
			});
		} catch (e) {
			notification.add({
				color: "error",
				message: e.message,
			});
		}
	};

	useEffect(() => {
		if (isLoading) {
			setLoading(true);
		} else {
			setLoading(false);
		}
	}, [isLoading]);

	const tags = app.tag
		? (Array.isArray(app.tag) ? app.tag : [app.tag]).filter(Boolean)
		: [];

	// --- Gradient avatar logic (from ModelTileCard) ---
	function hashString(str: string): number {
		let h = 0;
		for (let i = 0; i < str.length; i++) {
			h = (h << 5) - h + str.charCodeAt(i);
			h |= 0;
		}
		return Math.abs(h);
	}

	function pickGradient(name: string): string {
		// Subtle pastel gradient derived from hash: lower saturation + higher lightness.
		const base = hashString(name) % 360;
		const hue2 = (base + 35) % 360;
		const hue3 = (base + 70) % 360;
		return `linear-gradient(135deg, hsl(${base} 45% 88%), hsl(${hue2} 40% 84%), hsl(${hue3} 35% 80%))`;
	}

	function buildInitials(label: string): string {
		const tokens = label.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 0);
		const chars = tokens.map((t) => t[0]);
		return chars.slice(0, 3).join("");
	}

	const StyledAppAvatar = styled("div")<{ gradientBg: string }>(
		({ gradientBg }) => ({
			display: "flex",
			height: "77px",
			width: "100%",
			alignItems: "center",
			justifyContent: "center",
			fontWeight: 600,
			fontSize: "32px",
			color: "#fff",
			borderRadius: "4px",
			textTransform: "uppercase",
			background: gradientBg,
			boxShadow:
				"0 0 0 1px rgba(0,0,0,0.08) inset, 0 2px 4px -1px rgba(0,0,0,0.12)",
			transition: "filter 0.25s ease",
			userSelect: "none",
			WebkitFontSmoothing: "antialiased",
		}),
	);

	// pretty format the data
	const createdDate = useMemo(() => {
		const d = dayjs(app.project_date_created);
		if (!d.isValid()) {
			return null;
		}

		return `Published ${d.format("MMMM D, YYYY")}`;
	}, [app.project_date_created]);
	const lastEditedDate = useMemo(() => {
		const d = dayjs(app.project_date_last_edited);
		if (!d.isValid()) {
			return null;
		}

		return `Last Edited ${d.format("MMMM D, YYYY")}`;
	}, [app.project_date_last_edited]);

	/**
	 * @name findAppImage
	 * @params appType
	 * @returns image
	 */

	/**
	 * @name findAppDetails
	 * @params appType
	 * @returns set app type description
	 */
	const findAppDetails = (appType: string) => {
		if (appType === "BLOCKS") {
			return (
				<StyledPublishedByContainer>
					<DashboardRounded />
					<StyledPublishedByLabel variant="body2">
						Drag & Drop App
					</StyledPublishedByLabel>
				</StyledPublishedByContainer>
			);
		} else if (appType === "CODE") {
			return (
				<StyledPublishedByContainer>
					<CodeRounded />
					<StyledPublishedByLabel variant="body2">
						Code App
					</StyledPublishedByLabel>
				</StyledPublishedByContainer>
			);
		} else if (appType === "INSIGHTS") {
			return (
				<StyledPublishedByContainer>
					<BarChartRounded />
					<StyledPublishedByLabel variant="body2">
						Insight App
					</StyledPublishedByLabel>
				</StyledPublishedByContainer>
			);
		} else {
			//if no app_type is defined default to Code App
			return (
				<StyledPublishedByContainer>
					<CodeRounded />
					<StyledPublishedByLabel variant="body2">
						Code App
					</StyledPublishedByLabel>
				</StyledPublishedByContainer>
			);
		}
	};

	const appDetails = findAppDetails(appType);

	// Show skeleton when image is loading or when showSkeleton is true
	if ((loading && isLoading) || showSkeleton) {
		return (
			<StyledMainDiv>
				<StyledTileCard disabled>
					{/* Skeleton for the favorite icon */}
					<StyledContainer>
						<StyledOverlayContent></StyledOverlayContent>
					</StyledContainer>

					{/* Skeleton for the image */}
					<StyledSkeletonImage>
						<SkeletonMain
							variant="rectangular"
							width="100%"
							height="77px"
						/>
						<SkeletonIcon
							variant="rectangular"
							width="28px"
							height="28px"
						/>
					</StyledSkeletonImage>

					<StyledSkeletonContent>
						{/* Skeleton for the header name */}
						<SkeletonDefault
							variant="rectangular"
							width="60%"
							height="20px"
						/>

						{/* Skeleton for the description */}
						<SkeletonDefault
							variant="rectangular"
							width="80%"
							height="12px"
						/>
						<SkeletonDefault
							variant="rectangular"
							width="40%"
							height="12px"
						/>

						{/* Skeleton for the chips */}
						<StyledSkeletonChip>
							<SkeletonDefault
								variant="rectangular"
								width="75px"
								height="24px"
							/>
							<SkeletonDefault
								variant="rectangular"
								width="75px"
								height="24px"
							/>
							<SkeletonDefault
								variant="rectangular"
								width="75px"
								height="24px"
							/>
						</StyledSkeletonChip>

						{/* Skeleton for the created date */}
						<StyledSkeletonDate>
							<SkeletonDefault
								variant="rectangular"
								width="16px"
								height="16px"
							/>
							<SkeletonDefault
								variant="rectangular"
								width="120px"
								height="16px"
							/>
						</StyledSkeletonDate>

						{/* Skeleton for the actions */}
						<StyledSkeletonFooter>
							{/* Skeleton for the Open App button */}

							<SkeletonDefault
								variant="rectangular"
								width="123px"
								height="30px"
							/>
							<SkeletonDefault
								variant="rectangular"
								width="123px"
								height="30px"
							/>

							{/* Skeleton for the MoreVert icon */}

							<SkeletonMoreVertIcon
								variant="rectangular"
								width="28px"
								height="28px"
							/>
						</StyledSkeletonFooter>
					</StyledSkeletonContent>
				</StyledTileCard>
			</StyledMainDiv>
		);
	}

	return (
		<StyledMainDiv>
			<StyledTileCard
				disabled={!href}
				style={{ position: "relative" }}
				data-testid={formatToDataTestId(
					`appTileCard-${app.project_name}-tile`,
				)}
			>
				{!systemApp && !isDiscoverable && (
					<StyledContainer>
						<StyledOverlayContent>
							<StyledIconButton
								size={"small"}
								title={
									isFavorite
										? `Unbookmark ${app.project_name ? app.project_name : ""}`
										: `Bookmark ${app.project_name ? app.project_name : ""}`
								}
								onClick={(e) => {
									e.stopPropagation();
									favorite(isFavorite);
								}}
							>
								{isFavorite ? (
									<Bookmark color="primary" />
								) : (
									<BookmarkBorder />
								)}
							</StyledIconButton>
						</StyledOverlayContent>
					</StyledContainer>
				)}
				<Link
					href={href}
					rel="noopener noreferrer"
					color="inherit"
					underline="none"
				>
					{loading && isLoading ? (
						// Show skeleton for image when loading
						<StyledSkeletonImage>
							<SkeletonMain
								variant="rectangular"
								width="100%"
								height="77px"
							/>
						</StyledSkeletonImage>
					) : (
						<StyledAppAvatar
							gradientBg={pickGradient(
								app.project_name || appType || "App",
							)}
						>
							{buildInitials(
								app.project_name || appType || "App",
							)}
						</StyledAppAvatar>
					)}
					<StyledCardContentSection>&nbsp;</StyledCardContentSection>
					<StyledContent>
						<StyledCardHeader
							title={
								<div
									title={removeUnderscores(app?.project_name)}
									className="truncate text-ellipsis font-normal text-[14px] leading-[143%]"
								>
									{removeUnderscores(app?.project_name)}
								</div>
							}
						/>

						<StyledCardContent>
							<StyledCardDescription variant={"caption"}>
								{app.description
									? app.description
									: "No description available"}
							</StyledCardDescription>
							<Stack
								direction="row"
								alignItems="center"
								spacing={0.5}
								height={"24px"}
							>
								{tags.length > 0 && (
									<>
										{tags.slice(0, 3).map((tag, i) => (
											<StyledTagChip
												key={`${app.project_id}${i}`}
												maxWidth={
													tags.length === 2
														? "100px"
														: tags.length === 1
															? "200px"
															: "75px"
												}
												label={tag}
											/>
										))}
										{tags.length > 3 && (
											<Typography variant="caption">
												+{tags.length - 3}
											</Typography>
										)}
									</>
								)}
							</Stack>
							{createdDate && (
								<StyledPublishedByContainer>
									<StyledAccessTimeIcon />
									<StyledPublishedByLabel variant={"body2"}>
										{createdDate}
									</StyledPublishedByLabel>
								</StyledPublishedByContainer>
							)}
							{lastEditedDate && (
								<StyledPublishedByContainer>
									<StyledAccessTimeIcon />
									<StyledPublishedByLabel variant={"body2"}>
										{lastEditedDate}
									</StyledPublishedByLabel>
								</StyledPublishedByContainer>
							)}
							{systemApp && !appDetails && <StyledPlaceholder />}
						</StyledCardContent>
						<StyledCardActions>
							{!href ? (
								<StyledFooter>
									<StyledOpenButton
										onClick={onAction}
										size="small"
									>
										<StyledFooterDiv>
											<ButtonName>Open App</ButtonName>
											<OpenInNewOutlinedIcon fontSize="small" />
										</StyledFooterDiv>
									</StyledOpenButton>
								</StyledFooter>
							) : (
								<StyledFooter>
									<StyledOpenButton
										onClick={(e) => {
											e.preventDefault(); // Prevent <Link> navigation
											e.stopPropagation(); // Prevent bubbling to <Link>
											if (href) {
												window.open(
													href,
													"_blank",
													"noopener,noreferrer",
												);
											}
										}}
										size="small"
									>
										<StyledFooterDiv>
											<ButtonName>Open App</ButtonName>
											<OpenInNewOutlinedIcon fontSize="small" />
										</StyledFooterDiv>
									</StyledOpenButton>
								</StyledFooter>
							)}
							{app.project_created_by !== "SYSTEM" ? (
								<StyledOpenButton
									onClick={(e) => {
										e.preventDefault();
										navigateApp(app.project_id);
									}}
									size="small"
								>
									<ViewDetailsButton>
										<ViewDetailsButtonName>
											View Details
										</ViewDetailsButtonName>
									</ViewDetailsButton>
								</StyledOpenButton>
							) : null}
							{app.project_created_by !== "SYSTEM" ? (
								<IconButton
									onClick={(e) => {
										e.preventDefault();
										setAnchorEl(
											e.currentTarget.closest(
												".MuiCard-root",
											) as HTMLElement | null,
										); // Set the card as the anchor element
									}}
									size="small"
								>
									<MoreVert />
								</IconButton>
							) : null}
						</StyledCardActions>
					</StyledContent>
				</Link>
				<StyledMenu
					anchorEl={anchorEl}
					open={open}
					onClose={() => {
						setAnchorEl(null);
					}}
					anchorOrigin={{
						vertical: "bottom", // Anchor to the bottom of the card
						horizontal: "right", // Anchor to the right of the card
					}}
					transformOrigin={{
						vertical: "top", // Transform from the top of the menu
						horizontal: "right", // Transform from the right of the menu
					}}
				>
					<Menu.Item
						value="edit"
						onClick={(event: React.MouseEvent) => {
							navigate(`/app/${app.project_id}/dashboard`);
							setAnchorEl(null);
							event.stopPropagation();
						}}
					>
						View Dashboard
					</Menu.Item>
					<Menu.Item
						value="copy"
						onClick={() => {
							copyProjectId(app.project_id);
							setAnchorEl(null);
						}}
					>
						Copy App ID
					</Menu.Item>
					{app?.user_permission && app.user_permission < 2 && (
						<Menu.Item
							value="clone"
							onClick={() => {
								setIsUploadOpen(true);
							}}
						>
							Clone This App
						</Menu.Item>
					)}
					{app?.user_permission && app.user_permission < 2 && (
						<Menu.Item
							value="delete"
							onClick={() => {
								setIsAppDeleteModalOpen(true);
							}}
						>
							Delete App
						</Menu.Item>
					)}
				</StyledMenu>
				<AppDeleteModal
					isOpen={isAppDeleteModalOpen}
					onClose={() => {
						setIsAppDeleteModalOpen(false);
						setAnchorEl(null);
					}}
					appId={app.project_id}
					onDelete={() => {
						onDelete();
					}}
				/>
				{isUploadOpen ? (
					<AddAppCloneModal
						open={isUploadOpen}
						appId={app.project_id}
						handleClose={(appId) => {
							console.log("ok");
							// if there is an appId navigate to it
							if (appId) {
								navigateApp(appId);
							}

							// close it
							setIsUploadOpen(false);
						}}
					/>
				) : null}
			</StyledTileCard>
		</StyledMainDiv>
	);
};
