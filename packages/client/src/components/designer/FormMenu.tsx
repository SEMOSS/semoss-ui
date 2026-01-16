import { InfoOutlined, ReportRounded, Search } from "@mui/icons-material";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlockJSON } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import {
	Card,
	Divider,
	Grid,
	InputAdornment,
	Menu,
	Stack,
	styled,
	TextField,
	ToggleTabsGroup,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import type { DesignerMenuItem } from "../blocks-workspace/menus/menu-types";
import { BlockCardContent, blockCardWidth } from "./BlockMenuCardContent";

type MODE = "SYSTEM" | "COMMUNITY";

interface FormMenuProps {
	parentId: string;
	anchorEl: HTMLElement | null;

	// System blocks, same type as BlocksMenuPanel `items`
	systemItems: DesignerMenuItem[];

	// Host wants a BlockJSON when user picks something
	onSelect: (blockJson: BlockJSON) => void;

	onClose: () => void;

	title?: string;
}

const StyledQuickMenu = styled(Menu)(() => ({
	"& .MuiMenu-paper": {
		borderRadius: "12px",
		background: "#FFF",
		boxShadow: "0px 5px 24px 0px rgba(0, 0, 0, 0.32)",
		minWidth: 360,
		maxWidth: 420,
		padding: "8px 0 8px 0",
	},
}));

const StyledTitle = styled("div")(({ theme }) => ({
	borderRadius: "16px",
	backgroundColor: theme.palette.primary.selected,
	color: theme.palette.info.dark,
	width: "fit-content",
	marginTop: theme.spacing(0.5),
	marginBottom: theme.spacing(1),
	paddingRight: theme.spacing(2),
	paddingLeft: theme.spacing(2),
}));

const StyledTitleSpan = styled("span")({
	color: "var(--Primary-Dark, #1260DD)",
	fontFamily: "Inter",
	fontSize: "13px",
	fontWeight: 400,
	lineHeight: "18px",
	letterSpacing: "0.16px",
});

const StyledTextField = styled(TextField)(() => ({
	marginTop: 4,
	marginBottom: 4,
	width: "100%",
	borderRadius: 8,
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
	border: 0,
	minHeight: "36px",
	color: theme.palette.secondary.light,
	borderRadius: theme.shape.borderRadius,
	alignItems: "center",
	padding: "0px 3px",
	width: "100%",
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
	height: "32px",
	padding: "4px 10px",
	fontSize: "12px",
	"&.MuiTab-root": {
		borderRadius: theme.shape.borderRadius,
	},
	"&.Mui-selected": {
		boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
	},
}));

const StyledGridWrapper = styled("div")({
	width: "100%",
	maxHeight: 280,
	overflowY: "auto",
});

const InlineStyledCard = styled(Card)({
	cursor: "pointer",
	border: `1px solid rgba(0, 0, 0, 0.12)`,
	borderRadius: "6px",
	justifyContent: "center",
});

const InlineStyledTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.secondary.dark,
	width: blockCardWidth,
	userSelect: "none",
	alignItems: "center",
}));

const InlineStyledDiv = styled("div")({
	position: "relative",
	display: "inline-block",
	paddingTop: "16px",
	paddingRight: "16px",
});

const Styledstack = styled(Stack)({
	padding: "0px 16px 0px 16px",
	paddingY: "8px 0px 8px 0px",
	maxWidth: "420px",
});

const StyledTypography = styled(Typography)({
	paddingY: "8px",
});

interface FormMenuCardProps {
	item: DesignerMenuItem;
	isCommunity: boolean;
}

const FormMenuBlockCard: React.FC<FormMenuCardProps> = ({
	item,
	isCommunity,
}) => {
	const [hovered, setHovered] = useState(false);

	const image = isCommunity
		? undefined
		: hovered
			? item.hoverImage
			: item.activeImage;

	return (
		<Stack
			spacing={1}
			alignItems="center"
			height="100%"
			justifyContent="flex-end"
		>
			<InlineStyledTypography
				variant="body2"
				fontWeight="medium"
				align="center"
			>
				<Stack
					direction={"row"}
					gap={1}
					alignContent={"center"}
					justifyContent={"center"}
				>
					{item.name}
					{item.recentChanges && (
						<Tooltip title={item.recentChanges}>
							<span>
								<InfoOutlined fontSize="small" color="info" />
							</span>
						</Tooltip>
					)}
					{item.isBeta && (
						<Tooltip title={"This block is currently in beta"}>
							<span>
								<ReportRounded
									fontSize="small"
									color="warning"
								/>
							</span>
						</Tooltip>
					)}
				</Stack>
			</InlineStyledTypography>

			<InlineStyledDiv
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				<InlineStyledCard>
					<Tooltip
						title={item.helperText ?? item.name}
						arrow
						placement="bottom"
					>
						<div>
							<BlockCardContent image={image} name={item.name} />
						</div>
					</Tooltip>
				</InlineStyledCard>
			</InlineStyledDiv>
		</Stack>
	);
};

export const FormMenu: React.FC<FormMenuProps> = ({
	parentId,
	anchorEl,
	systemItems,
	onClose,
	onSelect,
	title = "Add blocks to form",
}) => {
	const notification = useNotification();

	const [search, setSearch] = useState("");
	const [mode, setMode] = useState<MODE>("SYSTEM");
	const [communityBlocks, setCommunityBlocks] = useState<DesignerMenuItem[]>(
		[],
	);
	const [loadingCommunity, setLoadingCommunity] = useState(false);
	const [hasLoadedCommunity, setHasLoadedCommunity] =
		useState<boolean>(false);

	const loadCommunityBlocks = useCallback(async () => {
		if (hasLoadedCommunity) return;
		try {
			setLoadingCommunity(true);
			const res = await runPixel("GetClientBlocks()");
			const { pixelReturn, errors } = res;

			if (errors && errors.length) {
				notification.add({
					color: "error",
					message:
						errors.join("") || "Error loading community blocks",
				});
				setLoadingCommunity(false);
				return;
			}

			const output = pixelReturn?.[0]?.output as
				| DesignerMenuItem[]
				| undefined;

			if (output && Array.isArray(output)) {
				const normalized = output.map((item) => ({
					...item,
					json: JSON.parse(JSON.stringify(item.json)),
				}));
				setCommunityBlocks(normalized);
			}
		} catch (e) {
			console.error(e);
			notification.add({
				color: "error",
				message: "Error loading community blocks",
			});
		} finally {
			setLoadingCommunity(false);
			setHasLoadedCommunity(true);
		}
	}, [hasLoadedCommunity, notification]);

	useEffect(() => {
		if (mode === "COMMUNITY") {
			loadCommunityBlocks();
		}
	}, [mode, loadCommunityBlocks]);

	const isCommunity = mode === "COMMUNITY";

	const activeItems: DesignerMenuItem[] = useMemo(() => {
		const source = isCommunity ? communityBlocks : systemItems;
		const s = search.trim().toLowerCase();

		if (!s) return source;

		return source.filter((item) => item.name.toLowerCase().includes(s));
	}, [isCommunity, communityBlocks, systemItems, search]);

	const anyCommunity = communityBlocks.length > 0;

	const handleCardClick = (block: DesignerMenuItem) => {
		const blockJson = block.json as BlockJSON;
		onSelect(blockJson);
		onClose();
	};

	return (
		<StyledQuickMenu
			anchorEl={anchorEl}
			open={Boolean(anchorEl)}
			onClose={onClose}
		>
			<Styledstack spacing={1}>
				<StyledTitle>
					<StyledTitleSpan>{title}</StyledTitleSpan>
				</StyledTitle>
				<Divider />
				<Stack direction="row" alignItems="center">
					<StyledTextField
						placeholder={
							isCommunity
								? "Search community blocks"
								: "Search system blocks"
						}
						size="small"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search fontSize="small" />
								</InputAdornment>
							),
						}}
					/>
				</Stack>

				<StyledToggleTabsGroup
					value={mode}
					onChange={(e: React.SyntheticEvent, val) => {
						setMode(val as MODE);
					}}
				>
					<StyledToggleTabsGroupItem
						label="System Blocks"
						value="SYSTEM"
					/>
					<StyledToggleTabsGroupItem
						label="Community Blocks"
						value="COMMUNITY"
					/>
				</StyledToggleTabsGroup>

				<StyledGridWrapper>
					{isCommunity && loadingCommunity ? (
						<StyledTypography variant="body2">
							Loading community blocks...
						</StyledTypography>
					) : activeItems.length ? (
						<Grid container spacing={1.5} paddingLeft={0.5}>
							{activeItems.map((block) => (
								<Grid
									item
									xs={6} // 👉 two cards per row
									key={`${parentId}-${block.name}`}
									onClick={(e) => {
										e.stopPropagation();
										handleCardClick(block);
									}}
									style={{ cursor: "pointer" }}
								>
									<FormMenuBlockCard
										item={block}
										isCommunity={isCommunity}
									/>
								</Grid>
							))}
						</Grid>
					) : (
						<StyledTypography variant="body2">
							{isCommunity && !anyCommunity
								? "No community blocks found"
								: "No blocks found"}
						</StyledTypography>
					)}
				</StyledGridWrapper>
			</Styledstack>
		</StyledQuickMenu>
	);
};
