import type { ReactNode } from "react";
import { cn } from "@semoss/ui/next";
import { formatDateToRelative } from "@semoss/utility/date";
import type { AgentRunRoom } from "@/api/agent-runs";
import { type AgentActivityRun, isActiveStatus } from "./agent-activity-types";
import { AgentRoomDetailLine } from "./agent-room-detail-line";
import { AgentRoomStatus } from "./agent-room-status";

/** One labeled fact in a room's summary */
export interface AgentRoomSummaryItem {
	label: string;
	value: ReactNode;
}

export interface AgentRoomSummaryProps {
	/** The room, as the list has it */
	room: AgentRunRoom;
	/**
	 * The room's runs as last read; before they load, the list's counts are
	 * shown
	 */
	runs: AgentActivityRun[] | null;
	/** Whether the room is closed, so no agent runs in it again */
	isClosed: boolean;
	/** Who and what the room belongs to, shown before its runs */
	items?: AgentRoomSummaryItem[];
}

/** How a room's runs stand, from its runs once they are read */
interface RoomRunCounts {
	runCount: number;
	activeRunCount: number;
	failedRunCount: number;
	lastActivityAt: string | null;
}

/**
 * Counts a room's runs and finds when it was last active. The backend's
 * timestamps share one format, so they sort as text.
 *
 * @param runs - The room's runs.
 * @returns The counts and the latest time any run started, ended or was made.
 */
const countRuns = (runs: AgentActivityRun[]): RoomRunCounts => {
	let lastActivityAt: string | null = null;
	let activeRunCount = 0;
	let failedRunCount = 0;
	for (const run of runs) {
		if (isActiveStatus(run.status)) {
			activeRunCount++;
		} else if (run.status === "FAILED") {
			failedRunCount++;
		}
		const time = run.completedAt || run.startedAt || run.dateCreated;
		if (time && (!lastActivityAt || time > lastActivityAt)) {
			lastActivityAt = time;
		}
	}
	return {
		runCount: runs.length,
		activeRunCount,
		failedRunCount,
		lastActivityAt,
	};
};

/**
 * How a room stands: any facts the page adds, such as its user and agent, then
 * its runs and whether it is closed, and when it was last active, as one
 * labeled row that wraps on narrow screens.
 */
export const AgentRoomSummary = ({
	room,
	runs,
	isClosed,
	items = [],
}: AgentRoomSummaryProps) => {
	const counts: RoomRunCounts = runs
		? countRuns(runs)
		: {
				runCount: room.runCount,
				activeRunCount: room.activeRunCount,
				failedRunCount: room.failedRunCount,
				lastActivityAt: room.lastActivityAt,
			};

	const allItems: AgentRoomSummaryItem[] = [
		...items,
		{
			label: "Runs",
			value: (
				<span className="flex flex-wrap items-center gap-2">
					<span className="font-medium text-sm tabular-nums">
						{counts.runCount}{" "}
						{counts.runCount === 1 ? "run" : "runs"}
					</span>
					<AgentRoomStatus
						activeRunCount={counts.activeRunCount}
						failedRunCount={counts.failedRunCount}
						isClosed={isClosed}
					/>
				</span>
			),
		},
		{
			label: "Last activity",
			value: (
				<span className="flex min-w-0 flex-col">
					<span
						className="truncate font-medium text-sm"
						title={counts.lastActivityAt ?? undefined}
					>
						{counts.lastActivityAt
							? formatDateToRelative(counts.lastActivityAt)
							: "N/A"}
					</span>
					{room.firstRunAt ? (
						<AgentRoomDetailLine title={room.firstRunAt}>
							Started {formatDateToRelative(room.firstRunAt)}
						</AgentRoomDetailLine>
					) : null}
				</span>
			),
		},
	];

	return (
		<dl
			className={cn(
				"grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2",
				allItems.length > 2 && "xl:grid-cols-4",
			)}
		>
			{allItems.map((item) => (
				<div key={item.label} className="flex min-w-0 flex-col gap-1.5">
					<dt className="text-muted-foreground text-xs">
						{item.label}
					</dt>
					<dd className="flex min-w-0 flex-1 flex-col justify-center">
						{item.value}
					</dd>
				</div>
			))}
		</dl>
	);
};
