import { useEffect, useRef, useState } from "react";
import { toast } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { AgentRunRoom, AgentRunRoomClosure } from "@/api/agent-runs";
import {
	type AgentActivityRun,
	isActiveStatus,
	type RoomRunDetail,
} from "./agent-activity-types";
import type { AgentRoomExportDetail } from "./agent-room-markdown";
import {
	AgentRoomSummary,
	type AgentRoomSummaryItem,
} from "./agent-room-summary";
import { AgentRoomView } from "./agent-room-view";
import { CloseAgentRoomAction } from "./close-agent-room-action";
import {
	type AgentRoomRunsSource,
	useAgentRoomRuns,
} from "./use-agent-room-runs";

/**
 * How a page reads and closes a room: the user's own calls, from an agent's
 * Activity tab, or an admin's of any user's room, from the admin Agent Runs
 * page. Pass the same object each render, such as a module constant.
 */
export interface AgentRoomSource extends AgentRoomRunsSource {
	/** Every run the room's user has in it, newest first */
	fetchRoomRuns: (
		roomId: string,
		userId: string,
		userType: string | null,
	) => Promise<AgentActivityRun[]>;
	/** Closes the room and its subagents' rooms, stopping their runs */
	closeRoom: (
		roomId: string,
		userId: string,
		userType: string | null,
	) => Promise<AgentRunRoomClosure>;
}

export interface AgentRoomDetailProps {
	/** The room shown, as the list has it */
	room: AgentRunRoom;
	/** The one run to load first, such as from a link to it, or null for every run */
	runId?: string | null;
	/** The agent the room's runs, and a linked run, must belong to */
	agentId?: string;
	/** How the page reads and closes the room */
	source: AgentRoomSource;
	/** Who and what the room belongs to, shown before its runs in the summary */
	summaryItems?: AgentRoomSummaryItem[];
	/** More lines for the export's header, such as the room's user and agent */
	exportDetails?: AgentRoomExportDetail[];
	/** Whose room it is, for the close confirmation, or null for the user's own */
	ownerLabel: string | null;
	/** Shows the graph without the Analyze tab, as a view of another user's runs */
	isReadOnly?: boolean;
	/** Goes back to the list of rooms */
	onBack: () => void;
	/** Called once the room is closed, so the list can show it closed */
	onClosed: () => void;
	/**
	 * Called with why when the room's runs cannot be read the first time, such as
	 * to go back to the list, in place of showing the error with Retry
	 */
	onLoadFailed?: (message: string) => void;
}

/**
 * One room with agent runs: how it stands, over the graph of its runs,
 * subagents and tool calls, with Export and Close Room. Render with a key per
 * room, so a room's runs never show under another.
 */
export const AgentRoomDetail = ({
	room,
	runId = null,
	agentId,
	source,
	summaryItems,
	exportDetails,
	ownerLabel,
	isReadOnly = false,
	onBack,
	onClosed,
	onLoadFailed,
}: AgentRoomDetailProps) => {
	const { runs, engineInfo, loadRoom } = useAgentRoomRuns(source);
	const [roomRuns, setRoomRuns] = useState<AgentActivityRun[] | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	// only the latest read shows, so a slow first read cannot replace a refresh
	const latestRead = useRef(0);
	// the latest callback, so a new one each render does not read the room again
	const onLoadFailedRef = useRef(onLoadFailed);
	useEffect(() => {
		onLoadFailedRef.current = onLoadFailed;
	});
	const { roomId, userId, userType } = room;
	// a room opened from a link has only its id until its runs are read
	const roomName =
		room.roomName ??
		roomRuns?.find((run) => run.roomName)?.roomName ??
		null;
	// the list row can be older than the room's runs, which say whether it closed since
	const isClosed =
		room.isClosed ||
		(roomRuns?.some((run) => run.isRoomClosed === true) ?? false);

	useEffect(() => {
		let cancelled = false;
		const read = ++latestRead.current;
		const load = async () => {
			setIsLoading(true);
			try {
				const found = await source.fetchRoomRuns(
					roomId,
					userId,
					userType,
				);
				if (!cancelled && read === latestRead.current) {
					if (
						agentId !== undefined &&
						!found.some((run) => run.workspaceId === agentId)
					) {
						throw new Error(
							"This room holds no runs of this agent.",
						);
					}
					setRoomRuns(found);
					setLoadError(null);
					await loadRoom(roomId, found, {
						requestedRunId: runId ?? undefined,
						workspaceId: agentId,
					});
				}
			} catch (error) {
				if (!cancelled && read === latestRead.current) {
					const message = getErrorMessage(
						error,
						"The room's runs could not be read.",
					);
					if (onLoadFailedRef.current) {
						onLoadFailedRef.current(message);
					} else {
						setLoadError(message);
					}
				}
				console.error("Error fetching agent runs:", error);
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};
		void load();
		return () => {
			cancelled = true;
		};
	}, [roomId, userId, userType, runId, agentId, source, loadRoom]);

	/**
	 * Reads every run in the room again, so runs started, finished or stopped
	 * since it was last read show.
	 *
	 * @returns The room's runs, or null when they could not be read or a newer
	 * read overtook this one.
	 */
	const readAgain = async (): Promise<RoomRunDetail[] | null> => {
		const read = ++latestRead.current;
		setIsRefreshing(true);
		try {
			const found = await source.fetchRoomRuns(roomId, userId, userType);
			if (read !== latestRead.current) {
				return null;
			}
			setRoomRuns(found);
			setLoadError(null);
			return await loadRoom(roomId, found);
		} catch (error) {
			console.error("Error refreshing agent runs:", error);
			const message = getErrorMessage(
				error,
				"The room's runs could not be read.",
			);
			if (read === latestRead.current) {
				setLoadError(message);
			}
			toast.error(`Error refreshing agent runs: ${message}`);
			return null;
		} finally {
			setIsRefreshing(false);
		}
	};

	/** Reads the room again and reports what came back, since a run still going may look the same */
	const handleRefresh = async () => {
		if (isLoading || isRefreshing) {
			return;
		}
		const runDetails = await readAgain();
		if (!runDetails) {
			return;
		}
		const label = `${runDetails.length} ${runDetails.length === 1 ? "run" : "runs"}`;
		const inProgress = runDetails.filter((run) =>
			isActiveStatus(run.status),
		).length;
		toast.success(
			inProgress > 0
				? `Refreshed - ${label}, ${inProgress} still in progress`
				: `Refreshed - ${label}`,
		);
	};

	const handleClosed = (closure: AgentRunRoomClosure) => {
		if (closure.closedRoomIds.includes(roomId)) {
			onClosed();
		}
		void readAgain();
	};

	return (
		<AgentRoomView
			roomId={roomId}
			roomName={roomName}
			details={
				<AgentRoomSummary
					room={room}
					runs={roomRuns}
					isClosed={isClosed}
					items={summaryItems}
				/>
			}
			actions={
				<CloseAgentRoomAction
					roomId={roomId}
					roomLabel={roomName ?? roomId}
					ownerLabel={ownerLabel}
					isClosed={isClosed}
					onConfirm={() => source.closeRoom(roomId, userId, userType)}
					onClosed={handleClosed}
				/>
			}
			exportDetails={exportDetails}
			runs={runs}
			engineInfo={engineInfo}
			isLoading={isLoading}
			isRefreshing={isRefreshing}
			error={loadError}
			onBack={onBack}
			onRefresh={handleRefresh}
			isReadOnly={isReadOnly}
		/>
	);
};
