import type { ReactNode } from "react";
import {
	Button,
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { formatDateToRelative } from "@semoss/utility/date";
import type { AgentRunRoom } from "@/api/agent-runs";
import { AgentRoomDetailLine } from "./agent-room-detail-line";
import { AgentRoomStatus } from "./agent-room-status";

/** A column a page adds after the room, such as its agent or its user */
export interface AgentRoomColumn {
	/** The column's heading */
	header: string;
	/** What a room shows in the column */
	cell: (room: AgentRunRoom) => ReactNode;
	/** Classes for the column's cells, such as a width */
	className?: string;
}

export interface AgentRoomTableProps {
	/** The rooms listed, most recently active first */
	rooms: AgentRunRoom[];
	/** More columns after the room */
	columns?: AgentRoomColumn[];
	/** Opens a room's runs */
	onOpen: (room: AgentRunRoom) => void;
	/** Describes the table for screen readers */
	caption: string;
}

/** A room's key: the room and its user, by login type and id */
export const agentRoomKey = (room: AgentRunRoom): string =>
	`${room.roomId}:${room.userType ?? ""}:${room.userId}`;

/**
 * Rooms with agent runs: the room with its id under its name, any columns the
 * page adds, how many runs it holds and how they stand, and when it was last
 * active.
 */
export const AgentRoomTable = ({
	rooms,
	columns = [],
	onOpen,
	caption,
}: AgentRoomTableProps) => (
	<Table>
		<TableCaption className="sr-only">{caption}</TableCaption>
		<TableHeader>
			<TableRow>
				<TableHead>Room</TableHead>
				{columns.map((column) => (
					<TableHead key={column.header}>{column.header}</TableHead>
				))}
				<TableHead className="text-right">Runs</TableHead>
				<TableHead>Status</TableHead>
				<TableHead>Last activity</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{rooms.map((room) => (
				<TableRow key={agentRoomKey(room)}>
					<TableCell className="max-w-72">
						<span className="flex min-w-0 flex-col items-start">
							<Button
								type="button"
								variant="link"
								className="h-auto max-w-full justify-start p-0"
								title={room.roomName ?? undefined}
								onClick={() => onOpen(room)}
								data-room-key={agentRoomKey(room)}
								data-testid={`agentRoomTable-open-${room.roomId}`}
							>
								<span className="truncate">
									{room.roomName ?? "Untitled room"}
								</span>
							</Button>
							<AgentRoomDetailLine
								className="max-w-full"
								title={`id: ${room.roomId}`}
							>
								id: {room.roomId}
							</AgentRoomDetailLine>
						</span>
					</TableCell>
					{columns.map((column) => (
						<TableCell
							key={column.header}
							className={column.className}
						>
							{column.cell(room)}
						</TableCell>
					))}
					<TableCell className="text-right tabular-nums">
						{room.runCount}
					</TableCell>
					<TableCell>
						<AgentRoomStatus
							activeRunCount={room.activeRunCount}
							failedRunCount={room.failedRunCount}
							isClosed={room.isClosed}
						/>
					</TableCell>
					<TableCell
						className="whitespace-nowrap text-muted-foreground text-sm"
						title={room.lastActivityAt ?? undefined}
					>
						{room.lastActivityAt
							? formatDateToRelative(room.lastActivityAt)
							: "N/A"}
					</TableCell>
				</TableRow>
			))}
		</TableBody>
	</Table>
);
