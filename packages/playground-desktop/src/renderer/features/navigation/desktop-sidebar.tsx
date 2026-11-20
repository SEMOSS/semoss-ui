import {
	ChevronsUpDownIcon,
	LogOutIcon,
	SettingsIcon,
	SquarePenIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useMatch } from "react-router";
import {
	RoomList,
	RoomSearchDialog,
	useChatConfig,
	useRoomSearchShortcut,
} from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { useSession } from "@semoss/sdk/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Sidebar,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@semoss/ui/next";

/**
 * The app's sidebar: New chat, the user's chats with their search (⌘K or
 * Ctrl+K), and the account menu with Settings (where the saved servers are)
 * and Sign out.
 */
export const DesktopSidebar = () => {
	const { t } = useTranslation(["desktop", "sidebar"]);
	const { onOpenSettings } = useChatConfig().callbacks;
	const { open, openMobile, isMobile } = useSidebar();
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const roomMatch = useMatch("/room/:roomId");
	const isNewChat = !!useMatch("/new");
	const userName = useSession((state) => state.user?.name) ?? "";
	const logout = useSession((state) => state.logout);

	useRoomSearchShortcut(setIsSearchOpen);

	return (
		<>
			<Sidebar
				collapsible="offcanvas"
				variant="inset"
				className="z-30 h-full p-0"
			>
				<SidebarHeader>
					<SidebarMenu className="p-2">
						<SidebarMenuItem>
							<SidebarMenuButton asChild isActive={isNewChat}>
								<Link to="/new">
									<SquarePenIcon aria-hidden />
									{t("nav.newChat")}
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				{/* the list only loads and pages while the sidebar shows */}
				<RoomList
					isVisible={isMobile ? openMobile : open}
					activeRoomId={roomMatch?.params.roomId}
					onSearch={() => setIsSearchOpen(true)}
				/>
				<SidebarFooter>
					<SidebarMenu className="p-2">
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton
										aria-label={t("account.menu")}
									>
										<span className="min-w-0 flex-1 truncate">
											{userName}
										</span>
										<ChevronsUpDownIcon
											aria-hidden
											className="ms-auto"
										/>
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side="top"
									align="start"
									className="w-56"
								>
									<DropdownMenuItem
										onSelect={() => onOpenSettings?.()}
									>
										<SettingsIcon aria-hidden />
										{t("sidebar:userMenu.settings")}
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={() => void logout()}
									>
										<LogOutIcon aria-hidden />
										{t("account.signOut")}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>
			<RoomSearchDialog
				open={isSearchOpen}
				onOpenChange={setIsSearchOpen}
			/>
		</>
	);
};
