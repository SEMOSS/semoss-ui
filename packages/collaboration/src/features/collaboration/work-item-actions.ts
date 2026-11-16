import { toast } from "@semoss/ui/next";
import type { WorkStepChange } from "./api/work-steps";
import type {
	CollaborationCommand,
	Thread,
	WorkItem,
} from "./state/collaboration.types";

type Dispatch = (command: CollaborationCommand) => void;

// "this never needed me": closes like Done, but stays a correction for the classifier
const NO_RESPONSE_NEEDED = "no_response_needed";

export function noResponseNeeded(dispatch: Dispatch, item: WorkItem) {
	dispatch({
		type: "item.update",
		itemId: item.id,
		changes: { status: "dismissed", closedReason: NO_RESPONSE_NEEDED },
	});
}

// no more Work from this conversation; it stays in Brain
export function ignoreThread(dispatch: Dispatch, thread: Thread) {
	dispatch({ type: "thread.mute", threadId: thread.id, muted: true });
	toast("Thread ignored. It stays filed; no new tasks come from it.", {
		action: {
			label: "Undo",
			onClick: () => resumeThread(dispatch, thread),
		},
	});
}

export function resumeThread(dispatch: Dispatch, thread: Thread) {
	dispatch({ type: "thread.mute", threadId: thread.id, muted: false });
}

/**
 * After a step was taken off the owner's list ("Not mine" or "Remove"), says so and offers to put it back.
 * Any other change says nothing.
 */
export function offerStepUndo(change: WorkStepChange, undo: () => void) {
	if (change.status !== "dropped") return;
	toast(
		change.note === "not mine"
			? "Step taken off your list."
			: "Step removed.",
		{ action: { label: "Undo", onClick: undo } },
	);
}
