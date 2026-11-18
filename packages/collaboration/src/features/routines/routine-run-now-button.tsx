import { Play } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, Button } from "@semoss/ui/next";
import type { RoutineStatus } from "./routine-schema";

interface RoutineRunNowButtonProps {
	/** Whether the routine is on, and its latest run. */
	routine: Pick<RoutineStatus, "enabled" | "lastRun">;
	/** Starts a run on the scheduler; a rejection shows under the button. */
	onRunNow: () => Promise<unknown>;
}

/** Runs a system routine now, off its schedule; it needs the routine on and no run already going. */
export function RoutineRunNowButton({
	routine,
	onRunNow,
}: RoutineRunNowButtonProps) {
	const [isStarting, setIsStarting] = useState(false);
	const [error, setError] = useState("");
	const handleRunNow = async (): Promise<void> => {
		setIsStarting(true);
		setError("");
		try {
			await onRunNow();
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "The run did not start.",
			);
		} finally {
			setIsStarting(false);
		}
	};
	return (
		<div className="flex flex-col gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="w-fit"
				disabled={
					isStarting ||
					!routine.enabled ||
					routine.lastRun?.status === "running"
				}
				onClick={() => void handleRunNow()}
			>
				<Play aria-hidden="true" data-icon="inline-start" />
				Run now
			</Button>
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
