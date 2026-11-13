import { ChevronDown } from "lucide-react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import type { Room } from "../state/collaboration.types";

interface RoomSelectorProps {
	rooms: Room[];
	onRoomSelect: (roomId: string) => void;
	label?: string;
}

function formatActivityTime(timestamp: string): string {
	if (!timestamp) return "";
	const date = new Date(timestamp);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return date.toLocaleDateString();
}

export function RoomSelector({
	rooms,
	onRoomSelect,
	label = "Switch to chat",
}: RoomSelectorProps) {
	if (!rooms || rooms.length === 0) return null;

	return (
		<div className="mb-6">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button type="button" variant="outline" size="sm">
						{label}
						{rooms.length > 0 && (
							<span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 font-semibold text-primary-foreground text-xs">
								{rooms.length}
							</span>
						)}
						<ChevronDown
							aria-hidden="true"
							className="ml-2 h-4 w-4"
						/>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-56">
					<DropdownMenuLabel>
						{rooms.length} chat{rooms.length !== 1 ? "s" : ""}
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{rooms.map((room, idx) => (
						<DropdownMenuItem
							key={room.id}
							onSelect={() => onRoomSelect(room.id)}
							className="flex items-center justify-between gap-2 py-2"
						>
							<div className="flex min-w-0 items-center gap-2">
								{idx === 0 && (
									<span className="inline-block h-2 w-2 shrink-0 rounded-full bg-green-500" />
								)}
								<span className="truncate font-medium text-sm">
									{room.title || `Chat ${rooms.length - idx}`}
								</span>
							</div>
							<span className="shrink-0 text-muted-foreground text-xs">
								{formatActivityTime(room.lastActivity)}
							</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
