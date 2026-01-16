import {
	ArrowDropDown,
	ArrowDropUp,
	Bookmark,
	BookmarkBorder,
	LockOpenRounded,
	LockRounded,
	MoreVert,
	Person,
	Star,
	StarOutlineOutlined,
} from "@mui/icons-material";
import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Env } from "@semoss/sdk/react";
import {
	Avatar,
	ButtonGroup,
	Card,
	Chip,
	IconButton,
	Menu,
	Stack,
	styled,
	Typography,
	useNotification,
} from "@semoss/ui";
import BRAIN from "@/assets/img/BRAIN.png";
import GOOGLE from "@/assets/img/google.png";
import { ENGINE_IMAGES } from "@/pages/import";
import { formatToDataTestId } from "@/utility";

const StyledCardImg = styled("img")({
	display: "flex",
	height: "20px",
	width: "20px",
	alignItems: "flex-start",
	gap: "10px",
	alignSelf: "stretch",
	overflowClipMargin: "content-box",
	overflow: "clip",
	objectFit: "cover",
});

const StyledLandscapeCard = styled(Card)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "16px",
	// boxShadow:
	//     '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',
	boxShadow: "0px 5px 24px 0px rgba(0, 0, 0, 0.08)",
	"&:hover": {
		cursor: "pointer",
	},
	borderRadius: theme.shape.borderRadius,
	padding: "16px",
	// height: '144px',
}));

const StyledLandscapeCardHeader = styled("div")({
	display: "flex",
	alignItems: "center",
	gap: "10px",
	alignSelf: "stretch",
	height: "32px",
});

const StyledLandscapeCardImg = styled(Card.Media)(({ theme }) => ({
	width: "32px",
	height: "32px",
	borderRadius: theme.shape.borderRadius,
	justifyContent: "center",
	alignItems: "center",
}));

const StyledLandscapeCardHeaderDiv = styled("div")({
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	flex: "1 0 0",
	justifyContent: "space-between",
	gap: "6px",
});

const StyledAvatar = styled(Avatar)({
	display: "flex",
	width: "20px",
	height: "20px",
	padding: "8px",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
});

const StyledPersonIcon = styled(Person)({
	display: "flex",
	alignItems: "flex-start",
});

const StyledPublishedByLabel = styled(Typography)({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	flex: "1 0 0",
});

const StyledLeftActions = styled("div")({
	display: "flex",
	alignItems: "center",
	gap: "6px",
	flex: "1 0 0",
});

const StyledButtonGroup = styled(ButtonGroup)(() => ({}));

const StyledLockButton = styled(IconButton)({
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	gap: "10px",
});

const StyledTileCard = styled(Card)({
	"&:hover": {
		cursor: "pointer",
	},
});

const StyledPlainTileCard = styled(StyledTileCard)({
	height: "100%",
});

const StyledTileCardContent = styled(Card.Content)({
	display: "flex",
	padding: "0px 16px",
	flexDirection: "column",
	alignItems: "flex-start",
	alignSelf: "stretch",
});

const StyledCardImage = styled("img")({
	display: "flex",
	height: "134px",
	alignItems: "flex-start",
	gap: "10px",
	alignSelf: "stretch",

	overflowClipMargin: "content-box",
	overflow: "clip",
	objectFit: "cover",
	width: "100%",
	// aspectRatio: '1/1'
});

const StyledDbName = styled(Typography)({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	flex: "1 0 0",
	alignSelf: "stretch",
});

const StyledPublishedByContainer = styled("div")({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	gap: "4px",
	alignSelf: "stretch",
});

const StyledCardDescription = styled(Typography)({
	display: "block",
	minHeight: "60px",
	maxHeight: "60px",
	maxWidth: "350px",
	whiteSpace: "pre-wrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
});

const StyledTagChip = styled(Chip, {
	shouldForwardProp: (prop) => prop !== "maxWidth",
})<{ maxWidth?: string }>(({ maxWidth = "200px" }) => ({
	maxWidth: maxWidth,
	textOverflow: "ellipsis",
}));

const UnstyledVoteCount = styled(ButtonGroup.Item)(() => ({
	"&:hover": {
		backgroundColor: "transparent",
		borderColor: "rgba(0, 0, 0, 0.54)",
	},
}));

const StyledCardIconsDiv = styled("div")({
	display: "flex",
	justifyContent: "flex-end",
	// marginTop: '8px',
	flex: "1",
	alignItems: "center",
	gap: "8px",
});

/**
 * @name findDBImage
 * @params appType & appSubType
 * @returns image link for associated engine
 */
const findDBImage = (appType: string, appSubType: string) => {
	const obj = ENGINE_IMAGES[appType]?.find((ele) => ele.name === appSubType);

	if (!obj) {
		return BRAIN;
	}

	return obj.icon;
};

interface DatabaseCardProps {
	/** Name of the Database */
	name: string;

	/** ID of Database */
	id: string;

	/** Owner of the Database */
	owner: string;

	/** Description of the Database */
	description: string;

	/** Tag of the Database */
	tag?: string[] | string;

	/** Database type */
	type?: string;

	/** Subtype for Icon */
	sub_type?: string;

	/** Whether or not the database is viewable by everyone */
	isGlobal?: boolean;

	isFavorite?: boolean;

	isDiscoverable?: boolean;

	isUpvoted?: boolean;

	votes?: string;

	views?: string;

	trending?: string;

	date?: string;

	onClick?: (value: string) => void;

	favorite?: (value: boolean) => void;

	upvote?: (value: boolean) => void;

	global?: (value) => void;
}

export const EngineLandscapeCard = (props: DatabaseCardProps) => {
	const {
		name,
		id,
		tag,
		isFavorite,
		isDiscoverable = false,
		type,
		sub_type,
		date,
		onClick,
		favorite,
		// isUpvoted,
		// isGlobal,
		// description,
		// owner = "N/A",
		// votes = "0",
		// views = 'N/A',
		// trending = 'N/A',
		// upvote,
		// global,
	} = props;

	/** Menu toggle state */
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const formattedDate = new Date(date)
		.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		})
		.replace(",", "");

	const notification = useNotification();
	const navigate = useNavigate();

	const copyId = (id: string) => {
		try {
			navigator.clipboard.writeText(id);
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

	return (
		<StyledLandscapeCard
			onClick={() => onClick(id)}
			data-testId={formatToDataTestId(
				`genericEngineCards-${type}-${name}`,
			)}
		>
			<StyledLandscapeCardHeader>
				<StyledLandscapeCardImg
					src="img"
					image={findDBImage(type, sub_type)}
				/>
				<StyledLandscapeCardHeaderDiv>
					<Typography variant={"body1"}>
						<Typography variant={"body1"}>
							<Typography variant="body1" noWrap={true}>
								{name}
							</Typography>
							{/* {formatDBName(name)} */}
						</Typography>
						{sub_type === "EMBEDDED" ? (
							<StyledCardImg src={GOOGLE}></StyledCardImg>
						) : null}
					</Typography>
					<Stack
						direction="row"
						alignItems="center"
						spacing={0.5}
						minHeight="32px"
					>
						{tag !== undefined &&
							(Array.isArray(tag) ? (
								<>
									{/** biome-ignore lint/suspicious/useIterableCallbackReturn: <explanation> */}
									{tag.map((t, i) => {
										if (i <= 2 && t !== "") {
											return (
												<StyledTagChip
													maxWidth={
														tag.length === 2
															? "100px"
															: tag.length === 1
																? "200px"
																: "75px"
													}
													key={`${id}${
														// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
														i
													}`}
													label={t}
												/>
											);
										}

										return null;
									})}
									{tag.length > 3 ? (
										<Typography variant="caption">
											+{tag.length - 3}
										</Typography>
									) : null}
								</>
							) : tag !== "" ? (
								<StyledTagChip key={`${id}0`} label={tag} />
							) : null)}
					</Stack>
				</StyledLandscapeCardHeaderDiv>
				<StyledCardIconsDiv>
					<Stack>{formattedDate}</Stack>
					<Stack direction="row" alignItems="center" gap={1}>
						{!isDiscoverable && (
							<IconButton
								size={"small"}
								title={
									isFavorite
										? `Unbookmark ${name ? name : id}`
										: `Bookmark ${name ? name : id}`
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
								)}{" "}
							</IconButton>
						)}
						<IconButton
							sx={{ mt: 0 }}
							onClick={(e) => {
								e.stopPropagation();
								setAnchorEl(e.currentTarget);
							}}
						>
							<MoreVert />
						</IconButton>
						<Menu
							anchorEl={anchorEl}
							open={open}
							onClose={() => {
								setAnchorEl(null);
							}}
						>
							<Menu.Item
								value="copy"
								onClick={(event: React.MouseEvent) => {
									copyId(id);
									setAnchorEl(null);
									event.stopPropagation();
								}}
							>
								Copy ID
							</Menu.Item>
							<Menu.Item
								value="dashboard"
								onClick={(event: React.MouseEvent) => {
									navigate(`${id}/dashboard`);
									setAnchorEl(null);
									event.stopPropagation();
								}}
							>
								View Dashboard
							</Menu.Item>
						</Menu>
					</Stack>
				</StyledCardIconsDiv>
			</StyledLandscapeCardHeader>
		</StyledLandscapeCard>
	);
};

export const EngineTileCard = (props: DatabaseCardProps) => {
	const {
		name,
		id,
		description,
		tag,
		isGlobal,
		isFavorite,
		sub_type,
		isUpvoted,
		owner = "N/A",
		votes = "0",
		// views = 'N/A',
		// trending = 'N/A',
		onClick,
		favorite,
		upvote,
		global,
	} = props;

	return (
		<StyledTileCard onClick={() => onClick(id)}>
			{/* Use Card.Media instead, uses img tag */}
			<Card.Media
				src="img"
				image={`${Env.MODULE}/api/e-${id}/image/download`}
			/>
			<StyledCardImage
				src={`${Env.MODULE}/api/e-${id}/image/download`}
				sx={{ height: "134px" }}
			/>
			<Card.Header
				title={
					name ? (
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								gap: "8px",
							}}
						>
							<Typography variant={"body1"}>{name}</Typography>
							{sub_type === "VERTEX" ? (
								<StyledCardImg src={GOOGLE}></StyledCardImg>
							) : null}
						</div>
					) : (
						id
					)
				}
				subheader={
					<StyledPublishedByContainer>
						<StyledAvatar>
							<StyledPersonIcon />
						</StyledAvatar>
						<StyledPublishedByLabel variant={"caption"}>
							Published by: {owner}
						</StyledPublishedByLabel>
					</StyledPublishedByContainer>
				}
				action={
					<IconButton
						title={
							isFavorite
								? `Unbookmark ${name ? name : id}`
								: `Bookmark ${name ? name : id}`
						}
						onClick={(e) => {
							e.stopPropagation();
							favorite(isFavorite);
						}}
						aria-label={
							isFavorite
								? `Unfavorite ${name ? name : id}`
								: `Favorite ${name ? name : id}`
						}
					>
						{isFavorite ? <Star /> : <StarOutlineOutlined />}
					</IconButton>
				}
			/>
			<Card.Content>
				<StyledCardDescription variant={"body2"}>
					{description ? description : "No description available"}
				</StyledCardDescription>
				<Stack
					direction="row"
					alignItems="center"
					spacing={0.5}
					minHeight="32px"
				>
					{tag !== undefined &&
						(Array.isArray(tag) ? (
							<>
								{/** biome-ignore lint/suspicious/useIterableCallbackReturn: <explanation> */}
								{tag.map((t, i) => {
									if (i <= 2 && t !== "") {
										return (
											<StyledTagChip
												maxWidth={
													tag.length === 2
														? "100px"
														: tag.length === 1
															? "200px"
															: "75px"
												}
												key={`${id}${
													// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
													i
												}`}
												label={t}
											/>
										);
									}

									return null;
								})}
								{tag.length > 3 ? (
									<Typography variant="caption">
										+{tag.length - 3}
									</Typography>
								) : null}
							</>
						) : tag !== "" ? (
							<StyledTagChip key={`${id}0`} label={tag} />
						) : null)}
				</Stack>
			</Card.Content>
			<Card.Actions>
				<StyledLeftActions>
					<StyledButtonGroup
						size="small"
						variant={"outlined"}
						color="secondary"
					>
						<ButtonGroup.Item
							sx={{
								borderColor: "rgba(0, 0, 0, 0.54)",
								color: "rgba(0, 0, 0, 0.60)",
							}}
							title={
								isUpvoted
									? `Downvote ${name ? name : id}`
									: `Upvote ${name ? name : id}`
							}
							onClick={(e) => {
								e.stopPropagation();
								upvote(isUpvoted);
							}}
							aria-label={
								isUpvoted
									? `Downvote ${name ? name : id}`
									: `Upvote ${name ? name : id}`
							}
						>
							{isUpvoted ? <ArrowDropDown /> : <ArrowDropUp />}
						</ButtonGroup.Item>
						<UnstyledVoteCount
							sx={{
								borderColor: "rgba(0, 0, 0, 0.54)",
								color: "rgba(0, 0, 0, 0.60)",
							}}
						>
							{votes}
						</UnstyledVoteCount>
					</StyledButtonGroup>
				</StyledLeftActions>
				<StyledLockButton
					title={
						isGlobal
							? `Make ${name ? name : id} private`
							: `Make ${name ? name : id} public`
					}
					disabled={!global}
					onClick={(e) => {
						e.stopPropagation();
						global(isGlobal);
					}}
					aria-label={
						isGlobal
							? `Make ${name ? name : id} private`
							: `Make ${name ? name : id} public`
					}
				>
					{isGlobal ? <LockOpenRounded /> : <LockRounded />}
				</StyledLockButton>
			</Card.Actions>
		</StyledTileCard>
	);
};

export interface PlainEngineCardProps {
	/** Name of the Database */
	name: string;

	onClick: () => void;
}

export const PlainEngineCard = (props) => {
	const { id, name, onClick } = props;
	return (
		<StyledPlainTileCard onClick={onClick}>
			<Card.Media
				src="img"
				image={`${Env.MODULE}/api/e-${id}/image/download`}
			/>
			<StyledCardImage
				src={`${Env.MODULE}/api/e-${id}/image/download`}
				sx={{ height: "134px" }}
			/>
			<StyledTileCardContent sx={{ marginTop: "8px" }}>
				<StyledDbName variant={"body1"}>
					{name ? name : id}
				</StyledDbName>
			</StyledTileCardContent>
		</StyledPlainTileCard>
	);
};
