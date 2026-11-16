import { Bot, HelpCircle, SquarePenIcon } from "lucide-react";
import { useState } from "react";
import { Link, matchPath, useLocation, useParams } from "react-router";
import { Chat, useRoomSearchShortcut } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import {
	Separator,
	Sidebar,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@semoss/ui/next";
import { AppLogo } from "@/features/navigation/app-logo";
import { GlobalNavItem } from "@/features/navigation/global-nav-item";
import { MobileNavigationClose } from "@/features/navigation/mobile-navigation-close";
import { NavUser } from "@/features/navigation/nav-user";
import { NavigationToggle } from "@/features/navigation/navigation-toggle";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

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
	const { t } = useTranslation("sidebar");
	const theme = usePlaygroundTheme();
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [helpOpen, setHelpOpen] = useState(false);
	const { open, openMobile, isMobile } = useSidebar();
	const hideChatHistory = !!theme.featureFlags?.hideChatHistory;
	// True when the sidebar is actually visible to the user.
	// Desktop: tracks the expand/collapse state (`open`).
	// Mobile: tracks the Sheet's open state (`openMobile`) — the Sheet
	// mounts hidden with 0-height, so we must avoid wiring infinite
	// scroll until the user opens it.
	const isVisible = (isMobile ? openMobile : open) && !hideChatHistory;
	const { pathname } = useLocation();
	const { roomId: activeRoomId } = useParams<{ roomId: string }>();

	useRoomSearchShortcut(setIsSearchOpen, !hideChatHistory);

	return (
		<>
			<Sidebar
				collapsible="offcanvas"
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
						{theme.featureFlags?.hideToolsInIframe &&
						isIframed ? null : (
							<>
								<SidebarMenuItem data-tour="tour-new-chat">
									<SidebarMenuButton
										asChild
										isActive={!!matchPath("/new", pathname)}
										tooltip={{
											children: t("nav.newChat.tooltip"),
											hidden: false,
										}}
									>
										<Link
											to={"/new"}
											aria-label={"New Chat"}
										>
											<SquarePenIcon />
											{t("nav.newChat.label")}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>

								{theme.featureFlags?.enableAgent && (
									<SidebarMenuItem>
										<SidebarMenuButton
											asChild
											isActive={
												!!matchPath("/agent", pathname)
											}
											tooltip={{
												children:
													t("nav.agents.tooltip"),
												hidden: false,
											}}
										>
											<Link
												to={"/agent"}
												aria-label={"agent"}
											>
												<Bot />
												{t("nav.agents.label")}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)}

								{theme.sidebar.headerItems.map(
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
					<Chat.RoomList
						isVisible={isVisible}
						activeRoomId={activeRoomId}
						onSearch={() => setIsSearchOpen(true)}
					/>
				)}
				<SidebarFooter>
					<Separator className="group-data-[collapsible=icon]:hidden" />
					<SidebarMenu className="gap-2 p-2">
						{theme.sidebar.footerItems.length > 0 && (
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
											{theme.sidebar.footerItems.map(
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
			</Sidebar>

			<Chat.RoomSearch
				open={isSearchOpen}
				onOpenChange={setIsSearchOpen}
			/>
		</>
	);
};
