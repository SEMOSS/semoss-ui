import {
	Bot,
	HelpCircle,
	MessagesSquareIcon,
	Search,
	SquarePenIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, matchPath, useLocation, useParams } from "react-router";
import { RoomHistory } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Separator,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@semoss/ui/next";
import { MobileNavigationClose } from "@/features/navigation/mobile-navigation-close";
import { NavigationRail } from "@/features/navigation/navigation-rail";
import { NavigationToggle } from "@/features/navigation/navigation-toggle";
import { useRoot } from "@/hooks/use-root";
import { AppLogo } from "./app-logo";
import { GlobalNavItem } from "./global-nav-item";
import { NavUser } from "./nav-user";

let isIframed = false;
try {
	isIframed = window.self !== window.top;
} catch {
	isIframed = true;
}

/**
 * Renders a sidebar allowing users to navigate between pages
 *
 * @component
 */
export const GlobalNav = () => {
	const { t } = useTranslation(["sidebar", "appNav"]);

	const { root } = useRoot();
	const [search, setSearch] = useState("");
	const [helpOpen, setHelpOpen] = useState(false);
	const { open, openMobile, isMobile } = useSidebar();
	const hideChatHistory = !!root.theme.featureFlags?.hideChatHistory;
	// True when the sidebar is actually visible to the user.
	// Desktop: tracks the expand/collapse state (`open`).
	// Mobile: tracks the Sheet's open state (`openMobile`) — the Sheet
	// mounts hidden with 0-height, so the history waits until the user
	// opens it.
	const isVisible = (isMobile ? openMobile : open) && !hideChatHistory;
	const { pathname } = useLocation();
	const { roomId: activeRoomId } = useParams<{ roomId: string }>();

	return (
		<Sidebar
			collapsible="icon"
			variant="inset"
			className="z-30 h-full p-0 transition-[width] duration-200 ease-in-out"
		>
			<SidebarHeader>
				<SidebarMenu className="gap-1 transition-all duration-200 ease-in-out group-data-[collapsible=icon]:px-2">
					<SidebarMenuItem className="flex min-w-0 items-center">
						<SidebarMenuButton
							size="lg"
							className="h-8 min-w-0 flex-1 group-data-[collapsible=icon]:hidden"
							asChild
						>
							<Link
								to={"/"}
								aria-label={"Go Home"}
								className="flex h-12 w-full flex-1 items-center"
							>
								<AppLogo full={open} />
							</Link>
						</SidebarMenuButton>
						<NavigationToggle />
						<MobileNavigationClose />
					</SidebarMenuItem>
				</SidebarMenu>

				<SidebarMenu className="max-h-[45vh] gap-2 overflow-y-auto p-2">
					{!hideChatHistory && (
						<InputGroup
							className="bg-background group-data-[collapsible=icon]:hidden"
							data-tour="tour-search"
						>
							<InputGroupInput
								placeholder={t("appNav:search")}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<InputGroupAddon>
								<Search />
							</InputGroupAddon>
						</InputGroup>
					)}
					{root.theme.featureFlags?.hideToolsInIframe &&
					isIframed ? null : (
						<>
							<SidebarMenuItem data-tour="tour-new-chat">
								<SidebarMenuButton
									asChild
									isActive={!!matchPath("/new", pathname)}
									tooltip={{
										children: t(
											"appNav:nav.newChat.tooltip",
										),
										hidden: false,
									}}
								>
									<Link to={"/new"} aria-label={"New Chat"}>
										<SquarePenIcon />
										{t("appNav:nav.newChat.label")}
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							{root.theme.featureFlags?.enableAgent && (
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={
											!!matchPath("/agent", pathname)
										}
										tooltip={{
											children: t(
												"appNav:nav.agents.tooltip",
											),
											hidden: false,
										}}
									>
										<Link
											to={"/agent"}
											aria-label={"agent"}
										>
											<Bot />
											{t("appNav:nav.agents.label")}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}

							{!hideChatHistory && (
								<SidebarMenuItem>
									<SidebarMenuButton
										asChild
										isActive={
											!!matchPath("/chats", pathname)
										}
										tooltip={{
											children: t(
												"appNav:nav.allChats.tooltip",
											),
											hidden: false,
										}}
									>
										<Link
											to={"/chats"}
											aria-label={"chats"}
										>
											<MessagesSquareIcon />
											{t("appNav:nav.allChats.label")}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}

							{root.theme.sidebar.headerItems.map(
								(item, index) => (
									<GlobalNavItem
										key={`header-${item.name}-${index}`}
										name={item.name}
										icon={item.icon}
										iconDark={item.iconDark}
										path={item.path}
										url={item.url}
										embed={item.embed}
										tooltip={item.tooltip}
									/>
								),
							)}
						</>
					)}
				</SidebarMenu>
			</SidebarHeader>
			{!hideChatHistory && (
				<SidebarContent
					className="min-h-[120px] flex-1 overflow-hidden pe-2 transition-all duration-200 ease-in-out"
					data-tour="tour-chat-history"
				>
					<RoomHistory
						search={search}
						isVisible={isVisible}
						activeRoomId={activeRoomId}
						showDates={!!root.theme.sidebar.chatHistoryDate}
					/>
				</SidebarContent>
			)}
			<SidebarFooter>
				<Separator className="group-data-[collapsible=icon]:hidden" />
				<SidebarMenu className="gap-2 p-2">
					{root.theme.sidebar.footerItems.length > 0 && (
						// biome-ignore lint/a11y/useSemanticElements: keeping div for layout reasons
						<div
							className="relative group-data-[collapsible=icon]:hidden"
							role="button"
							tabIndex={0}
							onMouseEnter={() => setHelpOpen(true)}
							onMouseLeave={() => setHelpOpen(false)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
								}
							}}
							onClick={() => setHelpOpen((prev) => !prev)}
						>
							<SidebarMenuItem>
								<SidebarMenuButton>
									<HelpCircle />
									Help
								</SidebarMenuButton>
							</SidebarMenuItem>
							{helpOpen && (
								<div className="absolute start-0 bottom-full z-50 w-full rounded-md border bg-popover p-1 shadow-md">
									<SidebarMenu>
										{root.theme.sidebar.footerItems.map(
											(item) => (
												<GlobalNavItem
													key={item.path}
													name={item.name}
													icon={item.icon}
													iconDark={item.iconDark}
													path={item.path}
													url={item.url}
													embed={item.embed}
													tooltip={item.tooltip}
												/>
											),
										)}
									</SidebarMenu>
								</div>
							)}
						</div>
					)}
					<SidebarMenuItem>
						<NavUser />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<NavigationRail />
		</Sidebar>
	);
};
