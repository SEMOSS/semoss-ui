import {
	ArrowLeftRightIcon,
	ChevronsUpDownIcon,
	LogOutIcon,
	ServerIcon,
	SquarePenIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, useMatch, useNavigate } from "react-router";
import {
	RoomList,
	RoomSearchDialog,
	useRoomSearchShortcut,
} from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { useSession } from "@semoss/sdk/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
	Sidebar,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	toast,
	useSidebar,
} from "@semoss/ui/next";
import { getDesktopBridge } from "@/features/desktop-bridge/desktop-bridge";
import { useSavedServers } from "@/features/server-connection/use-saved-servers";
import { formatServerAddress } from "../../../contract/server-connection";

/**
 * The app's sidebar: New chat, the user's chats with their search (⌘K or
 * Ctrl+K), and the account menu with Switch server (when more than one is
 * saved), Change server, and Sign out.
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
	const { saved } = useSavedServers();
	const servers = saved?.servers ?? [];

	/**
	 * Open the window on another saved server, which keeps its own sign in.
	 *
	 * @param address - The server's address, as the menu lists it.
	 */
	const handleSwitch = async (address: string): Promise<void> => {
		const server = servers.find(
			(item) => formatServerAddress(item) === address,
		);
		if (!server) return;
		try {
			await getDesktopBridge().invoke("server-connection:set", server);
		} catch (error) {
			toast.error(
				t("servers.failed", {
					message:
						error instanceof Error ? error.message : String(error),
				}),
			);
		}
	};

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
									{servers.length > 1 ? (
										<DropdownMenuSub>
											<DropdownMenuSubTrigger>
												<ArrowLeftRightIcon
													aria-hidden
												/>
												{t("account.switchServer")}
											</DropdownMenuSubTrigger>
											<DropdownMenuSubContent className="max-w-80">
												<DropdownMenuRadioGroup
													value={
														saved?.active
															? formatServerAddress(
																	saved.active,
																)
															: ""
													}
													onValueChange={(address) =>
														void handleSwitch(
															address,
														)
													}
												>
													{servers.map((server) => {
														const address =
															formatServerAddress(
																server,
															);
														return (
															<DropdownMenuRadioItem
																key={address}
																value={address}
																className="break-all"
															>
																{address}
															</DropdownMenuRadioItem>
														);
													})}
												</DropdownMenuRadioGroup>
											</DropdownMenuSubContent>
										</DropdownMenuSub>
									) : null}
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
			<RoomSearchDialog
				open={isSearchOpen}
				onOpenChange={setIsSearchOpen}
			/>
		</>
	);
};
