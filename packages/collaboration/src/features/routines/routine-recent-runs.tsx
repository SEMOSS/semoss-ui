import { TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Button, cn, Spinner, toast } from "@semoss/ui/next";
import { formatDateTimeWithRelativeDay } from "@semoss/utility/date";
import { useVisibleResource } from "@/features/dashboard/use-visible-resource";
import { ROOM_HISTORY_CHANGED } from "@/features/rooms/api/list-rooms";
import { roomPath } from "@/lib/workspace-paths";
import {
	listRecentRoutineRuns,
	ROUTINE_RUNS_CHANGED,
} from "./api/list-recent-routine-runs";
import { openRoutineRoom } from "./api/open-routine-room";
import { RoutineAgentAvatar } from "./routine-agent-avatar";
import { RoutineRunMenu } from "./routine-run-menu";
import { findSystemRoutine } from "./system-routines";

// scheduled runs start and finish without anything on this page asking; runs started here re-read at once
const POLL_MS = 30_000;

// first in the sidebar's scroller, whose top padding it rises into, so it sits 2px under Routines like the links do;
// the insets line it up with the links above
const SIDEBAR_SPOT = "-mt-1.5 flex shrink-0 pe-2";

// a run is a link or, when it opens a chat, a button; both look the same, and the row stays lit while the pointer
// is on its "..." menu
const RUN_ROW =
	"flex min-h-7 pointer-coarse:min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg px-2 text-start text-muted-foreground text-xs tabular-nums group-hover/run:bg-sidebar-accent group-hover/run:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50";

interface RoutineRecentRunsProps {
	/** Closes mobile navigation after a routine or run opens. */
	onNavigate?: () => void;
}

/**
 * The routines that ran last, under Routines in the sidebar, each with its latest runs. A routine opens on the
 * Routines page; a finished run opens its chat, a running one of the owner's own routines its room.
 */
export function RoutineRecentRuns({ onNavigate }: RoutineRecentRunsProps) {
	const { actions } = useInsight();
	const navigate = useNavigate();
	const load = useCallback(() => listRecentRoutineRuns(actions), [actions]);
	const recent = useVisibleResource(load, true, POLL_MS);
	const { refresh } = recent;
	const [openingRunId, setOpeningRunId] = useState<string | null>(null);
	// each routine's link, where focus goes after one of its runs is deleted
	const routineLinks = useRef(new Map<string, HTMLAnchorElement>());
	useEffect(() => {
		window.addEventListener(ROUTINE_RUNS_CHANGED, refresh);
		return () => window.removeEventListener(ROUTINE_RUNS_CHANGED, refresh);
	}, [refresh]);

	const handleOpenRun = async (routineId: string, runId: string) => {
		setOpeningRunId(runId);
		try {
			const roomId = await openRoutineRoom(
				actions,
				routineId,
				undefined,
				runId,
			);
			window.dispatchEvent(
				new CustomEvent(ROOM_HISTORY_CHANGED, { detail: { roomId } }),
			);
			void navigate(roomPath(roomId));
			onNavigate?.();
		} catch (cause) {
			toast.error(
				cause instanceof Error
					? cause.message
					: "Could not open the chat. Try again.",
			);
		} finally {
			setOpeningRunId(null);
		}
	};

	if (!recent.data && recent.error) {
		return (
			<div
				role="alert"
				className={cn(
					SIDEBAR_SPOT,
					"min-h-8 items-center gap-1 ps-10 text-muted-foreground text-xs",
				)}
			>
				Recent runs did not load.
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 pointer-coarse:min-h-11 px-2 text-xs"
					onClick={refresh}
				>
					Retry
				</Button>
			</div>
		);
	}
	// nothing has run yet, or the first read is still out: the Routines link stands alone
	if (!recent.data?.length) return null;
	return (
		<ul
			aria-label="Recent routines"
			className={cn(SIDEBAR_SPOT, "flex-col gap-0.5 ps-8")}
		>
			{recent.data.map((routine) => {
				const system = findSystemRoutine(routine.routineId);
				const name =
					system?.name ?? (routine.name || "Untitled routine");
				const routinePath = `/routines?${new URLSearchParams({ routine: routine.routineId })}`;
				return (
					<li key={routine.routineId} className="flex flex-col">
						<Link
							ref={(element) => {
								if (element)
									routineLinks.current.set(
										routine.routineId,
										element,
									);
								else
									routineLinks.current.delete(
										routine.routineId,
									);
							}}
							to={routinePath}
							onClick={onNavigate}
							title={name}
							className="flex min-h-8 pointer-coarse:min-h-11 min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring"
						>
							{/* the same robot as the routine's own card: a system agent's, or the owner's routine's own color */}
							<span
								aria-hidden="true"
								className="flex size-5 shrink-0"
							>
								<RoutineAgentAvatar
									routineId={routine.routineId}
								/>
							</span>
							<span className="min-w-0 truncate">{name}</span>
						</Link>
						{/* the line drops from the avatar's middle, so the runs read as the routine's own */}
						<ul
							aria-label={`${name} runs`}
							className="ms-4.5 flex flex-col border-sidebar-border border-s ps-2"
						>
							{routine.runs.map((run) => {
								const when = formatDateTimeWithRelativeDay(
									run.startedAt,
								);
								const isOpening = openingRunId === run.runId;
								// a run still going has nothing to delete yet
								const canDelete = run.status !== "running";
								const content = (
									<>
										<span className="min-w-0 truncate">
											{isOpening ? "Opening…" : when}
										</span>
										{run.status === "running" && (
											<span className="flex shrink-0 items-center gap-1">
												<Spinner
													aria-hidden="true"
													className="size-3 text-primary motion-reduce:animate-none"
												/>
												Running
											</span>
										)}
										{run.status === "failed" && (
											// red text drops under 4.5:1 on the hover fill, so the icon carries the color;
											// with a mouse the "..." takes this spot while the row is hovered or focused
											<span className="flex shrink-0 items-center gap-1 pointer-fine:group-focus-within/run:invisible pointer-fine:group-hover/run:invisible pointer-fine:group-has-[[data-state=open]]/run:invisible">
												<TriangleAlert
													aria-hidden="true"
													className="size-3 text-destructive"
												/>
												Failed
											</span>
										)}
									</>
								);
								// a touch screen shows the "..." all the time, so the row makes room for it
								const rowClassName = cn(
									RUN_ROW,
									canDelete && "pointer-coarse:pe-12",
								);
								// a run without a chat opens where it can be followed: its room, else its routine
								const label =
									run.status === "completed"
										? `${isOpening ? "Opening" : "Open"} the chat for ${name} from ${when}`
										: run.status === "running"
											? `${run.roomId ? "Watch" : "Open"} ${name}, running since ${when}`
											: run.status === "stopped"
												? `Open ${name}, stopped ${when}`
												: `Open ${name}, failed ${when}`;
								return (
									<li
										key={run.runId}
										className="group/run relative"
									>
										{run.status === "completed" ? (
											<button
												type="button"
												title={label}
												aria-label={label}
												disabled={isOpening}
												onClick={() =>
													void handleOpenRun(
														routine.routineId,
														run.runId,
													)
												}
												className={rowClassName}
											>
												{content}
											</button>
										) : (
											<Link
												to={
													run.roomId
														? roomPath(run.roomId)
														: routinePath
												}
												onClick={onNavigate}
												title={label}
												aria-label={label}
												className={rowClassName}
											>
												{content}
											</Link>
										)}
										{canDelete && (
											<RoutineRunMenu
												routineId={routine.routineId}
												runId={run.runId}
												routineName={name}
												when={when}
												onDeleted={() =>
													routineLinks.current
														.get(routine.routineId)
														?.focus()
												}
												className="absolute inset-y-0 end-0.5 my-auto opacity-0 pointer-coarse:opacity-100 group-focus-within/run:opacity-100 group-hover/run:opacity-100 data-[state=open]:opacity-100"
											/>
										)}
									</li>
								);
							})}
						</ul>
					</li>
				);
			})}
		</ul>
	);
}
