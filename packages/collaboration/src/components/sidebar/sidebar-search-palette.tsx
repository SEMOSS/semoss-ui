import {
	House,
	MessageSquare,
	MessageSquarePlus,
	Settings,
	UserPlus,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	Spinner,
} from "@semoss/ui/next";
import { parseTimestamp } from "@semoss/utility";
import { agentNewPath, agentPath, newRoomPath } from "@/lib/workspace-paths";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { AccessibleCommandLabel } from "./accessible-command-label";
import {
	getSidebarRoomStatus,
	type SidebarRoomStatus,
} from "./sidebar-room-status";

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

interface RoomPaletteItem {
	room: Session;
	description: string;
	status: SidebarRoomStatus | null;
	searchValue: string;
}

interface SidebarSearchPaletteProps {
	/** Whether the search palette is visible. */
	open: boolean;
	/** Updates the palette's controlled visibility. */
	onOpenChange: (open: boolean) => void;
	/** Agents used to identify the owner of each room. */
	agents: Agent[];
	/** All rooms currently loaded for the workspace. */
	sessions: Session[];
	/** Whether workspace navigation data is still loading. */
	isLoading: boolean;
	/** Opens the selected application route. */
	onRouteVisited: (path: string) => void;
	/** Opens the selected room. */
	onRoomVisited: (roomId: string) => void;
}

/** Centered search across navigable collaboration routes and loaded rooms. */
export function SidebarSearchPalette({
	open,
	onOpenChange,
	agents,
	sessions,
	isLoading,
	onRouteVisited,
	onRoomVisited,
}: SidebarSearchPaletteProps) {
	const [search, setSearch] = useState("");
	const query = search.trim();
	const roomResults = useMemo((): RoomPaletteItem[] => {
		const agentsById = new Map(agents.map((agent) => [agent.id, agent]));

		return [...sessions]
			.sort(
				(first, second) =>
					(parseTimestamp(second.updatedAt) ?? 0) -
						(parseTimestamp(first.updatedAt) ?? 0) ||
					first.title.localeCompare(second.title, undefined, {
						sensitivity: "base",
					}) ||
					first.id.localeCompare(second.id),
			)
			.map((room): RoomPaletteItem => {
				const agentName = agentsById.get(room.agentId)?.name ?? null;
				const preview = room.preview.trim();
				const status = getSidebarRoomStatus(room);
				const description = [agentName, preview]
					.filter((value): value is string => Boolean(value))
					.join(" · ");

				return {
					room,
					description,
					status,
					searchValue: [
						room.id,
						room.title,
						preview,
						agentName,
						room.status,
						status?.label,
						status?.keywords,
					]
						.filter((value): value is string => Boolean(value))
						.join(" "),
				};
			});
	}, [agents, sessions]);

	function handleOpenChange(nextOpen: boolean): void {
		onOpenChange(nextOpen);
		if (!nextOpen) setSearch("");
	}

	function handleRouteSelect(path: string): void {
		handleOpenChange(false);
		onRouteVisited(path);
	}

	function handleRoomSelect(roomId: string): void {
		handleOpenChange(false);
		onRoomVisited(roomId);
	}

	return (
		<CommandDialog
			open={open}
			onOpenChange={handleOpenChange}
			title="Search"
			description="Search collaboration pages, actions, and rooms."
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
				<CommandEmpty>
					{isLoading && sessions.length === 0
						? "Loading rooms…"
						: "No routes or rooms found."}
				</CommandEmpty>
				<CommandGroup heading="Routes">
					{SEARCH_ROUTES.map((route) => {
						const Icon = route.icon;
						return (
							<CommandItem
								key={route.path}
								value={`${route.name} ${route.description} ${route.path} ${route.aliases}`}
								onSelect={() => handleRouteSelect(route.path)}
							>
								<span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
									<Icon
										className="size-3.5"
										aria-hidden="true"
									/>
								</span>
								<span className="min-w-0 flex-1 truncate text-sm">
									<span className="font-medium">
										{route.name}
									</span>
									<span className="text-muted-foreground">
										{" · "}
										{route.description}
									</span>
								</span>
							</CommandItem>
						);
					})}
				</CommandGroup>
				{roomResults.length > 0 ? (
					<CommandGroup heading="Rooms">
						{roomResults.map((item) => (
							<CommandItem
								key={item.room.id}
								value={`room ${item.searchValue}`}
								onSelect={() => handleRoomSelect(item.room.id)}
							>
								<span
									className={cn(
										"flex size-6 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground",
										item.status?.className,
									)}
								>
									{item.status?.icon ?? (
										<MessageSquare
											className="size-3.5"
											aria-hidden="true"
										/>
									)}
								</span>
								<span className="min-w-0 flex-1 truncate text-sm">
									<span className="font-medium">
										{item.room.title}
									</span>
									{item.description ? (
										<span className="text-muted-foreground">
											{" · "}
											{item.description}
										</span>
									) : null}
								</span>
								{item.status ? (
									<span
										className={cn(
											"shrink-0 text-xs",
											item.status.className,
										)}
									>
										{item.status.label}
									</span>
								) : null}
							</CommandItem>
						))}
					</CommandGroup>
				) : query ? null : (
					<CommandGroup heading="Rooms" forceMount>
						<div
							className="flex items-center gap-2 px-3 py-3 text-muted-foreground text-sm"
							role={isLoading ? "status" : undefined}
						>
							{isLoading ? (
								<>
									<Spinner
										className="size-4"
										aria-hidden="true"
									/>
									Loading rooms…
								</>
							) : (
								"No rooms yet."
							)}
						</div>
					</CommandGroup>
				)}
			</CommandList>
		</CommandDialog>
	);
}
