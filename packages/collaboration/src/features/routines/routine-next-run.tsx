import { CalendarClock } from "lucide-react";
import type { RoutineStatus } from "./routine-schema";

interface RoutineNextRunProps {
	/** Saved schedule state and the scheduler's next fire time. */
	routine: Pick<RoutineStatus, "enabled" | "nextRunAt" | "timezone">;
}

/** When the routine runs next, in the routine's own time zone. */
export function RoutineNextRun({ routine }: RoutineNextRunProps) {
	const nextRun = routine.nextRunAt
		? new Intl.DateTimeFormat(undefined, {
				dateStyle: "medium",
				timeStyle: "short",
				timeZone: routine.timezone,
			}).format(new Date(routine.nextRunAt))
		: null;
	const schedule =
		nextRun ??
		(routine.enabled
			? "Waiting for the scheduler."
			: "Choose your schedule to get started.");
	return (
		<span className="flex items-start gap-2">
			<CalendarClock
				className="mt-0.5 size-4 shrink-0"
				aria-hidden="true"
			/>
			<span>
				<span className="font-medium text-foreground">
					Next scheduled:
				</span>{" "}
				{schedule}
				{nextRun && ` · ${routine.timezone.replaceAll("_", " ")}`}
			</span>
		</span>
	);
}
