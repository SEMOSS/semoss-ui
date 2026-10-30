import { Lock } from "lucide-react";
import { Badge } from "@semoss/ui/next";

export interface AgentRoomStatusProps {
	/** Runs not yet finished: submitted, running or waiting for input */
	activeRunCount: number;
	/** Runs that failed */
	failedRunCount: number;
	/** Whether the room is closed, so no agent runs in it again */
	isClosed?: boolean;
}

/**
 * How a room's runs stand: whether the room is closed, how many runs are still
 * going and how many failed, or that every run has finished.
 */
export const AgentRoomStatus = ({
	activeRunCount,
	failedRunCount,
	isClosed = false,
}: AgentRoomStatusProps) => {
	if (!isClosed && activeRunCount === 0 && failedRunCount === 0) {
		return <Badge variant="secondary">Finished</Badge>;
	}
	return (
		<span className="flex flex-wrap gap-1">
			{isClosed ? (
				<Badge variant="secondary">
					<Lock aria-hidden="true" />
					Closed
				</Badge>
			) : null}
			{activeRunCount > 0 ? (
				<Badge variant="outline">{activeRunCount} in progress</Badge>
			) : null}
			{failedRunCount > 0 ? (
				<Badge variant="destructive">{failedRunCount} failed</Badge>
			) : null}
		</span>
	);
};
