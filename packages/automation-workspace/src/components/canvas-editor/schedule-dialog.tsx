import { Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Button, Input, Label, toast } from "@semoss/ui/next";
import {
	type AutomationSchedule,
	createAutomationSchedule,
	listAutomationSchedules,
	pauseAutomationSchedule,
	removeAutomationSchedule,
	resumeAutomationSchedule,
} from "../../api";
import { normalizeAutomationErrorMessage } from "../../domain/automation-utils";

interface SchedulePanelProps {
	projectId: string;
	/** Saves the current definition before a new schedule can run it. */
	onPrepareSchedule: () => Promise<boolean>;
}

function getBrowserTimeZone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	} catch {
		return "UTC";
	}
}

function getErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error
		? normalizeAutomationErrorMessage(error.message)
		: fallback;
}

/** Inline project-scoped scheduler controls for an Automation trigger. */
export function SchedulePanel({
	projectId,
	onPrepareSchedule,
}: SchedulePanelProps) {
	const defaultTimezone = useMemo(getBrowserTimeZone, []);
	const [schedules, setSchedules] = useState<AutomationSchedule[]>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [actionJobId, setActionJobId] = useState<string | null>(null);
	const [scheduleToRemove, setScheduleToRemove] =
		useState<AutomationSchedule | null>(null);
	const [name, setName] = useState("Automation schedule");
	const [cronExpression, setCronExpression] = useState("0 0 9 * * ?");
	const [timezone, setTimezone] = useState(defaultTimezone);
	const scheduleHeadingId = useId();
	const nameInputId = useId();
	const cronInputId = useId();
	const timezoneInputId = useId();

	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			setSchedules(await listAutomationSchedules(projectId));
		} catch (error) {
			toast.error(
				getErrorMessage(error, "Unable to load automation schedules."),
			);
		} finally {
			setLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const createSchedule = useCallback(async () => {
		if (!name.trim() || !cronExpression.trim() || !timezone.trim()) {
			toast.error("Name, cron expression, and time zone are required.");
			return;
		}
		setSubmitting(true);
		try {
			if (!(await onPrepareSchedule())) return;
			await createAutomationSchedule(projectId, {
				name: name.trim(),
				cronExpression: cronExpression.trim(),
				timezone: timezone.trim(),
			});
			toast.success("Automation schedule added");
			await refresh();
		} catch (error) {
			toast.error(
				getErrorMessage(
					error,
					"Unable to add the automation schedule.",
				),
			);
		} finally {
			setSubmitting(false);
		}
	}, [cronExpression, name, onPrepareSchedule, projectId, refresh, timezone]);

	const updateSchedule = useCallback(
		async (
			schedule: AutomationSchedule,
			action: "pause" | "resume" | "remove",
		) => {
			setActionJobId(schedule.jobId);
			try {
				if (action === "pause") await pauseAutomationSchedule(schedule);
				if (action === "resume")
					await resumeAutomationSchedule(schedule);
				if (action === "remove")
					await removeAutomationSchedule(schedule);
				toast.success(
					action === "remove"
						? "Automation schedule removed"
						: `Automation schedule ${action}d`,
				);
				await refresh();
			} catch (error) {
				toast.error(
					getErrorMessage(
						error,
						`Unable to ${action} the automation schedule.`,
					),
				);
			} finally {
				setActionJobId(null);
			}
		},
		[refresh],
	);

	return (
		<section className="space-y-3" aria-labelledby={scheduleHeadingId}>
			<div className="space-y-3 rounded-lg border bg-muted/20 p-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="font-medium text-sm">Current schedules</p>
						<p className="text-muted-foreground text-xs">
							Only schedules owned by this automation are shown.
						</p>
					</div>
					<Button
						size="sm"
						variant="ghost"
						className="h-8 px-2"
						onClick={() => void refresh()}
						disabled={loading}
					>
						<RefreshCw
							className={`size-3.5 ${loading ? "animate-spin" : ""}`}
							aria-hidden
						/>
						<span className="sr-only">Refresh schedules</span>
					</Button>
				</div>
				{loading ? (
					<div className="flex h-20 items-center justify-center">
						<Loader2
							className="size-4 animate-spin text-muted-foreground"
							aria-label="Loading schedules"
						/>
					</div>
				) : schedules.length === 0 ? (
					<p className="rounded-md border border-dashed bg-background px-3 py-4 text-center text-muted-foreground text-xs">
						No schedules yet.
					</p>
				) : (
					<div className="divide-y rounded-md border bg-background">
						{schedules.map((schedule) => {
							const busy = actionJobId === schedule.jobId;
							return (
								<div
									key={schedule.jobId}
									className="flex items-center gap-3 px-3 py-2.5"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-xs">
											{schedule.jobName}
										</p>
										<p className="truncate text-[11px] text-muted-foreground">
											{schedule.cronExpression} ·{" "}
											{schedule.cronTz}
										</p>
										<p className="text-[11px] text-muted-foreground">
											{schedule.isActive
												? `Next: ${schedule.nextFireTime}`
												: "Paused"}
										</p>
									</div>
									<Button
										size="sm"
										variant="ghost"
										className="size-8 p-0"
										onClick={() =>
											void updateSchedule(
												schedule,
												schedule.isActive
													? "pause"
													: "resume",
											)
										}
										disabled={busy}
										aria-label={
											schedule.isActive
												? `Pause ${schedule.jobName}`
												: `Resume ${schedule.jobName}`
										}
									>
										{busy ? (
											<Loader2 className="size-3.5 animate-spin" />
										) : schedule.isActive ? (
											<Pause className="size-3.5" />
										) : (
											<Play className="size-3.5" />
										)}
									</Button>
									<Button
										size="sm"
										variant="ghost"
										className="size-8 p-0 text-destructive hover:text-destructive"
										onClick={() =>
											setScheduleToRemove(schedule)
										}
										disabled={busy}
										aria-label={`Remove ${schedule.jobName}`}
									>
										<Trash2 className="size-3.5" />
									</Button>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{scheduleToRemove && (
				<div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
					<div>
						<p className="font-medium text-sm">
							Remove {scheduleToRemove.jobName}?
						</p>
						<p className="text-muted-foreground text-xs">
							This removes the schedule and its stored recipe. The
							automation and its run history are not affected.
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => setScheduleToRemove(null)}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							variant="destructive"
							disabled={actionJobId === scheduleToRemove.jobId}
							onClick={() => {
								void updateSchedule(scheduleToRemove, "remove");
								setScheduleToRemove(null);
							}}
						>
							Remove schedule
						</Button>
					</div>
				</div>
			)}

			<div className="space-y-3 rounded-lg border p-3">
				<div>
					<p className="font-medium text-sm">Add schedule</p>
					<p className="text-muted-foreground text-xs">
						Cron uses the Quartz format. Example:{" "}
						<code>0 0 9 * * ?</code>
						runs daily at 9:00 AM.
					</p>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor={nameInputId}>Name</Label>
					<Input
						id={nameInputId}
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor={cronInputId}>Cron expression</Label>
					<Input
						id={cronInputId}
						value={cronExpression}
						onChange={(event) =>
							setCronExpression(event.target.value)
						}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor={timezoneInputId}>Time zone</Label>
					<Input
						id={timezoneInputId}
						value={timezone}
						onChange={(event) => setTimezone(event.target.value)}
						placeholder="America/New_York"
					/>
				</div>
				<Button
					size="sm"
					className="w-full"
					onClick={() => void createSchedule()}
					disabled={submitting}
				>
					{submitting ? (
						<Loader2 className="mr-1.5 size-3.5 animate-spin" />
					) : (
						<Plus className="mr-1.5 size-3.5" />
					)}
					Add schedule
				</Button>
			</div>
		</section>
	);
}
