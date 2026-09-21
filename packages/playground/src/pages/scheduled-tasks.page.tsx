import {
	CalendarClockIcon,
	HistoryIcon,
	MoreHorizontalIcon,
	PauseIcon,
	PencilIcon,
	PlayIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	H3,
	Muted,
	P,
	Small,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { type AgentSchedule, manageAgentSchedule } from "@/api";
import { AgentScheduleForm, AgentScheduleHistoryDialog } from "@/components";
import { useGlobalBreadcrumbs } from "@/hooks";
import { formatAgentScheduleStatus } from "@/utility";

const activeStatuses = new Set(["SUBMITTED", "RUNNING", "INPUT_REQUIRED"]);

const scheduleStatus = (schedule: AgentSchedule) => {
	if (schedule.paused) return "PAUSED";
	if (schedule.runStatus && activeStatuses.has(schedule.runStatus)) {
		return schedule.runStatus;
	}
	if (schedule.runStatus === "FAILED") return "FAILED";
	return schedule.triggerState;
};

/** Owner-scoped list and management surface for Playground agent schedules. */
export const ScheduledTasksPage = () => {
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: "Home", path: "/" },
			{ name: "Scheduled Tasks", path: "/scheduled-tasks" },
		],
	});

	const schedules = usePixel<AgentSchedule[]>("ListAgentSchedules();", {
		data: [],
	});
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<AgentSchedule | null>(null);
	const [history, setHistory] = useState<AgentSchedule | null>(null);
	const [deleting, setDeleting] = useState<AgentSchedule | null>(null);
	const [pendingAction, setPendingAction] = useState<string | null>(null);

	const refresh = () => {
		schedules.refresh();
	};

	const runAction = async (
		schedule: AgentSchedule,
		action: "PAUSE" | "RESUME" | "RUN_NOW",
	) => {
		const actionKey = `${schedule.scheduleId}:${action}`;
		setPendingAction(actionKey);
		try {
			await manageAgentSchedule(schedule.scheduleId, action);
			toast.success(
				action === "RUN_NOW"
					? "Task started"
					: action === "PAUSE"
						? "Task paused"
						: "Task resumed",
			);
			refresh();
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to update the task",
			);
		} finally {
			setPendingAction(null);
		}
	};

	const confirmDelete = async () => {
		if (!deleting) return;
		const actionKey = `${deleting.scheduleId}:DELETE`;
		setPendingAction(actionKey);
		try {
			await manageAgentSchedule(deleting.scheduleId, "DELETE");
			toast.success("Task deleted");
			setDeleting(null);
			refresh();
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to delete the task",
			);
		} finally {
			setPendingAction(null);
		}
	};

	return (
		<div className="h-full w-full overflow-y-auto bg-background">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
				<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
					<div className="flex max-w-prose flex-col gap-2">
						<H3>Scheduled Tasks</H3>
						<P className="text-muted-foreground">
							Set up agent tasks to run once or on a repeating
							schedule. Results are saved in a chat.
						</P>
					</div>
					<Button onClick={() => setFormOpen(true)}>
						<PlusIcon aria-hidden />
						Schedule task
					</Button>
				</div>

				{schedules.status === "ERROR" && (
					<Alert variant="destructive">
						<AlertTitle>
							We couldn’t load your scheduled tasks
						</AlertTitle>
						<AlertDescription>
							Try again. If the problem continues, contact your
							administrator.
						</AlertDescription>
					</Alert>
				)}

				{schedules.status === "LOADING" ? (
					<div className="flex justify-center py-12">
						<Spinner />
					</div>
				) : (schedules.data ?? []).length === 0 ? (
					<div className="flex flex-col items-center gap-4 rounded-xl border border-border border-dashed p-8 text-center">
						<CalendarClockIcon
							className="size-8 text-muted-foreground"
							aria-hidden
						/>
						<div className="flex flex-col gap-1">
							<H3>No scheduled tasks yet</H3>
							<Muted>
								Create a task that runs once or repeats on your
								schedule.
							</Muted>
						</div>
						<Button onClick={() => setFormOpen(true)}>
							Schedule task
						</Button>
					</div>
				) : (
					<div className="grid gap-4 lg:grid-cols-2">
						{(schedules.data ?? []).map((schedule) => {
							const status = scheduleStatus(schedule);
							const attention =
								status === "FAILED" ||
								status === "INPUT_REQUIRED" ||
								schedule.latestInvocation?.status ===
									"SKIPPED" ||
								schedule.latestInvocation?.success === false;
							const roomId =
								schedule.activeRoomId ||
								schedule.latestInvocation?.roomId ||
								schedule.continuingRoomId;

							return (
								<Card key={schedule.scheduleId}>
									<CardHeader>
										<CardTitle>{schedule.name}</CardTitle>
										<CardDescription className="line-clamp-2">
											{schedule.prompt}
										</CardDescription>
										<div className="flex flex-wrap gap-2 pt-2">
											<Badge
												variant={
													status === "FAILED"
														? "destructive"
														: "outline"
												}
											>
												{formatAgentScheduleStatus(
													status,
												)}
											</Badge>
											<Badge variant="secondary">
												{schedule.scheduleType ===
												"ONCE"
													? "One time"
													: "Recurring"}
											</Badge>
											<Badge variant="secondary">
												{schedule.roomMode === "FRESH"
													? "New chat each time"
													: "Same chat"}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="flex flex-col gap-3">
										<div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
											<Small className="text-muted-foreground">
												Next run
											</Small>
											<Small>
												{schedule.nextExecution
													? new Date(
															schedule.nextExecution,
														).toLocaleString()
													: "No upcoming run"}
											</Small>
											<Small className="text-muted-foreground">
												Time zone
											</Small>
											<Small className="break-all">
												{schedule.timezone}
											</Small>
											<Small className="text-muted-foreground">
												Last run
											</Small>
											<Small>
												{schedule.latestInvocation
													?.executionStart
													? `${new Date(
															schedule
																.latestInvocation
																.executionStart,
														).toLocaleString()} · ${formatAgentScheduleStatus(
															schedule
																.latestInvocation
																.status ||
																(schedule
																	.latestInvocation
																	.success
																	? "SUBMITTED"
																	: "FAILED"),
														)}`
													: "Never run"}
											</Small>
										</div>
										{attention && (
											<Alert
												variant={
													status === "FAILED"
														? "destructive"
														: "default"
												}
											>
												<AlertTitle>
													Attention needed
												</AlertTitle>
												<AlertDescription>
													{status === "INPUT_REQUIRED"
														? "This task is waiting for your input or approval."
														: schedule
																	.latestInvocation
																	?.status ===
																"SKIPPED"
															? "A run was skipped because the previous run is still in progress."
															: schedule.runError ||
																schedule
																	.latestInvocation
																	?.error ||
																"The latest run couldn’t be completed."}
												</AlertDescription>
											</Alert>
										)}
										{roomId && (
											<Button
												variant="link"
												asChild
												className="w-fit px-0"
											>
												<Link to={`/room/${roomId}`}>
													Open chat
												</Link>
											</Button>
										)}
									</CardContent>
									<CardFooter className="justify-end gap-2">
										<Button
											size="sm"
											variant="ghost"
											aria-label={`View history for ${schedule.name}`}
											onClick={() => setHistory(schedule)}
										>
											<HistoryIcon aria-hidden />
											History
										</Button>
										<Button
											size="sm"
											variant="ghost"
											aria-label={`Edit ${schedule.name}`}
											onClick={() => setEditing(schedule)}
										>
											<PencilIcon aria-hidden />
											Edit
										</Button>
										<Button
											size="sm"
											variant="outline"
											disabled={Boolean(pendingAction)}
											onClick={() =>
												runAction(
													schedule,
													schedule.paused
														? "RESUME"
														: "PAUSE",
												)
											}
										>
											{schedule.paused ? (
												<PlayIcon aria-hidden />
											) : (
												<PauseIcon aria-hidden />
											)}
											{schedule.paused
												? "Resume"
												: "Pause"}
										</Button>
										<Button
											size="sm"
											disabled={Boolean(pendingAction)}
											onClick={() =>
												runAction(schedule, "RUN_NOW")
											}
										>
											<PlayIcon aria-hidden />
											Run now
										</Button>
										<DropdownMenu>
											<Tooltip>
												<TooltipTrigger asChild>
													<DropdownMenuTrigger
														asChild
													>
														<Button
															type="button"
															size="icon-sm"
															variant="ghost"
															aria-label={`More actions for ${schedule.name}`}
															disabled={Boolean(
																pendingAction,
															)}
														>
															<MoreHorizontalIcon
																aria-hidden
															/>
														</Button>
													</DropdownMenuTrigger>
												</TooltipTrigger>
												<TooltipContent>
													More actions
												</TooltipContent>
											</Tooltip>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													variant="destructive"
													onSelect={() =>
														setDeleting(schedule)
													}
												>
													<Trash2Icon aria-hidden />
													Delete task
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</CardFooter>
								</Card>
							);
						})}
					</div>
				)}
			</div>

			<AgentScheduleForm
				open={formOpen || Boolean(editing)}
				schedule={editing}
				onSubmit={(id) => {
					setFormOpen(false);
					setEditing(null);
					if (id) refresh();
				}}
			/>
			<AgentScheduleHistoryDialog
				schedule={history}
				onClose={() => setHistory(null)}
			/>
			<Dialog
				open={Boolean(deleting)}
				onOpenChange={(open) => !open && setDeleting(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete scheduled task?</DialogTitle>
						<DialogDescription>
							Future runs for “{deleting?.name}” will be canceled.
							Existing chats and results will remain available.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							disabled={Boolean(pendingAction)}
							onClick={() => setDeleting(null)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={Boolean(pendingAction)}
							onClick={confirmDelete}
						>
							{pendingAction?.endsWith(":DELETE") && (
								<Spinner className="size-4" />
							)}
							Delete task
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
