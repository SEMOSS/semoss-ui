import {
	ComputerIcon,
	Search,
	SquarePenIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
	Link,
	matchPath,
	useLocation,
	useNavigate,
	useParams,
} from "react-router-dom";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useSidebar,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import { AppLogo } from "./app-logo";
import { NavUser } from "./nav-user";

const ENABLE_WORKSPACE = import.meta.env.VITE_ENABLE_WORKSPACE === "true";

/**
 * Renders a sidebar allowing users to navigate between pages
 *
 * @component
 */
export const GlobalNav = observer(() => {
	/**
	 * State
	 */
	const [search, setSearch] = useState("");

	/**
	 * Library hooks
	 */
	const { chat } = useChat();
	const { setOpen } = useSidebar();
	const { pathname } = useLocation();
	const { roomId: activeRoomId } = useParams<{ roomId: string }>();
	const debouncedSearch = useDebouncedValue(search);
	const getRooms = usePixel<
		{
			ROOM_ID: string;
			ROOM_NAME: string;
			DATE_CREATED: string;
			WORKSPACE_ID?: string;
		}[]
	>(
		`GetUserConversationRooms ( ${debouncedSearch ? `search = "<encode>${debouncedSearch}</encode>", ` : ""}limit = 25 , offset = 0 , sort = [ "DESC" ] ) ;`,
	);
	const navigate = useNavigate();

	/**
	 * Effects
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: chat.keys.roomCounter triggers refresh
	useEffect(() => {
		getRooms.refresh();
	}, [getRooms.refresh, chat.keys.roomCounter]);

	return (
		<Sidebar variant="inset" className="p-0">
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
					<InputGroup className="bg-background">
						<InputGroupInput
							placeholder="Search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>

					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={!!matchPath("/new", pathname)}
						>
							<Link to={"/new"} aria-label={"New Chat"}>
								<SquarePenIcon />
								New
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>

					{ENABLE_WORKSPACE && (
						<SidebarMenuItem>
							<SidebarMenuButton
								asChild
								isActive={!!matchPath("/workspace", pathname)}
							>
								<Link
									to={"/workspace"}
									aria-label={"Workspace"}
								>
									<ComputerIcon />
									Workspaces
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					)}
					<SidebarMenuItem>&nbsp;</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="truncate font-medium text-muted-foreground text-xs leading-normal">
						Recents
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{getRooms.status === "LOADING" && (
								<div className="px-2 py-4 text-center text-muted-foreground text-xs">
									Loading
								</div>
							)}
							{getRooms.status === "ERROR" && (
								<div className="px-2 py-4 text-center text-destructive text-sm">
									Error loading rooms
								</div>
							)}
							{getRooms.status === "SUCCESS" &&
								getRooms.data &&
								getRooms.data.map((room) => {
									const roomId = room.ROOM_ID;
									const name = room.ROOM_NAME || "Untitled";

									return (
										<SidebarMenuItem
											key={roomId}
											className="group/room flex"
										>
											<SidebarMenuButton
												asChild
												isActive={
													activeRoomId === roomId
												}
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
																if (
																	activeRoomId ===
																	roomId
																) {
																	navigate(
																		"/",
																	);
																}

																// Refetch rooms after deletion
																getRooms.refresh();
															} catch (e) {
																toast.error(
																	e.message,
																);
															}
														}}
													>
														<TrashIcon className="text-destructive" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													Delete Room
												</TooltipContent>
											</Tooltip>
										</SidebarMenuItem>
									);
								})}
							{getRooms.status === "SUCCESS" &&
								(!getRooms.data ||
									getRooms.data.length === 0) && (
									<div className="px-2 py-4 text-center text-muted-foreground text-xs">
										No rooms found
									</div>
								)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
});
