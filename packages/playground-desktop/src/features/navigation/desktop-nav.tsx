import {
	BookOpenIcon,
	BotIcon,
	MessagesSquareIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	SearchIcon,
	SquarePenIcon,
} from "lucide-react";
import { type ComponentType, useRef, useState } from "react";
import {
	Link,
	matchPath,
	useLocation,
	useNavigate,
	useParams,
} from "react-router";
import { RoomHistory, useSettingsDialog } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Kbd,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useSidebar,
} from "@semoss/ui/next";
import {
	hasOverlayTitleBar,
	TITLE_BAR_ATTRIBUTE,
} from "../../platform/window-chrome";
import { DesktopAccountMenu } from "./desktop-account-menu";
import { formatShortcut, useDesktopShortcuts } from "./use-desktop-shortcuts";

/** The chat's surfaces after New chat, each active on its own routes. */
const NAV_ITEMS: {
	to: string;
	labelKey: string;
	icon: ComponentType<{ className?: string }>;
}[] = [
	{ to: "/chats", labelKey: "nav.chats", icon: MessagesSquareIcon },
	{ to: "/agent", labelKey: "nav.agents", icon: BotIcon },
	{ to: "/knowledge", labelKey: "nav.knowledge", icon: BookOpenIcon },
];

/** Props for {@link DesktopNav}. */
export interface DesktopNavProps {
	/** The name of the server in use. */
	instanceName: string;
	/** Go back to the instance picker. */
	onSwitchServer: () => void;
	/** Sign out of the instance. */
	onSignOut: () => void;
}

/**
 * The desktop app's sidebar: New chat, search and the chat's surfaces, the
 * chat history, and the account menu. Its top is the window's title bar,
 * clear of the window's controls; it folds to an icon rail (⌘B), and ⌘N and
 * ⌘, work from anywhere.
 *
 * @component
 */
export const DesktopNav = ({
	instanceName,
	onSwitchServer,
	onSignOut,
}: DesktopNavProps) => {
	const { t } = useTranslation(["desktop", "sidebar"]);
	const { openSettings } = useSettingsDialog();
	const { open, setOpen, toggleSidebar } = useSidebar();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const { roomId } = useParams<{ roomId: string }>();
	const [search, setSearch] = useState("");
	const searchRef = useRef<HTMLInputElement>(null);
	const isOverlayTitleBar = hasOverlayTitleBar();
	const toggleLabel = t(
		open
			? "sidebar:actions.closeSidebar"
			: "sidebar:actions.openNavigation",
	);
	const ToggleIcon = open ? PanelLeftCloseIcon : PanelLeftOpenIcon;
	const newChatLabel = t("nav.newChat");
	const newChatShortcut = formatShortcut("N");

	useDesktopShortcuts({
		onNewChat: () => navigate("/new"),
		onOpenSettings: () => openSettings(),
	});

	/** From the rail: open the sidebar, then type in its search. */
	const handleSearchFromRail = () => {
		setOpen(true);
		// the field shows once the sidebar has expanded
		requestAnimationFrame(() => searchRef.current?.focus());
	};

	return (
		<Sidebar collapsible="icon" className="select-none">
			<SidebarHeader className="gap-2 p-0 pb-2">
				<div
					{...{ [TITLE_BAR_ATTRIBUTE]: "" }}
					className={cn(
						"flex h-11 shrink-0 items-center justify-end px-2 group-data-[collapsible=icon]:justify-center",
						// the window's controls sit at the start of the band; on the
						// rail they take its top, so the toggle drops below them
						isOverlayTitleBar &&
							"ps-18 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:ps-2 group-data-[collapsible=icon]:pt-11",
					)}
				>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
								aria-label={toggleLabel}
								aria-expanded={open}
								onClick={toggleSidebar}
							>
								<ToggleIcon
									aria-hidden
									className="rtl:-scale-x-100"
								/>
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right">
							{toggleLabel} <Kbd>{formatShortcut("B")}</Kbd>
						</TooltipContent>
					</Tooltip>
				</div>
				<div className="px-2 group-data-[collapsible=icon]:hidden">
					<InputGroup className="bg-background">
						<InputGroupInput
							ref={searchRef}
							placeholder={t("nav.search")}
							aria-label={t("nav.search")}
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Escape") {
									setSearch("");
								}
							}}
						/>
						<InputGroupAddon align="inline-end">
							<SearchIcon aria-hidden />
						</InputGroupAddon>
					</InputGroup>
				</div>
				<SidebarMenu className="gap-0.5 px-2 group-data-[collapsible=icon]:items-center">
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={pathname === "/new"}
							tooltip={{
								children: (
									<>
										{newChatLabel}{" "}
										<Kbd>{newChatShortcut}</Kbd>
									</>
								),
							}}
						>
							<Link to="/new">
								<SquarePenIcon aria-hidden />
								<span>{newChatLabel}</span>
								<Kbd className="ms-auto opacity-0 transition-opacity group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 group-data-[collapsible=icon]:hidden">
									{newChatShortcut}
								</Kbd>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
						<SidebarMenuButton
							tooltip={t("nav.search")}
							onClick={handleSearchFromRail}
						>
							<SearchIcon aria-hidden />
							<span>{t("nav.search")}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
					{NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
						<SidebarMenuItem key={to}>
							<SidebarMenuButton
								asChild
								isActive={
									matchPath(
										{ path: to, end: false },
										pathname,
									) !== null
								}
								tooltip={t(labelKey)}
							>
								<Link to={to}>
									<Icon aria-hidden />
									<span>{t(labelKey)}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<RoomHistory
					search={search}
					isVisible={open}
					activeRoomId={roomId}
				/>
			</SidebarContent>
			<SidebarFooter className="border-sidebar-border border-t">
				<SidebarMenu className="group-data-[collapsible=icon]:items-center">
					<SidebarMenuItem>
						<DesktopAccountMenu
							instanceName={instanceName}
							onSwitchServer={onSwitchServer}
							onSignOut={onSignOut}
						/>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail aria-label={toggleLabel} title={toggleLabel} />
		</Sidebar>
	);
};
