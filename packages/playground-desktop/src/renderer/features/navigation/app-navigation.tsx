import {
	ChevronsUpDownIcon,
	LogOutIcon,
	SettingsIcon,
	SquarePenIcon,
} from "lucide-react";
import { Link, useMatch } from "react-router";
import { RoomHistory } from "@semoss/chat";
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
} from "@semoss/ui/next";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/** Props for {@link AppNavigation}. */
interface AppNavigationProps {
	/** Open the settings dialog, where the saved servers are. */
	onOpenSettings: () => void;
}

/**
 * The app's sidebar: New chat, the user's chats with their search (⌘K or
 * Ctrl+K) unless the server's theme hides the chat history, and the account
 * menu with Settings (where the saved servers are) and Sign out.
 */
export const AppNavigation = ({ onOpenSettings }: AppNavigationProps) => {
	const { t } = useTranslation(["desktop", "sidebar"]);
	const roomMatch = useMatch("/room/:roomId");
	const isNewChat = !!useMatch("/new");
	const userName = useSession((state) => state.user?.name) ?? "";
	const logout = useSession((state) => state.logout);
	const theme = usePlaygroundTheme();
	const hasChatHistory = !theme.featureFlags?.hideChatHistory;

	return (
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
			{hasChatHistory ? (
				<RoomHistory
					activeRoomId={roomMatch?.params.roomId}
					hasRoomDates={theme.sidebar.chatHistoryDate}
				/>
			) : (
				// keeps the account menu at the foot, where the list would push it
				<div className="flex-1" />
			)}
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
									onSelect={() => onOpenSettings()}
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
	);
};
