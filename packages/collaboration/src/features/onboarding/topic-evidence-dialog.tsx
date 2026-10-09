import { RefreshCw, RotateCcw } from "lucide-react";
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
	Spinner,
} from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { Failure } from "./onboarding-ui";
import type { TopicReviewChange } from "./topic-evidence-api";
import { TopicEvidenceRow } from "./topic-evidence-row";
import { TopicEvidenceSearch } from "./topic-evidence-search";
import type { TopicDraft, TopicReview } from "./topic-review-api";
import { useTopicEvidence } from "./use-topic-evidence";

interface TopicEvidenceDialogProps {
	/** The review and profile form remain mounted while evidence is open. */
	actions: InsightActions;
	review: TopicReview;
	topics: TopicDraft[];
	topic: TopicDraft;
	isChanging: boolean;
	isReloading: boolean;
	changeError: string | null;
	onChange: (change: TopicReviewChange) => void;
	onRetry: () => void;
	onReload: () => void;
	onClose: () => void;
	/** Restore focus to the exact inspect button that opened this dialog. */
	trigger: HTMLButtonElement | null;
	triggerId: string;
}

/** Evidence is contextual to onboarding; it never takes over a collaboration room. */
export function TopicEvidenceDialog({
	actions,
	review,
	topics,
	topic,
	isChanging,
	isReloading,
	changeError,
	onChange,
	onRetry,
	onReload,
	onClose,
	trigger,
	triggerId,
}: TopicEvidenceDialogProps) {
	const [query, setQuery] = useState("");
	const [offset, setOffset] = useState(0);
	const evidence = useTopicEvidence(
		actions,
		review,
		topic.key,
		query,
		offset,
	);
	const page = evidence.page;
	const history = review.draft.history ?? [];
	const latest = history.at(-1);
	const isBusy = isChanging || isReloading;
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !isBusy) onClose();
			}}
		>
			<DialogContent
				className="min-w-0 motion-reduce:animate-none sm:max-w-5xl"
				showCloseButton={!isBusy}
				onEscapeKeyDown={(event) => {
					if (isBusy) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isBusy) event.preventDefault();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					(trigger?.isConnected
						? trigger
						: document.getElementById(triggerId)
					)?.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle className="break-words">
						Review conversations for {topic.name || "this topic"}
					</DialogTitle>
					<DialogDescription>
						These are imported examples and existing links. Confirm
						or correct relationships in the draft; they take effect
						when you save this setup. Unreviewed conversations are
						matched after saving.
					</DialogDescription>
				</DialogHeader>
				<TopicEvidenceSearch
					query={query}
					isBusy={isBusy}
					onSearch={(query) => {
						setQuery(query);
						setOffset(0);
					}}
				/>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<P className="text-muted-foreground text-sm">
						{page
							? `${page.total} conversations · ${page.scope}`
							: "Imported conversation examples"}
					</P>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						disabled={isBusy || evidence.isLoading}
						onClick={evidence.refresh}
					>
						<RefreshCw aria-hidden="true" /> Refresh examples
					</Button>
				</div>
				{evidence.isLoading && (
					<output className="flex items-center gap-2 text-sm">
						<Spinner className="size-4" /> Loading conversation
						examples…
					</output>
				)}
				{evidence.error && (
					<Failure
						error={evidence.error}
						onRetry={evidence.refresh}
					/>
				)}
				{changeError && (
					<div className="space-y-2">
						<Failure
							error={changeError}
							onRetry={isBusy ? undefined : onRetry}
						/>
						<Button
							type="button"
							variant="outline"
							disabled={isBusy}
							onClick={onReload}
						>
							Reload saved review
						</Button>
					</div>
				)}
				{!evidence.isLoading && page?.items.length === 0 && (
					<P>
						No readable conversation examples are available
						{query ? " for this search" : " yet"}. You can keep the
						topic and refine its scope.
					</P>
				)}
				{page && (
					<div
						aria-busy={isBusy || evidence.isLoading}
						className="min-w-0"
					>
						{page.items.map((item) => (
							<TopicEvidenceRow
								key={item.id}
								actions={actions}
								review={review}
								topics={topics}
								topic={topic}
								item={item}
								isBusy={
									isBusy ||
									evidence.isLoading ||
									!!changeError
								}
								onChange={onChange}
							/>
						))}
					</div>
				)}
				{page && page.hiddenOrUnavailable > 0 && (
					<P className="text-muted-foreground text-sm">
						{page.hiddenOrUnavailable} examples are hidden by your
						settings or no longer available.
					</P>
				)}
				{page?.limited && (
					<P className="text-muted-foreground text-sm">
						This preview is limited to 1,000 imported examples for
						this topic.
					</P>
				)}
				{page && (offset > 0 || page.hasMore) && (
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="outline"
							disabled={
								offset === 0 || isBusy || evidence.isLoading
							}
							onClick={() =>
								setOffset((offset) => Math.max(0, offset - 20))
							}
						>
							Previous examples
						</Button>
						<P className="text-sm">
							{page.offset + 1}–{page.offset + page.items.length}{" "}
							of {page.total}
						</P>
						<Button
							type="button"
							variant="outline"
							disabled={
								!page.hasMore || isBusy || evidence.isLoading
							}
							onClick={() => setOffset((offset) => offset + 20)}
						>
							Next examples
						</Button>
					</div>
				)}
				<output className="break-words text-sm">
					{isReloading
						? "Reloading saved review…"
						: isChanging
							? "Saving conversation correction…"
							: review.draft.lastChange
								? `${review.draft.lastChange}. Saved to draft.`
								: "Conversation corrections will be saved to this draft."}
				</output>
				<DialogFooter className="flex-wrap">
					{latest && (
						<Button
							type="button"
							variant="outline"
							disabled={isBusy || !!changeError}
							onClick={() =>
								onChange({ type: "undo", changeId: latest.id })
							}
						>
							<RotateCcw aria-hidden="true" /> Undo last
							correction
						</Button>
					)}
					<Button type="button" disabled={isBusy} onClick={onClose}>
						Done reviewing
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
