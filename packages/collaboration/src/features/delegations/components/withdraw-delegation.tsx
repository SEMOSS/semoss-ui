import { useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Button, Spinner, toast } from "@semoss/ui/next";
import { toError } from "@semoss/utility";
import {
	type AgentRun,
	cancelRun,
	isTerminalRun,
} from "@/features/rooms/api/agent-run-api";

/** What became of a request the person settled before the stop reached it. */
function settledFirst(run: AgentRun, assignee: string): string {
	if (run.status === "COMPLETED")
		return `${assignee} already responded, so nothing was withdrawn.`;
	return run.errorMessage?.startsWith("Declined")
		? `${assignee} already declined it, so nothing was withdrawn.`
		: "This request had already ended, so nothing was withdrawn.";
}

/** Lets the requester take back a request the person has not answered yet. */
export function WithdrawDelegation({
	runId,
	assignee,
}: {
	runId: string;
	assignee: string;
}) {
	const { insightId } = useInsight();
	const [step, setStep] = useState<"idle" | "confirm" | "busy" | "done">(
		"idle",
	);

	const withdraw = async () => {
		setStep("busy");
		try {
			// Stopping the waiting run also closes the person's request, unless they settled it first.
			const run = await cancelRun(insightId, runId);
			if (!isTerminalRun(run))
				throw new Error(
					`The request to ${assignee} could not be withdrawn. Please try again.`,
				);
			setStep("done");
			if (run.status === "CANCELLED")
				toast.success(
					`Withdrawn. ${assignee} will see it was withdrawn.`,
				);
			else toast.info(settledFirst(run, assignee));
		} catch (cause) {
			setStep("confirm");
			toast.error(toError(cause).message);
		}
	};

	if (step === "done") return null;
	if (step === "idle")
		return (
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="h-7 shrink-0 text-xs"
				onClick={() => setStep("confirm")}
			>
				Withdraw
			</Button>
		);
	return (
		<span className="flex shrink-0 items-center gap-1 text-xs">
			<span className="text-muted-foreground">Withdraw?</span>
			<Button
				type="button"
				variant="destructive"
				size="sm"
				className="h-7 text-xs"
				disabled={step === "busy"}
				onClick={() => void withdraw()}
			>
				{step === "busy" && (
					<Spinner aria-hidden="true" className="size-3.5" />
				)}
				Yes
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="h-7 text-xs"
				disabled={step === "busy"}
				onClick={() => setStep("idle")}
			>
				No
			</Button>
		</span>
	);
}
