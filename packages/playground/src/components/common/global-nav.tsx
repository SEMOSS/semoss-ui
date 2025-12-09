import { ComputerIcon, Search, SquarePenIcon, TrashIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
	Link,
	matchPath,
	useLocation,
	useNavigate,
	useParams,
} from "react-router-dom";
import { useIteratorPixel } from "@semoss/sdk/react";
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
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
	useSidebar,
} from "@semoss/ui/next";
import { useChat, useRoot } from "@/hooks";
import { AppLogo } from "./app-logo";
import { GlobalNavItem } from "./global-nav-item";
import { NavUser } from "./nav-user";

const ENABLE_WORKSPACE = import.meta.env.VITE_ENABLE_WORKSPACE === "true";

/**
 * Renders a sidebar allowing users to navigate between pages
 *
 * @component
 */
export const GlobalNav = observer(() => {
	const { root } = useRoot();
	const [search, setSearch] = useState("");
	const { chat } = useChat();
	const { open } = useSidebar();
	const { pathname } = useLocation();
	const { roomId: activeRoomId } = useParams<{ roomId: string }>();
	const debouncedSearch = useDebouncedValue(search);

	const navigate = useNavigate();

	const getRooms = useIteratorPixel<
		{
			ROOM_ID: string;
			ROOM_NAME: string;
			DATE_CREATED: string;
			WORKSPACE_ID?: string;
		}[],
		{
			ROOM_ID: string;
			ROOM_NAME: string;
			DATE_CREATED: string;
			WORKSPACE_ID?: string;
		}
	>(
		(limit, offset) =>
			`GetUserConversationRooms ( ${debouncedSearch ? `search = "<encode>${debouncedSearch}</encode>", ` : ""} limit = ${limit} , offset = ${offset} , sort = [ "DESC" ] ) ;`,

		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < 25) {
				return -1;
			}

			return getRooms?.data?.length + response.length;
		},
		(response) => {
			return response;
		},
		{
			limit: 25,
		},
		[debouncedSearch],
	);

	/**
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getRooms.isLoading || !getRooms.hasMore,
		onNext: () => {
			getRooms.next();
		},
	});

	/**
	 * Effects
	 */
	useEffect(() => {
		// keep this counter
		chat.keys.roomCounter;
		getRooms.reset();
	}, [getRooms.reset, chat.keys.roomCounter]);

	return (
		<Sidebar
			collapsible="icon"
			variant="inset"
			className="h-full justify-between p-0 transition-[width] duration-200 ease-in-out"
		>
			<SidebarHeader>
				<SidebarMenu className="gap-1 transition-all duration-200 ease-in-out group-data-[collapsible=icon]:px-2">
					<SidebarMenuItem className="flex items-center overflow-hidden">
						<SidebarMenuButton size="lg" className="h-8" asChild>
							<Link
								to={"/"}
								aria-label={"Go Home"}
								className="flex h-12 w-full flex-1 items-center"
							>
								<AppLogo full={open} />
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>

				<SidebarMenu className="gap-2 p-2">
					<InputGroup className="bg-background group-data-[collapsible=icon]:hidden">
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
					{root.theme.sidebar.headerItems.map((item, index) => (
						<GlobalNavItem
							key={item.path}
							name={item.name}
							icon={item.icon}
							path={item.path}
							url={item.url}
							embed={item.embed}
						/>
					))}
					<SidebarMenuItem>&nbsp;</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent
				ref={(ele) => setScroll(ele)}
				className="transition-all duration-200 ease-in-out"
			>
				<SidebarGroup className="pl-4 transition-all duration-200 ease-in-out group-data-[collapsible=icon]:hidden">
					<SidebarGroupLabel className="truncate font-medium text-muted-foreground text-xs leading-normal">
						Recents
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{getRooms.isError && (
								<div className="px-2 py-4 text-center text-destructive text-sm">
									Error loading rooms
								</div>
							)}
							{getRooms.data.map((room) => {
								const roomId = room.ROOM_ID;
								const name = room.ROOM_NAME || "Untitled";

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
												aria-label={"Select room"}
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
																navigate("/");
															}

															// Refetch rooms after deletion
															getRooms.reset();
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
							{!getRooms.isLoading &&
								getRooms.data.length === 0 && (
									<div className="px-2 py-4 text-center text-muted-foreground text-xs">
										No rooms found
									</div>
								)}
							{getRooms.isLoading && (
								<div className="flex items-center justify-center py-4">
									<Spinner className="size-4" />
								</div>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu className="gap-2 px-2 pt-2">
					{root.theme.sidebar.footerItems.map((item) => (
						<GlobalNavItem
							key={item.path}
							name={item.name}
							icon={item.icon}
							path={item.path}
							url={item.url}
							embed={item.embed}
						/>
					))}
				</SidebarMenu>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
});
