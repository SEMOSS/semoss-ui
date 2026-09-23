import {
	House,
	MessageSquarePlus,
	Settings,
	UserPlus,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	CommandDialog,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Spinner,
	useDebouncedValue,
	useSidebar,
} from "@semoss/ui/next";
import { toError } from "@semoss/utility";
import {
	type RoomContentMatch,
	searchRoomMessages,
} from "@/features/rooms/api/search-room-messages";
import {
	agentNewPath,
	agentPath,
	newRoomPath,
	roomPath,
} from "@/lib/workspace-paths";
import { AccessibleCommandLabel } from "./accessible-command-label";

const SEARCH_ROUTES = [
	{
		name: "Home",
		description: "Open the workspace home page",
		path: "/",
		aliases: "overview workspace dashboard",
		icon: House,
	},
	{
		name: "New Room",
		description: "Start a new room",
		path: newRoomPath(),
		aliases: "create chat session conversation",
		icon: MessageSquarePlus,
	},
	{
		name: "Agents",
		description: "Browse all agents",
		path: agentPath(),
		aliases: "assistants workspaces directory",
		icon: Users,
	},
	{
		name: "New Agent",
		description: "Create an agent",
		path: agentNewPath(),
		aliases: "new assistant workspace",
		icon: UserPlus,
	},
	{
		name: "Settings",
		description: "Open workspace settings",
		path: "/settings",
		aliases: "account profile preferences",
		icon: Settings,
	},
] as const;

interface SidebarSearchPaletteProps {
	/** Whether the search palette is visible. */
	open: boolean;
	/** Closes the controlled search palette. */
	onClose: () => void;
}

type RoomSearchState =
	| { status: "idle" }
	| { status: "loading"; query: string }
	| { status: "success"; query: string; rooms: RoomContentMatch[] }
	| { status: "error"; query: string; error: Error };

const IDLE_ROOM_SEARCH: RoomSearchState = { status: "idle" };

/** Centered search across collaboration routes and backend room content. */
export function SidebarSearchPalette({
	open,
	onClose,
}: SidebarSearchPaletteProps) {
	const navigate = useNavigate();
	const { actions } = useInsight();
	const { isMobile, setOpenMobile } = useSidebar();
	const [search, setSearch] = useState("");
	const query = search.trim();
	const debouncedQuery = useDebouncedValue(query);
	const [retryToken, setRetryToken] = useState(0);
	const [roomSearch, setRoomSearch] =
		useState<RoomSearchState>(IDLE_ROOM_SEARCH);
	const routeResults = useMemo(() => {
		const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
		if (terms.length === 0) return SEARCH_ROUTES;

		return SEARCH_ROUTES.filter((route) => {
			const routeText = [
				route.name,
				route.description,
				route.path,
				route.aliases,
			]
				.join(" ")
				.toLocaleLowerCase();
			return terms.every((term) => routeText.includes(term));
		});
	}, [query]);

	useEffect(() => {
		if (open) return;
		setSearch("");
		setRoomSearch(IDLE_ROOM_SEARCH);
	}, [open]);

	useEffect(() => {
		void retryToken;
		if (!open || !debouncedQuery) return;

		let cancelled = false;
		setRoomSearch({ status: "loading", query: debouncedQuery });
		void searchRoomMessages(actions, debouncedQuery)
			.then((rooms) => {
				if (cancelled) return;
				setRoomSearch({
					status: "success",
					query: debouncedQuery,
					rooms,
				});
			})
			.catch((cause: unknown) => {
				if (cancelled) return;
				setRoomSearch({
					status: "error",
					query: debouncedQuery,
					error: toError(cause),
				});
			});

		return () => {
			cancelled = true;
		};
	}, [actions, debouncedQuery, open, retryToken]);

	const activeRoomSearch =
		roomSearch.status !== "idle" && roomSearch.query === query
			? roomSearch
			: null;
	const isSearchingRooms =
		query.length > 0 &&
		(query !== debouncedQuery ||
			activeRoomSearch === null ||
			activeRoomSearch.status === "loading");
	const roomResults =
		activeRoomSearch?.status === "success" ? activeRoomSearch.rooms : [];
	const roomSearchError =
		activeRoomSearch?.status === "error" ? activeRoomSearch.error : null;

	function handleClose(): void {
		setSearch("");
		setRoomSearch(IDLE_ROOM_SEARCH);
		onClose();
	}

	function handleRouteSelect(path: string): void {
		handleClose();
		if (isMobile) setOpenMobile(false);
		navigate(path);
	}

	function handleRoomSelect(roomId: string): void {
		handleClose();
		if (isMobile) setOpenMobile(false);
		navigate(roomPath(roomId));
	}

	function handleRetry(): void {
		if (!query) return;
		setRoomSearch({ status: "loading", query });
		setRetryToken((current) => current + 1);
	}

	return (
		<CommandDialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) handleClose();
			}}
			title="Search"
			description="Search collaboration pages, actions, and room content."
			showCloseButton={false}
			className="border-input bg-card shadow-lg transition-[color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:max-w-lg [&_[data-slot=command-input-wrapper]]:h-10 [&_[data-slot=command-input]]:h-10 [&_[data-slot=command-item][cmdk-item]]:py-2 [&_[data-slot=command-item][cmdk-item]_svg]:size-3.5 [&_[data-slot=command]]:bg-card"
		>
			<AccessibleCommandLabel />
			<CommandInput
				aria-label="Search"
				placeholder="Search"
				value={search}
				onValueChange={setSearch}
			/>
			<CommandList className="max-h-80 p-1">
				{routeResults.length > 0 ? (
					<CommandGroup heading="Routes" forceMount>
						{routeResults.map((route) => {
							const Icon = route.icon;
							return (
								<CommandItem
									key={route.path}
									forceMount
									value={`${route.name} ${route.description} ${route.path} ${route.aliases}`}
									onSelect={() =>
										handleRouteSelect(route.path)
									}
								>
									<span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
										<Icon
											className="size-3.5"
											aria-hidden="true"
										/>
									</span>
									<span className="min-w-0 flex-1 truncate">
										<span className="text-sm">
											{route.name}
										</span>
										<span className="text-muted-foreground text-xs">
											{" · "}
											{route.description}
										</span>
									</span>
								</CommandItem>
							);
						})}
					</CommandGroup>
				) : null}
				{query ? (
					<CommandGroup heading="Rooms" forceMount>
						{isSearchingRooms ? (
							<output className="flex items-center gap-2 px-3 py-3 text-muted-foreground text-sm">
								<Spinner
									className="size-4"
									aria-hidden="true"
								/>
								Searching room content…
							</output>
						) : roomSearchError ? (
							<Alert variant="destructive" className="mx-2 my-1">
								<AlertDescription className="flex w-full items-center justify-between gap-2">
									<span>Could not search room content.</span>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleRetry}
									>
										Try again
									</Button>
								</AlertDescription>
							</Alert>
						) : roomResults.length > 0 ? (
							<>
								<output className="sr-only">
									{roomResults.length} matching rooms found.
								</output>
								{roomResults.map((item) => (
									<CommandItem
										key={item.roomId}
										forceMount
										value={`room-content ${item.roomId}`}
										onSelect={() =>
											handleRoomSelect(item.roomId)
										}
									>
										<span className="min-w-0 flex-1 truncate">
											<span className="text-sm">
												{item.roomName}
											</span>
											<span className="text-muted-foreground text-xs">
												{" · "}
												Room content match
											</span>
										</span>
									</CommandItem>
								))}
							</>
						) : (
							<output className="px-3 py-3 text-muted-foreground text-sm">
								{routeResults.length > 0
									? "No rooms with matching content."
									: "No routes or rooms found."}
							</output>
						)}
					</CommandGroup>
				) : null}
			</CommandList>
		</CommandDialog>
	);
}
