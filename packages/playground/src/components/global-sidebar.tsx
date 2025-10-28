import {
	ComputerIcon,
	MessageCirclePlusIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Link,
	matchPath,
	NavLink,
	useLocation,
	useParams,
} from "react-router-dom";
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
	SidebarSeparator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useSidebar,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import { AppLogo } from "./app-logo";
import { NavUser } from "./nav-user";

const ENABLE_AGENT = import.meta.env.VITE_ENABLE_AGENT === "true";

export const GlobalSidebar = observer(() => {
	const { chat } = useChat();
	const { setOpen } = useSidebar();

	const { pathname } = useLocation();
	const { roomId: activeRoomId } = useParams<{ roomId: string }>();

	return (
		<Sidebar variant="inset">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem className="group/logo flex items-center overflow-hidden">
						<SidebarMenuButton size="lg" asChild>
							<Link
								to={"/"}
								aria-label={"Go Home"}
								className="flex h-8 w-full flex-1 items-center"
							>
								<AppLogo />
							</Link>
						</SidebarMenuButton>

						<Button
							className="invisible group-hover/logo:visible"
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

				<SidebarMenu className="gap-2 p-2">
					<Button
						className="w-full bg-sidebar-primary text-sidebar-primary-foreground shadow-none"
						size="sm"
						variant="outline"
						asChild
					>
						<NavLink
							to={"/new"}
							aria-label={"New Chat"}
							className={({ isActive }) =>
								isActive ? "text-primary" : ""
							}
						>
							<MessageCirclePlusIcon />
							New
						</NavLink>
					</Button>

					{ENABLE_AGENT && (
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								isActive={!!matchPath("/agent", pathname)}
							>
								<Link to={"/agent"} aria-label={"Agents"}>
									<ComputerIcon />
									Agents
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					)}
				</SidebarMenu>
				<SidebarSeparator />
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
									<SidebarMenuItem
										key={roomId}
										className="group/room flex"
									>
										<SidebarMenuButton
											asChild
											isActive={activeRoomId === roomId}
										>
											<Link
												className="inline-block flex-1 truncate"
												to={`/room/${roomId}`}
												aria-label={"Select a room"}
											>
												{name}
											</Link>
										</SidebarMenuButton>
										<Tooltip>
											<TooltipTrigger asChild>
												<span>
													<Button
														className="hidden group-hover/room:inline-flex"
														variant="ghost"
														size="icon-sm"
														onClick={async (e) => {
															e.stopPropagation();

															try {
																await chat.closeRoom(
																	roomId,
																);

																toast.success(
																	"Room deleted successfully",
																);
															} catch (e) {
																toast.error(
																	e.message,
																);
															}
														}}
													>
														<TrashIcon className="text-destructive" />
													</Button>
												</span>
											</TooltipTrigger>
											<TooltipContent>
												Delete Room
											</TooltipContent>
										</Tooltip>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarSeparator />
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
});
