import { MoreHorizontal, Play, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	CardDescription,
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
	FormSwitch,
	H2,
	Spinner,
} from "@semoss/ui/next";
import type { CustomRoutine } from "./custom-routine-schema";
import { RoutineAgentAvatar } from "./routine-agent-avatar";
import { describeSchedule } from "./routine-schedule-summary";

/** Where the result goes, as the status line says it. */
const DELIVERY_STATUS = {
	email: "Emails you",
	teams: "Messages you in Teams",
	brief: "Shown as a section of the brief",
	none: "Kept here",
} as const;

interface CustomRoutineHeaderProps {
	/** The saved routine: its schedule, delivery, and last run. */
	routine: CustomRoutine;
	/** The name as typed, so the title follows an edit before it saves. */
	name: string;
	/** The form's save indicator. */
	saveStatus: ReactNode;
	/** True while Run now is starting a run. */
	isStarting: boolean;
	/** Starts a run now, off the schedule. */
	onRunNow: () => void;
	/** Deletes the routine; rejects with a message for the dialog. */
	onDelete: () => Promise<void>;
}

/** One routine's name, one status line, and its controls: on or off, Run now, and Delete behind a confirmation. */
export function CustomRoutineHeader({
	routine,
	name,
	saveStatus,
	isStarting,
	onRunNow,
	onDelete,
}: CustomRoutineHeaderProps) {
	const [isConfirming, setIsConfirming] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");
	const title = name.trim() || routine.name;
	const isRunning = routine.lastRun?.status === "running";
	const nextRun =
		routine.enabled && routine.nextRunAt
			? new Intl.DateTimeFormat(undefined, {
					weekday: "short",
					month: "short",
					day: "numeric",
					hour: "numeric",
					minute: "2-digit",
					timeZone: routine.timezone,
				}).format(new Date(routine.nextRunAt))
			: null;
	// one line instead of a badge, a next-run line and a switch caption saying the same thing
	const facts = [
		routine.enabled ? null : "Off",
		// the daily brief runs it, so its own days and time do not apply
		routine.delivery === "brief"
			? "Runs with your daily brief"
			: describeSchedule(routine),
		nextRun && `Next run ${nextRun}`,
		DELIVERY_STATUS[routine.delivery],
	].filter(Boolean);

	const handleDelete = async (): Promise<void> => {
		setIsDeleting(true);
		setDeleteError("");
		try {
			// the routine leaves the list, which unmounts this header
			await onDelete();
		} catch (cause) {
			setDeleteError(
				cause instanceof Error
					? cause.message
					: "The routine could not be deleted. Try again.",
			);
			setIsDeleting(false);
		}
	};

	return (
		<CardHeader className="gap-0 border-b py-6">
			<div className="flex flex-wrap items-start gap-x-4 gap-y-3">
				<div className="size-12 shrink-0">
					<RoutineAgentAvatar routineId={routine.id} />
				</div>
				<div className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
					<div className="flex items-start justify-between gap-2">
						<CardTitle className="min-w-0">
							<H2 className="break-words font-medium text-xl">
								{title}
							</H2>
						</CardTitle>
						{saveStatus}
					</div>
					<CardDescription className="text-sm">
						{facts.join(" · ")}
						{isRunning && (
							<span className="ms-2 inline-flex items-center gap-1 text-foreground">
								<Spinner
									className="size-3"
									aria-hidden="true"
								/>
								Running now
							</span>
						)}
						{!isRunning && routine.lastRun?.status === "failed" && (
							<span className="ms-2 text-destructive">
								Last run failed
							</span>
						)}
					</CardDescription>
				</div>
				{/* the controls stay on one line and move under the name as one group when space runs out */}
				<div className="flex shrink-0 items-center gap-3">
					<FormSwitch name="enabled" label="Routine on" />
					<Button
						type="button"
						disabled={isStarting || isRunning || !routine.enabled}
						onClick={onRunNow}
					>
						{isStarting ? (
							<Spinner
								aria-hidden="true"
								data-icon="inline-start"
							/>
						) : (
							<Play aria-hidden="true" data-icon="inline-start" />
						)}
						{isStarting ? "Starting…" : "Run now"}
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={`More actions for ${title}`}
							>
								<MoreHorizontal aria-hidden="true" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								variant="destructive"
								onSelect={() => setIsConfirming(true)}
							>
								<Trash2 aria-hidden="true" />
								Delete routine
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<Dialog
				open={isConfirming}
				onOpenChange={(open) => {
					if (isDeleting) return;
					setIsConfirming(open);
					setDeleteError("");
				}}
			>
				<DialogContent showCloseButton={!isDeleting}>
					<DialogHeader>
						<DialogTitle>Delete {title}?</DialogTitle>
						<DialogDescription>
							It stops running, and its settings and reference
							documents are deleted. This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					{deleteError && (
						<Alert variant="destructive">
							<AlertDescription>{deleteError}</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isDeleting}
							onClick={() => setIsConfirming(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={isDeleting}
							onClick={() => void handleDelete()}
						>
							{isDeleting && (
								<Spinner
									aria-hidden="true"
									data-icon="inline-start"
								/>
							)}
							{isDeleting ? "Deleting…" : "Delete routine"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</CardHeader>
	);
}
