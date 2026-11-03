import { Check, RotateCw } from "lucide-react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { RoutineAutosaveStatus } from "./use-routine-autosave";

interface RoutineSaveStatusProps {
	/** Current persistence state, including edits waiting for the debounce. */
	status: RoutineAutosaveStatus;
	/** The last rejected write, explained on focus or hover without shifting the form. */
	error?: string;
	/** Retries the current draft through the same save queue. */
	onRetry: () => void;
}

/** Reserve the same space for every save state, including retry. */
export function RoutineSaveStatus({
	status,
	error,
	onRetry,
}: RoutineSaveStatusProps) {
	const label = {
		idle: "",
		saving: "Saving…",
		saved: "Saved",
		error: "Not saved",
		invalid: "Check fields",
	}[status];
	return (
		<div className="flex h-8 w-28 shrink-0 items-center justify-end gap-1 text-muted-foreground">
			<output
				aria-label="Save status"
				className="flex items-center gap-1 whitespace-nowrap text-xs"
			>
				{status === "saved" && (
					<Check className="size-3" aria-hidden="true" />
				)}
				{label}
				{status === "error" && error && (
					<span className="sr-only">: {error}</span>
				)}
			</output>
			{status === "error" && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="size-6"
							aria-label="Retry save"
							onClick={onRetry}
						>
							<RotateCw aria-hidden="true" />
						</Button>
					</TooltipTrigger>
					<TooltipContent className="max-w-xs">
						{error || "Your changes could not be saved."} Retry
						saving.
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}
