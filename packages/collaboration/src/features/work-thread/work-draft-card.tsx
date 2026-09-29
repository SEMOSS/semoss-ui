import {
	ArrowUpRight,
	Check,
	CircleAlert,
	CircleX,
	FilePenLine,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import { Badge, Button, cn, Small, Spinner } from "@semoss/ui/next";
import {
	type EmailDraftEditor,
	emailDraftStatus,
} from "@/features/connectors/api/email-draft-editor";
import { draftText } from "@/features/email/email-html";
import { useWorkEmail } from "./work-email.context";
import { WORK_REFERENCE_CARD_CLASS_NAME } from "./work-reference.styles";

/** A local draft stays reachable after its editor tab closes. */
export function WorkDraftCard({ draft }: { draft: EmailDraftEditor }) {
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
		<Button
			type="button"
			variant="outline"
			className={cn(WORK_REFERENCE_CARD_CLASS_NAME, "w-full")}
			aria-label={
				draft.seed.assistantMessageId ? "Open draft" : undefined
			}
			onClick={() => composer.requestEmailDraft(draft.seed)}
		>
			<span
				aria-hidden="true"
				className={cn(
					"flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground",
					isSaved && "bg-success/10 text-success",
					needsAttention && "bg-warning/10 text-warning",
					isFailed && "bg-destructive/10 text-destructive",
				)}
			>
				{snapshot.isSaving ? (
					<Spinner className="size-5 motion-reduce:animate-none" />
				) : (
					<Icon className="size-5" />
				)}
			</span>
			<span className="flex min-w-0 flex-1 flex-col gap-1">
				<Small className="break-words font-medium text-base">
					{draft.seed.assistantMessageId
						? "Open draft"
						: snapshot.values.subject ||
							(draft.seed.mode === "reply"
								? "Reply draft"
								: "Email draft")}
				</Small>
				<Small className="break-words font-normal text-muted-foreground">
					{snapshot.values.to
						? `To ${snapshot.values.to}`
						: draft.seed.mode === "reply"
							? "Reply to original email"
							: "Email draft"}
				</Small>
				<Small className="line-clamp-2 break-words font-normal text-base text-muted-foreground leading-relaxed">
					{draftText(snapshot.values.body, "html") ||
						"Continue writing your draft"}
				</Small>
				<Badge
					variant="secondary"
					className={cn(
						"max-w-full whitespace-normal font-normal",
						isSaved && "bg-success/10 text-success",
						needsAttention && "bg-warning/10 text-warning",
						isFailed && "bg-destructive/10 text-destructive",
					)}
				>
					{status}
				</Badge>
			</span>
			<ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
		</Button>
	);
}
