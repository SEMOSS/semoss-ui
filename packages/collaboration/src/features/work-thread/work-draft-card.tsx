import { Check, CircleAlert, CircleX, FilePenLine } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Badge, cn, Spinner } from "@semoss/ui/next";
import {
	type EmailDraftEditor,
	emailDraftStatus,
} from "@/features/connectors/api/email-draft-editor";
import { WorkDraftPreview } from "./work-draft-preview";
import { useWorkEmail } from "./work-email.context";

/** Live draft preview in the thread; editing remains in its retained Work panel. */
export function WorkDraftCard({
	draft,
	isExpanded,
	onExpandedChange,
}: {
	draft: EmailDraftEditor;
	isExpanded: boolean;
	onExpandedChange: (isExpanded: boolean) => void;
}) {
	const { composer } = useWorkEmail();
	const snapshot = useSyncExternalStore(
		draft.subscribe,
		draft.getSnapshot,
		draft.getSnapshot,
	);
	const status = emailDraftStatus(snapshot);
	const isSaved = status === "Saved to Outlook";
	const needsAttention = status === "Needs attention";
	const isFailed =
		needsAttention && Boolean(snapshot.error) && !snapshot.isUncertain;
	const Icon = isFailed
		? CircleX
		: needsAttention
			? CircleAlert
			: isSaved
				? Check
				: FilePenLine;
	return (
		<WorkDraftPreview
			itemId={`draft:${draft.seed.id}`}
			subject={
				snapshot.values.subject ||
				(draft.seed.mode === "reply" ? "Reply draft" : "Email draft")
			}
			to={snapshot.values.to}
			cc={snapshot.values.cc}
			body={snapshot.values.body}
			attachments={snapshot.values.files.map(({ file }) => file.name)}
			isExpanded={isExpanded}
			onExpandedChange={onExpandedChange}
			onOpen={() => composer.requestEmailDraft(draft.seed)}
			status={
				<Badge
					variant="secondary"
					className={cn(
						"max-w-full whitespace-normal font-normal",
						isSaved && "bg-success/10 text-success",
						needsAttention && "bg-warning/10 text-warning",
						isFailed && "bg-destructive/10 text-destructive",
					)}
				>
					{snapshot.isSaving ? (
						<Spinner className="size-4 motion-reduce:animate-none" />
					) : (
						<Icon className="size-4" aria-hidden="true" />
					)}
					Draft · {status}
				</Badge>
			}
		/>
	);
}
