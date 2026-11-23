import { useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	P,
	Small,
	toast,
} from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

type StatusMode = "archive" | "restore" | "hibernate" | "wake" | "accept";

interface WorkTopicsStatusDialogProps {
	open: boolean;
	mode: StatusMode;
	selectedTopicIds: Set<string>;
	allTopics: Topic[];
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

/** Dialog for bulk status changes: Archive, Restore, Hibernate, Wake. */
export function WorkTopicsStatusDialog({
	open,
	mode,
	selectedTopicIds,
	allTopics,
	onOpenChange,
	onSuccess,
}: WorkTopicsStatusDialogProps) {
	const { dispatch } = useCollaborationSession();
	const [isLoading, setIsLoading] = useState(false);

	// Get selected topic objects
	const selectedTopics = allTopics.filter((t) => selectedTopicIds.has(t.id));

	// Determine which topics are eligible for this action
	const { eligible, skipped } = getEligibleTopics(selectedTopics, mode);
	const eligibleCount = eligible.length;
	const skippedCount = skipped.length;

	// Get status info for this mode
	const statusInfo = getStatusInfo(mode);

	const handleConfirm = async () => {
		if (eligibleCount === 0) return;

		setIsLoading(true);
		try {
			// Dispatch status change for all eligible topics
			for (const topic of eligible) {
				dispatch({
					type: "topic.save",
					topic: {
						id: topic.id,
						status: statusInfo.newStatus,
					},
				});
			}

			// Add a small delay to simulate async operation and ensure loading state is visible
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Show success toast
			toast.success(
				`${statusInfo.action} ${eligibleCount} topic${eligibleCount === 1 ? "" : "s"}.`,
				{},
			);

			// Clear selection and close
			onSuccess?.();
			onOpenChange(false);
		} finally {
			setIsLoading(false);
		}
	};

	const isDisabled = eligibleCount === 0 || isLoading;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{statusInfo.title}</DialogTitle>
					<DialogDescription>
						{statusInfo.description}
					</DialogDescription>
				</DialogHeader>

				{/* Eligible topics list */}
				{eligibleCount > 0 && (
					<div className="space-y-2">
						<Small className="font-medium">
							Affecting {eligibleCount} topic
							{eligibleCount === 1 ? "" : "s"}:
						</Small>
						<ul className="max-h-48 space-y-1 overflow-y-auto rounded border border-border bg-muted/30 p-3">
							{eligible.map((topic) => (
								<li key={topic.id} className="text-sm">
									{topic.name}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Skipped topics notice */}
				{skippedCount > 0 && (
					<P className="text-muted-foreground text-sm">
						{skippedCount} topic{skippedCount === 1 ? "" : "s"}{" "}
						cannot be {statusInfo.skippedAction} (not eligible).
					</P>
				)}

				{/* Effect explanation */}
				<P className="text-muted-foreground text-sm">
					{statusInfo.explanation}
				</P>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant={statusInfo.variant}
						onClick={handleConfirm}
						disabled={isDisabled}
						aria-busy={isLoading}
					>
						{statusInfo.action}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** Determine which topics are eligible and which are skipped. */
function getEligibleTopics(
	selectedTopics: Topic[],
	mode: StatusMode,
): { eligible: Topic[]; skipped: Topic[] } {
	const eligible: Topic[] = [];
	const skipped: Topic[] = [];

	for (const topic of selectedTopics) {
		const isEligible = isEligibleForMode(topic, mode);
		if (isEligible) {
			eligible.push(topic);
		} else {
			skipped.push(topic);
		}
	}

	return { eligible, skipped };
}

/** Check if a topic is eligible for the given status mode. */
function isEligibleForMode(topic: Topic, mode: StatusMode): boolean {
	switch (mode) {
		case "archive":
			// Can archive: active, dormant, suggested (not archived)
			return topic.status !== "archived";
		case "restore":
			// Can restore: archived only
			return topic.status === "archived";
		case "hibernate":
			// Can hibernate: active or suggested
			return topic.status === "active" || topic.status === "suggested";
		case "wake":
			// Can wake: dormant only
			return topic.status === "dormant";
		case "accept":
			// Can accept: suggested only
			return topic.status === "suggested";
		default:
			return false;
	}
}

/** Get display info for each status mode. */
function getStatusInfo(mode: StatusMode): {
	title: string;
	description: string;
	action: string;
	skippedAction: string;
	newStatus: "active" | "dormant" | "archived";
	variant: "default" | "destructive";
	explanation: string;
} {
	switch (mode) {
		case "archive":
			return {
				title: "Archive topics?",
				description:
					"Archived topics are hidden from your main view but their conversations stay in chats.",
				action: "Archive",
				skippedAction: "archived",
				newStatus: "archived",
				variant: "default",
				explanation:
					"Archived topics will be hidden from the main topics list. You can restore them anytime.",
			};
		case "restore":
			return {
				title: "Restore topics?",
				description: "Restored topics will return to active status.",
				action: "Restore",
				skippedAction: "restored",
				newStatus: "active",
				variant: "default",
				explanation:
					"These topics will become active again and appear in your main topics list.",
			};
		case "hibernate":
			return {
				title: "Hibernate topics?",
				description:
					"Hibernated topics are paused—you won't get new notifications from them.",
				action: "Hibernate",
				skippedAction: "hibernated",
				newStatus: "dormant",
				variant: "default",
				explanation:
					"These topics will be paused. Resume them anytime by waking them up.",
			};
		case "wake":
			return {
				title: "Wake topics?",
				description:
					"Woken topics will resume sending you notifications.",
				action: "Wake",
				skippedAction: "woken",
				newStatus: "active",
				variant: "default",
				explanation:
					"These topics will become active again and start sending notifications.",
			};
		case "accept":
			return {
				title: "Accept topics?",
				description:
					"Accepted topics move from suggested to active and appear in your main view.",
				action: "Accept",
				skippedAction: "accepted",
				newStatus: "active",
				variant: "default",
				explanation:
					"These suggested topics will become active and start appearing in your main topics list.",
			};
	}
}
