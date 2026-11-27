import { useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
	toast,
} from "@semoss/ui/next";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

interface WorkTopicsMergeDialogProps {
	open: boolean;
	selectedTopicIds: Set<string>;
	allTopics: Topic[];
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

/** Dialog for bulk merge: merge multiple selected topics into one target. */
export function WorkTopicsMergeDialog({
	open,
	selectedTopicIds,
	allTopics,
	onOpenChange,
	onSuccess,
}: WorkTopicsMergeDialogProps) {
	const { dispatch } = useCollaborationSession();
	const fieldId = useId();
	const [isLoading, setIsLoading] = useState(false);
	const [targetId, setTargetId] = useState("");

	// Get selected topic objects
	const selectedTopics = allTopics.filter((t) => selectedTopicIds.has(t.id));
	const selectedCount = selectedTopics.length;

	// Get available target topics (any topic not in the selection)
	const targets = allTopics.filter((t) => !selectedTopicIds.has(t.id));
	const target = targets.find((t) => t.id === targetId);

	const handleConfirm = async () => {
		if (!target || selectedCount === 0) return;

		setIsLoading(true);
		try {
			// Add a small delay to simulate async operation and ensure loading state is visible
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Dispatch merge for all selected topics into the target
			for (const topic of selectedTopics) {
				dispatch({
					type: "topic.merge",
					sourceId: topic.id,
					targetId: target.id,
				});
			}

			// Show success toasts
			for (const topic of selectedTopics) {
				toast.success(`Merged ${topic.name} into ${target.name}.`);
			}

			// Clear selection and close
			onSuccess?.();
			onOpenChange(false);
		} finally {
			setIsLoading(false);
		}
	};

	const isDisabled = !target || isLoading;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Merge topics?</DialogTitle>
					<DialogDescription>
						The threads, people, notes, keywords, and rules from
						each selected topic move to your chosen target, and the
						selected topics are removed.
					</DialogDescription>
				</DialogHeader>

				{/* Selected topics list */}
				{selectedCount > 0 && (
					<div className="space-y-2">
						<Small className="font-medium">
							Merging {selectedCount} topic
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

				{/* Target picker */}
				<div className="space-y-2">
					<Label htmlFor={`${fieldId}-target`}>Merge into</Label>
					<Select value={targetId} onValueChange={setTargetId}>
						<SelectTrigger id={`${fieldId}-target`}>
							<SelectValue placeholder="Choose a topic" />
						</SelectTrigger>
						<SelectContent>
							{targets.map((t) => (
								<SelectItem key={t.id} value={t.id}>
									{t.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<P className="text-muted-foreground text-sm">
					After merging, your selection will be cleared.
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
						disabled={isDisabled}
						onClick={handleConfirm}
					>
						Merge
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
