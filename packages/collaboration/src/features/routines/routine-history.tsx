import { RefreshCw } from "lucide-react";
import { useEffect, useRef } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	P,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	z,
} from "@semoss/ui/next";
import { callPixel, pixel } from "@/lib/pixel";
import { ROUTINE_RUN_DELETED } from "./api/delete-routine-run";
import { RoutineChatButton } from "./routine-chat-button";
import { RoutineRunMenu } from "./routine-run-menu";
import type { RoutineId } from "./routine-schema";
import { findSystemRoutine } from "./system-routines";

export const routineRunListSchema = z.object({
	runs: z.array(
		z.object({
			runId: z.string().min(1),
			startedAt: z.iso.datetime().nullish().default(null),
			finishedAt: z.iso.datetime().nullish().default(null),
			status: z.enum(["running", "completed", "failed"]),
			trigger: z.enum(["scheduled", "manual"]),
			durationMs: z.number().nullish().default(null),
			hasOutput: z.boolean(),
		}),
	),
});

export type RoutineRun = z.infer<typeof routineRunListSchema>["runs"][number];

const STATUS_LABELS = {
	running: "Running",
	completed: "Completed",
	failed: "Failed",
} as const;

/** A run's length as minutes and seconds, such as "4m 12s". */
export function formatDuration(milliseconds: number | null): string {
	if (milliseconds === null || milliseconds < 0) return "-";
	const seconds = Math.round(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	return minutes ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

interface RoutineHistoryProps {
	/** The routine whose past runs are listed. */
	routineId: RoutineId;
	/** A custom routine's name; a system routine's comes from its id. */
	routineName?: string;
	/** The owner's time zone, for the run times. */
	timezone: string;
}

/** The routine's past runs, newest first; a run with output opens as a chat, and a finished one can be deleted. */
export function RoutineHistory({
	routineId,
	routineName,
	timezone,
}: RoutineHistoryProps) {
	const { actions } = useInsight();
	const statement = pixel("WorkListRoutineRuns", { routineId });
	const result = usePixel<unknown>(statement);
	const { update } = result;
	// where focus goes when its run's row is deleted
	const refreshButton = useRef<HTMLButtonElement>(null);
	// in place: a refresh would show the loading state and drop focus
	useEffect(() => {
		const reread = () => {
			callPixel(actions, statement, routineRunListSchema)
				.then(update)
				.catch(() => {
					// keep the last list; Refresh tries again
				});
		};
		window.addEventListener(ROUTINE_RUN_DELETED, reread);
		return () => window.removeEventListener(ROUTINE_RUN_DELETED, reread);
	}, [actions, statement, update]);
	const name =
		findSystemRoutine(routineId)?.name ??
		(routineName || "Untitled routine");
	const parsed = routineRunListSchema.safeParse(result.data);
	if (result.status === "INITIAL" || result.status === "LOADING") {
		return (
			<div className="flex flex-col gap-2">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<output className="sr-only">Loading past runs...</output>
			</div>
		);
	}
	if (result.status === "ERROR" || !parsed.success) {
		return (
			<Alert variant="destructive">
				<AlertDescription>
					{result.error?.message || "Past runs could not be loaded."}
					<Button
						variant="outline"
						size="sm"
						onClick={result.refresh}
					>
						Try again
					</Button>
				</AlertDescription>
			</Alert>
		);
	}
	const runs = parsed.data.runs;
	const when = new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: timezone,
	});
	return (
		<div className="flex min-w-0 flex-col gap-3">
			<div className="flex items-center justify-between gap-3">
				<P className="text-muted-foreground text-sm">
					{runs.length
						? `The last ${runs.length} runs, newest first. Times are in ${timezone.replaceAll("_", " ")}.`
						: "No runs yet. Runs appear here once the routine has run."}
				</P>
				<Button
					ref={refreshButton}
					variant="outline"
					size="sm"
					onClick={result.refresh}
				>
					<RefreshCw aria-hidden="true" data-icon="inline-start" />
					Refresh
				</Button>
			</div>
			{runs.length > 0 && (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Started</TableHead>
							<TableHead>Trigger</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Duration</TableHead>
							<TableHead>
								<span className="sr-only">Actions</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{runs.map((run) => {
							const started = run.startedAt
								? when.format(new Date(run.startedAt))
								: null;
							return (
								<TableRow key={run.runId}>
									<TableCell>{started ?? "-"}</TableCell>
									<TableCell>
										{run.trigger === "manual"
											? "Run now"
											: "Scheduled"}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												run.status === "failed"
													? "destructive"
													: run.status === "running"
														? "outline"
														: "secondary"
											}
										>
											{STATUS_LABELS[run.status]}
										</Badge>
									</TableCell>
									<TableCell>
										{formatDuration(run.durationMs)}
									</TableCell>
									<TableCell>
										<div className="flex items-start justify-end gap-1">
											{run.hasOutput && (
												<RoutineChatButton
													routineId={routineId}
													runId={run.runId}
													label="Open chat"
												/>
											)}
											{/* a run still going has nothing to delete yet */}
											{run.status !== "running" && (
												<RoutineRunMenu
													routineId={routineId}
													runId={run.runId}
													routineName={name}
													when={
														started ??
														"an unknown time"
													}
													onDeleted={() =>
														refreshButton.current?.focus()
													}
													className="size-8"
												/>
											)}
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
