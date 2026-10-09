import { useRef } from "react";
import {
	Button,
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@semoss/ui/next";
import { ReviewCard } from "@/features/collaboration/components/review-card";
import type { AttentionItem } from "./attention.model";
import { AttentionMemoryReview } from "./attention-memory-review";
import { AttentionWorkReview } from "./attention-work-review";

interface AttentionReviewSheetProps {
	/** Stable pending record being inspected. */
	item: AttentionItem;
	/** Whether the contextual review panel is open. */
	isOpen: boolean;
	/** Updates the owning card's panel state. */
	onOpenChange: (open: boolean) => void;
	/** Review button to restore focus to if its record still exists. */
	triggerId: string;
}

/** Source-specific decisions retain their existing commands and identities. */
export function AttentionReviewSheet({
	item,
	isOpen,
	onOpenChange,
	triggerId,
}: AttentionReviewSheetProps) {
	const titleRef = useRef<HTMLHeadingElement>(null);
	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent
				showCloseButton={false}
				className="w-full gap-0 sm:max-w-2xl"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					titleRef.current?.focus();
				}}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					requestAnimationFrame(() =>
						(
							document.getElementById(triggerId) ??
							document.querySelector<HTMLElement>(
								"[data-attention-heading]",
							) ??
							document.querySelector<HTMLElement>("main")
						)?.focus(),
					);
				}}
			>
				<SheetHeader className="gap-2 border-b p-6">
					<SheetTitle
						ref={titleRef}
						tabIndex={-1}
						className="break-words text-xl outline-none"
					>
						{item.title}
					</SheetTitle>
					<SheetDescription>{item.sourceLabel}</SheetDescription>
				</SheetHeader>
				<div className="min-h-0 flex-1 overflow-y-auto p-6">
					{item.kind === "work" && (
						<AttentionWorkReview
							item={item.item}
							onResolved={() => onOpenChange(false)}
						/>
					)}
					{item.kind === "review" && (
						<ReviewCard review={item.review} />
					)}
					{item.kind === "memory" && (
						<AttentionMemoryReview memory={item.memory} />
					)}
				</div>
				<SheetFooter className="border-t p-4">
					<SheetClose asChild>
						<Button
							variant="outline"
							className="pointer-coarse:min-h-11"
						>
							Close review
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
