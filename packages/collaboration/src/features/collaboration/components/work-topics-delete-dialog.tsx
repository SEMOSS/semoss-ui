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

interface WorkTopicsDeleteDialogProps {
	open: boolean;
	selectedTopicIds: Set<string>;
	allTopics: Topic[];
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

/** Dialog for bulk delete: delete multiple selected topics. */
export function WorkTopicsDeleteDialog({
	open,
	selectedTopicIds,
	allTopics,
	onOpenChange,
	onSuccess,
}: WorkTopicsDeleteDialogProps) {
	const { dispatch } = useCollaborationSession();
	const [isLoading, setIsLoading] = useState(false);

	// Get selected topic objects
	const selectedTopics = allTopics.filter((t) => selectedTopicIds.has(t.id));
	const selectedCount = selectedTopics.length;

	const handleConfirm = async () => {
		if (selectedCount === 0) return;

		setIsLoading(true);
		try {
			// Add a small delay to simulate async operation and ensure loading state is visible
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Dispatch delete for all selected topics
			for (const topic of selectedTopics) {
				dispatch({
					type: "topic.delete",
					topicId: topic.id,
				});
			}

			// Show success toast (no undo toasts for delete in /brain/topics)
			toast.success(
				`Deleted ${selectedCount} topic${selectedCount === 1 ? "" : "s"}.`,
			);

			// Clear selection and close
			onSuccess?.();
			onOpenChange(false);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Delete topics?</DialogTitle>
					<DialogDescription>
						This action cannot be undone. Notes, people, and rules
						will be removed. The threads themselves will stay.
					</DialogDescription>
				</DialogHeader>

				{/* Selected topics list */}
				{selectedCount > 0 && (
					<div className="space-y-2">
						<Small className="font-medium">
							Deleting {selectedCount} topic
							{selectedCount === 1 ? "" : "s"}:
						</Small>
						<ul className="max-h-48 space-y-1 overflow-y-auto rounded border border-border bg-muted/30 p-3">
							{selectedTopics.map((topic) => (
								<li key={topic.id} className="text-sm">
									{topic.name}
								</li>
							))}
						</ul>
					</div>
				)}

				<P className="text-muted-foreground text-sm">
					After deletion, your selection will be cleared.
				</P>

				<DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						variant="outline"
						disabled={isLoading}
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						disabled={isLoading}
						onClick={handleConfirm}
						className="bg-destructive text-white hover:bg-destructive/90"
					>
						Delete topics
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
