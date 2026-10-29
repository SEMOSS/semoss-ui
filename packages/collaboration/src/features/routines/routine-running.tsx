import { Bot } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { P } from "@semoss/ui/next";

interface RoutineRunningProps {
	/** The routine's own status sentence; announced once when the run starts. */
	message: string;
	/** When the run started, as the server reports it. */
	startedAt: string;
	/** A way to watch the run, when its room can be opened. */
	action?: ReactNode;
}

/** How long a run has been going, as "2m 14s" or "1h 3m"; empty for an unreadable start. */
function elapsedLabel(startedAt: string, now: number): string {
	const started = Date.parse(startedAt);
	if (Number.isNaN(started)) return "";
	const seconds = Math.max(0, Math.floor((now - started) / 1000));
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	return `${minutes}m ${seconds % 60}s`;
}

/**
 * A routine's result while its run is in progress: a breathing agent mark,
 * the status sentence, a live elapsed timer, and the way to watch the run.
 */
export function RoutineRunning({
	message,
	startedAt,
	action,
}: RoutineRunningProps) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, []);
	const elapsed = elapsedLabel(startedAt, now);
	return (
		<div className="flex size-full flex-col items-center justify-center gap-6 p-8 text-center">
			<div
				className="relative flex size-24 items-center justify-center"
				aria-hidden="true"
			>
				<span className="absolute inset-0 rounded-full bg-primary/10 motion-safe:animate-pulse" />
				<span className="absolute inset-3 rounded-full bg-primary/15 motion-safe:animate-pulse" />
				<span className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
					<Bot className="size-7" />
				</span>
			</div>
			<div className="flex max-w-md flex-col gap-2">
				<output className="font-medium text-base">{message}</output>
				{/* the timer ticks outside the status region, so it is never read out every second */}
				{elapsed && (
					<P className="text-muted-foreground text-sm">
						Running for{" "}
						<span className="tabular-nums">{elapsed}</span>
					</P>
				)}
			</div>
			{action}
		</div>
	);
}
