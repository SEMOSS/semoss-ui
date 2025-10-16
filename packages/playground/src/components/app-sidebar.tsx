import { MessageCirclePlusIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Link, matchPath, useLocation, useParams } from "react-router-dom";
import {
	Button,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import { AppLogo } from "./app-logo";
import { NavUser } from "./nav-user";

const ENABLE_AGENT = import.meta.env.VITE_ENABLE_AGENT === "true";

export const AppSidebar = observer(() => {
	const { chat } = useChat();
	const { setOpen } = useSidebar();

	const { pathname } = useLocation();
	const { roomId: activeRoomId } = useParams<{ roomId: string }>();

	return (
		<Sidebar variant="inset">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem className="2 flex items-center overflow-hidden">
						<SidebarMenuButton size="lg" asChild>
							<Link
								to={"/"}
								aria-label={"Go Home"}
								className="flex h-8 w-full flex-1 items-center text-sidebar-primary-foreground"
							>
								<AppLogo />
							</Link>
						</SidebarMenuButton>

						<Button
							className="invisible group-hover:visible"
							variant="ghost"
							size="icon"
							onClick={(event) => {
								event.stopPropagation();
								setOpen(false);
							}}
						>
							<XIcon />
							<span className="sr-only">Close Sidebar</span>
						</Button>
					</SidebarMenuItem>
				</SidebarMenu>

				<div className="p-1">
					<Button
						className="w-full bg-sidebar-primary text-sidebar-primary-foreground shadow-none"
						size="sm"
						variant="outline"
						asChild
					>
						<Link to={"/new"} aria-label={"New Chat"}>
							<MessageCirclePlusIcon />
							New
						</Link>
					</Button>
					{ENABLE_AGENT && (
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								isActive={!!matchPath("/agent", pathname)}
							>
								<Link to={"/agent"} aria-label={"Agents"}>
									Agents
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					)}
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Recents</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{chat.order.map((roomId) => {
								// get the room
								const room = chat.getRoom(roomId);

								// set the name of the room
								let name = "Untitled";
								if (room.metadata?.name) {
									name = room.metadata?.name;
								}

								return (
									<SidebarMenuItem key={roomId}>
										<SidebarMenuButton
											asChild
											isActive={activeRoomId === roomId}
										>
											<Link
												className="inline-block truncate"
												to={`/room/${roomId}`}
												aria-label={"Select a room"}
											>
												{name}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser />{" "}
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
});
