import { Bot, HelpCircle, SquarePenIcon } from "lucide-react";
import { useState } from "react";
import { Link, matchPath, useLocation, useParams } from "react-router";
import { RoomHistory } from "@semoss/chat";
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
import { isIframed } from "@/features/navigation/is-iframed";
import { MobileNavigationClose } from "@/features/navigation/mobile-navigation-close";
import { NavigationItem } from "@/features/navigation/navigation-item";
import { NavigationToggle } from "@/features/navigation/navigation-toggle";
import { NavigationUserMenu } from "@/features/navigation/navigation-user-menu";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/** Props for {@link AppNavigation}. */
interface AppNavigationProps {
	/** Open the settings dialog, from the account menu. */
	onOpenSettings: () => void;
}

/**
 * The global navigation: the logo and toggle, new chat, agents and the
 * theme's header items, the room history unless the theme hides it, then the
 * theme's help items and the account menu.
 */
export const AppNavigation = ({ onOpenSettings }: AppNavigationProps) => {
	const { t } = useTranslation("sidebar");
	const theme = usePlaygroundTheme();
	const [isHelpOpen, setIsHelpOpen] = useState(false);
	const { open } = useSidebar();
	const hasChatHistory = !theme.featureFlags?.hideChatHistory;
	const { pathname } = useLocation();
	const { roomId: activeRoomId } = useParams<{ roomId: string }>();

	return (
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
								aria-label={t("nav.goHome")}
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
										aria-label={t("nav.newChat.ariaLabel")}
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
											children: t("nav.agents.tooltip"),
											hidden: false,
										}}
									>
										<Link
											to={"/agent"}
											aria-label={t("nav.agents.label")}
										>
											<Bot />
											{t("nav.agents.label")}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}

							{theme.sidebar.headerItems.map((item, index) => (
								<NavigationItem
									key={`header-${item.name}-${index}`}
									{...item}
								/>
							))}
						</>
					)}
				</SidebarMenu>
			</SidebarHeader>
			{hasChatHistory && (
				<RoomHistory
					activeRoomId={activeRoomId}
					hasRoomDates={theme.sidebar.chatHistoryDate}
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
							onMouseEnter={() => setIsHelpOpen(true)}
							onMouseLeave={() => setIsHelpOpen(false)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
								}
							}}
							onClick={() => setIsHelpOpen((prev) => !prev)}
						>
							<SidebarMenuItem>
								<SidebarMenuButton>
									<HelpCircle />
									{t("nav.help")}
								</SidebarMenuButton>
							</SidebarMenuItem>
							{isHelpOpen && (
								<div className="absolute start-0 bottom-full z-50 w-full rounded-md border bg-popover p-1 shadow-md">
									<SidebarMenu>
										{theme.sidebar.footerItems.map(
											(item) => (
												<NavigationItem
													key={item.path}
													{...item}
												/>
											),
										)}
									</SidebarMenu>
								</div>
							)}
						</div>
					)}
					<SidebarMenuItem>
						<NavigationUserMenu onOpenSettings={onOpenSettings} />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
};
