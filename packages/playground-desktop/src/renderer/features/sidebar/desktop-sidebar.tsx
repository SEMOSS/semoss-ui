import {
	ChevronsUpDownIcon,
	LogOutIcon,
	ServerIcon,
	SquarePenIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useMatch, useNavigate } from "react-router";
import { Chat } from "@semoss/chat";
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
 * Ctrl+K), and the account menu with Change server and Sign out.
 */
export const DesktopSidebar = () => {
	const { t } = useTranslation("desktop");
	const { open, openMobile, isMobile } = useSidebar();
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const navigate = useNavigate();
	const roomMatch = useMatch("/room/:roomId");
	const isNewChat = !!useMatch("/new");
	const userName = useSession((state) => state.user?.name) ?? "";
	const logout = useSession((state) => state.logout);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.key.toLowerCase() === "k" &&
				(event.metaKey || event.ctrlKey) &&
				!event.altKey &&
				!event.shiftKey
			) {
				event.preventDefault();
				setIsSearchOpen(true);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

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
				<Chat.RoomList
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
										onSelect={() => navigate("/server")}
									>
										<ServerIcon aria-hidden />
										{t("account.changeServer")}
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
			<Chat.RoomSearch
				open={isSearchOpen}
				onOpenChange={setIsSearchOpen}
			/>
		</>
	);
};
