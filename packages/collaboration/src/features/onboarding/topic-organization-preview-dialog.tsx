import { Button, DialogFooter, H3, P, Spinner } from "@semoss/ui/next";
import { Failure } from "./onboarding-ui";
import type { TopicOrganizationPreview } from "./topic-organization-api";
import { TopicReviewDialog } from "./topic-review-dialog";

interface TopicOrganizationPreviewDialogProps {
	preview: TopicOrganizationPreview;
	isBusy: boolean;
	error: string | null;
	triggerId: string;
	onAccept: () => void;
	onClose: () => void;
}

/** Show profile and reference consequences before adding structural changes to the saved draft. */
export function TopicOrganizationPreviewDialog({
	preview,
	isBusy,
	error,
	triggerId,
	onAccept,
	onClose,
}: TopicOrganizationPreviewDialogProps) {
	return (
		<TopicReviewDialog
			title="Review your grouping changes"
			description="Check the scope and saved references. These changes stay in your setup draft until you save your topics."
			isBusy={isBusy}
			triggerId={triggerId}
			onClose={onClose}
		>
			<P className="font-medium">
				{preview.beforeCount} topics → {preview.afterCount} topics kept
			</P>
			{preview.groups.map((group) => (
				<section
					key={group.targetKey}
					aria-label={`Preview ${group.name}`}
					className="space-y-3 border-t pt-4"
				>
					<H3 className="break-words text-lg">{group.name}</H3>
					<P className="whitespace-pre-wrap break-words text-sm">
						{group.description || "No description entered."}
					</P>
					<P className="text-muted-foreground text-sm">
						{group.topicKeys.length > 1 ? "Combines" : "Refines"}:{" "}
						{group.contributing
							.map((topic) => topic.name)
							.join(" · ")}
					</P>
					<P className="text-muted-foreground text-sm">
						Retains the profile for{" "}
						{
							group.contributing.find(
								(topic) => topic.key === group.targetKey,
							)?.name
						}
						. {group.examples} conversation examples support this
						scope.
					</P>
					{group.terms && (
						<P className="whitespace-pre-wrap break-words text-sm">
							Matching clues: {group.terms}
						</P>
					)}
					{group.topicKeys.length > 1 && (
						<P className="text-muted-foreground text-sm">
							On final save, combine{" "}
							{group.impact.linkedConversations} saved
							conversation links, {group.impact.people} people
							references, {group.impact.notes} notes/goals and{" "}
							{group.impact.rules} rules into the retained topic.
							Update topic references on {group.impact.workItems}{" "}
							Work items and {group.impact.steps} checklist steps.
						</P>
					)}
					{group.impact.pendingRelationships > 0 && (
						<P className="text-muted-foreground text-sm">
							Align {group.impact.pendingRelationships} pending
							conversation choices to this scope.
							{group.impact.positiveOverExclusion > 0
								? ` Preserve ${group.impact.positiveOverExclusion} positive relationships where a narrower contributing topic was excluded.`
								: ""}
						</P>
					)}
					{!group.canApply && (
						<P className="text-destructive text-sm">
							{group.reason}
						</P>
					)}
				</section>
			))}
			<P className="text-muted-foreground text-sm">
				Unreviewed examples are matched after setup is saved. Existing
				rooms, task completion and unrelated topic links are preserved.
			</P>
			{error && <Failure error={error} />}
			<DialogFooter>
				<Button
					type="button"
					variant="outline"
					disabled={isBusy}
					onClick={onClose}
				>
					Back to topics
				</Button>
				<Button
					type="button"
					disabled={
						isBusy ||
						!!error ||
						preview.groups.some((group) => !group.canApply)
					}
					onClick={onAccept}
				>
					{isBusy && <Spinner className="size-4" />}
					{isBusy
						? "Saving draft changes…"
						: "Use this grouping in my draft"}
				</Button>
			</DialogFooter>
		</TopicReviewDialog>
	);
}
