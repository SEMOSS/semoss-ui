import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";

interface ActionEligibility {
	archive: boolean;
	restore: boolean;
	hibernate: boolean;
	wake: boolean;
	accept: boolean;
	merge: boolean;
	delete: boolean;
}

/** Determine which actions are eligible based on selected topics' statuses. */
export function determineActionEligibility(
	selectedTopics: Topic[],
	totalTopics: number, // all topics (for merge eligibility)
): ActionEligibility {
	if (selectedTopics.length === 0) {
		return {
			archive: false,
			restore: false,
			hibernate: false,
			wake: false,
			accept: false,
			merge: false,
			delete: false,
		};
	}

	const hasArchived = selectedTopics.some((t) => t.status === "archived");
	const hasNonArchived = selectedTopics.some((t) => t.status !== "archived");
	const hasActive = selectedTopics.some((t) => t.status === "active");
	const hasDormant = selectedTopics.some((t) => t.status === "dormant");
	const hasSuggested = selectedTopics.some((t) => t.status === "suggested");

	// Archive: enabled if any selected topic is not archived
	const archiveEligible = hasNonArchived;

	// Restore: enabled if any selected topic is archived
	const restoreEligible = hasArchived;

	// Hibernate: enabled if any selected topic is active or suggested
	const hibernateEligible = hasActive || hasSuggested;

	// Wake: enabled if any selected topic is dormant
	const wakeEligible = hasDormant;

	// Accept: enabled if any selected topic is suggested
	const acceptEligible = hasSuggested;

	// Merge: enabled if at least one other topic exists (outside selection)
	const mergeEligible = selectedTopics.length < totalTopics;

	// Delete: always enabled if something is selected
	const deleteEligible = true;

	return {
		archive: archiveEligible,
		restore: restoreEligible,
		hibernate: hibernateEligible,
		wake: wakeEligible,
		accept: acceptEligible,
		merge: mergeEligible,
		delete: deleteEligible,
	};
}

interface WorkTopicsActionsDropdownProps {
	/** Selected topic IDs */
	selectedTopicIds: Set<string>;
	/** All topics (needed to find which ones are selected and for merge eligibility) */
	allTopics: Topic[];
	/** Callback when user selects an action */
	onArchive?: () => void;
	onRestore?: () => void;
	onHibernate?: () => void;
	onWake?: () => void;
	onAccept?: () => void;
	onMerge?: () => void;
	onDelete?: () => void;
}

/** Dropdown menu for bulk topic actions (Archive, Restore, Hibernate, Wake, Merge, Delete). */
export function WorkTopicsActionsDropdown({
	selectedTopicIds,
	allTopics,
	onArchive,
	onRestore,
	onHibernate,
	onWake,
	onAccept,
	onMerge,
	onDelete,
}: WorkTopicsActionsDropdownProps) {
	const [open, setOpen] = useState(false);

	// Get selected topic objects
	const selectedTopics = allTopics.filter((t) => selectedTopicIds.has(t.id));

	// Determine which actions are eligible
	const eligibility = determineActionEligibility(
		selectedTopics,
		allTopics.length,
	);

	const isDisabled = selectedTopicIds.size === 0;

	const handleAction = (callback?: () => void) => {
		if (callback) {
			callback();
		}
		setOpen(false);
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					disabled={isDisabled}
					className="pointer-coarse:min-h-11 gap-2"
				>
					Actions
					<ChevronDown aria-hidden="true" className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				{/* Status change actions */}
				<DropdownMenuItem
					disabled={!eligibility.archive}
					onSelect={() => handleAction(onArchive)}
				>
					Archive
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={!eligibility.restore}
					onSelect={() => handleAction(onRestore)}
				>
					Restore
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={!eligibility.accept}
					onSelect={() => handleAction(onAccept)}
				>
					Accept
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={!eligibility.hibernate}
					onSelect={() => handleAction(onHibernate)}
				>
					Hibernate
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={!eligibility.wake}
					onSelect={() => handleAction(onWake)}
				>
					Wake
				</DropdownMenuItem>

				{/* Structural actions */}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					disabled={!eligibility.merge}
					onSelect={() => handleAction(onMerge)}
				>
					Merge
				</DropdownMenuItem>
				<DropdownMenuItem
					variant="destructive"
					disabled={!eligibility.delete}
					onSelect={() => handleAction(onDelete)}
				>
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
