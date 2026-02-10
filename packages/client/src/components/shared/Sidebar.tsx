import {
	AccountCircleRounded,
	Functions as FunctionsIcon,
	GridView as GridViewIcon,
	GppGoodRounded as GuardrailIcon,
	Home as HomeIcon,
	Inventory2Outlined,
	MenuOpenRounded,
	Settings as SettingsIcon,
	TokenRounded,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import {
	Divider,
	Drawer,
	IconButton,
	List,
	Stack,
	styled,
	Typography,
} from "@semoss/ui";
import { Database } from "@/assets/img/Database";
import { ModelBrain } from "@/assets/img/ModelBrain";
import { usePage, useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";
import { LogoutPopover } from "./LogoutPopover";

const DRAWER_OPEN_WIDTH = 288;

const CATALOG_ROUTES = [
	{ text: "Apps", icon: <GridViewIcon />, route: "/app" },
	{
		text: "Model",
		icon: <ModelBrain color="#757575" width="24" height="24" />,
		route: "/engine/model",
	},
	{
		text: "Database",
		icon: <Database color="#757575" />,
		route: "/engine/database",
	},
	{ text: "Vector", icon: <TokenRounded />, route: "/engine/vector" },
	{ text: "Function", icon: <FunctionsIcon />, route: "/engine/function" },
	{
		text: "Storage",
		icon: <Inventory2Outlined />,
		route: "/engine/storage",
	},
	{ text: "Guardrail", icon: <GuardrailIcon />, route: "/engine/guardrail" },
];

const StyledNavHeader = styled(Stack)(({ theme }) => ({
	position: "relative",
	background: "transparent",
	paddingTop: theme.spacing(1.5),
	paddingRight: theme.spacing(2),
	paddingBottom: theme.spacing(1),
	paddingLeft: theme.spacing(2),
	zIndex: 0,
}));

const StyledNavHeaderLink = styled(Link)(({ theme }) => ({
	flex: 1,
	display: "flex",
	alignItems: "center",
	color: "inherit",
	textDecoration: "none",
	cursor: "pointer",
	gap: theme.spacing(1),
	"&:hover": {
		background: theme.palette.action.hover,
	},
}));

const StyledSidebar = styled(Drawer)(() => ({
	flexShrink: 0,
	whiteSpace: "nowrap",
	boxSizing: "border-box",
	"& .MuiDrawer-paper": {
		width: DRAWER_OPEN_WIDTH,
		borderRadius: 0,
	},
	variants: [
		{
			props: ({ variant }) => variant === "permanent",
			style: {
				width: DRAWER_OPEN_WIDTH,
			},
		},
	],
}));

const StyledSidebarContent = styled(Stack)(({ theme }) => ({
	flexDirection: "column",
	width: "100%",
	overflowY: "auto",
}));

const StyledSidebarFooter = styled(Stack)(({ theme }) => ({
	overflowY: "hidden",
}));

const StyledList = styled(List)(() => ({
	padding: 0,
}));

const StyledListItem = styled(List.Item)(({ theme }) => ({
	gap: theme.spacing(1),
	padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
}));

const StyledListItemButton = styled(List.ItemButton, {
	shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
	gap: theme.spacing(1),
	padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
	backgroundColor: selected ? theme.palette.primary.selected : undefined,
})) as unknown as typeof List.ItemButton;

const StyledListItemIcon = styled(List.ItemIcon)(() => ({
	width: "28px",
	minWidth: "auto",
}));

const StyledLink = styled(Link)(({ theme }) => ({
	color: "inherit",
	textDecoration: "none",
	cursor: "pointer",
	padding: theme.spacing(0.5, 0),
}));

const StyledSettingsArea = styled(Stack)(({ theme }) => ({
	flexDirection: "column",
	width: "100%",
	overflowY: "auto",
}));

const EllipsisText = styled("span")({
	display: "block",
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
	maxWidth: "100%", // adjust as needed
});

const StyledCloseIconButton = styled(IconButton)({
	borderRadius: "7.5px",
	border: "0.938px solid #E6E6E6",
	padding: "3.75px",
});

export const Sidebar: React.FC = observer(() => {
	const { configStore } = useRootStore();
	const { page } = usePage();

	const { pathname } = useLocation();

	const [viewSidebar, setViewSidebar] = useState(false);
	useEffect(() => {
		if (configStore.store.user.admin) {
			setViewSidebar(true);
		} else if (
			!configStore.store.user.admin &&
			!configStore.store.config.adminOnlyViewMenuBarFlag
		) {
			setViewSidebar(true);
		}
	}, [
		configStore.store.user.admin,
		configStore.store.config.adminOnlyViewMenuBarFlag,
	]);

	function closeSidebar() {
		if (page.sidebar.pinned) {
			return;
		}
		page.closeSidebar();
	}

	return (
		<StyledSidebar
			variant={page.sidebar.pinned ? "permanent" : "temporary"}
			anchor="left"
			open={page.sidebar.open}
			onClose={() => {
				closeSidebar;
			}}
			PaperProps={{
				onMouseLeave: () => {
					closeSidebar();
				},
			}}
		>
			<StyledNavHeader
				direction={"row"}
				alignItems={"center"}
				justifyContent={"flex-start"}
				spacing={2}
			>
				<StyledNavHeaderLink to={"/"} aria-label={"Go Home"}>
					{configStore.theme.logo ? (
						<img src={configStore.theme.logo} alt="theme-icon" />
					) : null}
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{configStore.theme.name}
					</Typography>
				</StyledNavHeaderLink>

				<StyledCloseIconButton
					size="small"
					onClick={() => {
						if (page.sidebar.pinned) {
							page.unpinSidebar();
						} else {
							page.pinSidebar();
							return;
						}
						closeSidebar();
					}}
				>
					<MenuOpenRounded fontSize="medium" />
				</StyledCloseIconButton>
			</StyledNavHeader>
			<Divider light />
			<StyledSidebarContent>
				<StyledList dense={true} aria-label="main navigation">
					<StyledLink to={"/"} aria-label={"Home"}>
						<StyledListItemButton
							selected={!!matchPath("/", pathname)}
							dense={true}
						>
							<StyledListItemIcon>
								<HomeIcon />
							</StyledListItemIcon>
							<List.ItemText primary={"Home"} />
						</StyledListItemButton>
					</StyledLink>
				</StyledList>
			</StyledSidebarContent>
			<Divider light />
			{viewSidebar ? (
				<StyledSidebarContent>
					<StyledList dense={true} aria-label="catalog navigation">
						<StyledListItem>
							<List.ItemText
								primary={"Catalog"}
								primaryTypographyProps={{
									variant: "subtitle2",
								}}
							/>
						</StyledListItem>
						{CATALOG_ROUTES.map((r) => {
							return (
								<StyledLink
									key={r.route}
									to={r.route}
									aria-label={r.text}
								>
									<StyledListItemButton
										selected={
											!!matchPath(
												`${r.route}/*`,
												pathname,
											)
										}
										aria-label={r.text}
										dense={true}
										data-testid={formatToDataTestId(
											`sidebar-${r.text}-btn`,
										)}
									>
										<StyledListItemIcon>
											{r.icon}
										</StyledListItemIcon>
										<List.ItemText primary={r.text} />
									</StyledListItemButton>
								</StyledLink>
							);
						})}
					</StyledList>
				</StyledSidebarContent>
			) : (
				<Stack />
			)}
			<Divider light />
			<StyledSettingsArea flex={1}>
				<StyledList>
					<StyledLink to={"/settings"} aria-label={"Settings"}>
						<StyledListItemButton
							selected={!!matchPath(`/settings/*`, pathname)}
							dense={true}
						>
							<StyledListItemIcon>
								<SettingsIcon />
							</StyledListItemIcon>
							<List.ItemText primary={"Settings"} />
						</StyledListItemButton>
					</StyledLink>
				</StyledList>
			</StyledSettingsArea>
			<Divider light />
			<StyledSidebarFooter>
				<StyledList dense={true} aria-label="main navigation">
					<LogoutPopover>
						<StyledListItemButton aria-label={"Login"} dense={true}>
							<StyledListItemIcon>
								<AccountCircleRounded />
							</StyledListItemIcon>
							<List.ItemText
								primary={
									<EllipsisText>
										{configStore.store.user.name || ""}
									</EllipsisText>
								}
							/>
						</StyledListItemButton>
					</LogoutPopover>
				</StyledList>
			</StyledSidebarFooter>
		</StyledSidebar>
	);
});
