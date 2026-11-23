import {
	split,
	useWorkItems,
} from "@/features/collaboration/components/work-items-list";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { countDueToday } from "./today-selectors";

/** The owner's work items due today or overdue: the same items, in the same list, as Today's Work card. */
export function useDueToday(now?: Date): number {
	const { state } = useCollaborationSession();
	const { items } = useWorkItems();
	return countDueToday(split(items ?? []).mine, state.profile.timezone, now);
}
