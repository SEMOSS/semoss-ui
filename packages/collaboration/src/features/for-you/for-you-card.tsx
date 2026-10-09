import { useDraggable } from "@dnd-kit/core";
import { ArrowUpRight, CalendarDays, GripVertical } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { isRequestUserInputAction } from "@semoss/sdk";
import {
	Badge,
	Button,
	cn,
	H3,
	P,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { dateLabel } from "@/features/collaboration/date-label";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { topicTone } from "@/features/collaboration/topic-tone";
import { roomPath } from "@/lib/workspace-paths";
import type { ForYouItem } from "./for-you.model";
import { ForYouPriorityMenu } from "./for-you-priority-menu";
import { ForYouReviewSheet } from "./for-you-review-sheet";

interface ForYouCardProps {
	/** A pending request with its owning source and review action. */
	item: ForYouItem;
	/** Board cards and compact rows share the same controls. */
	view: "board" | "list";
}

/** Explain why attention is needed and open only that record's review flow. */
export function ForYouCard({ item, view }: ForYouCardProps) {
	const { state } = useCollaborationSession();
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		isDragging,
	} = useDraggable({ id: item.id, disabled: view === "list" });
	const isList = view === "list";
	const topics = state.topics.filter(({ id }) => item.topicIds.includes(id));
	const reviewId = `for-you-review-${item.id}`;
	const roomId =
		item.kind === "run"
			? item.run.roomId
			: item.kind === "action"
				? item.delegation?.roomId || item.run?.roomId
				: null;
	const path = roomId
		? roomPath(
				roomId,
				item.kind === "action" && !item.delegation
					? item.action?.toolCallId || item.action?.actionId
					: undefined,
			)
		: null;
	const isExternalReview = item.kind === "action" || item.kind === "run";
	const isQuestion =
		item.kind === "run" ||
		(item.kind === "action" &&
			(Boolean(item.delegation) ||
				(item.action &&
					isRequestUserInputAction({
						toolName: item.action.toolName ?? null,
						toolMeta: item.action.toolMeta,
					}))));
	const label =
		item.kind === "memory"
			? "Memory suggestion"
			: item.kind === "review"
				? "Brain suggestion"
				: isQuestion
					? "Question for you"
					: item.kind === "action"
						? "Approval needed"
						: item.kind === "work" && item.item.askType === "reply"
							? "Reply to review"
							: "Review needed";
	const actionLabel = isQuestion
		? "Respond"
		: item.kind === "review" || item.kind === "memory"
			? "Review suggestion"
			: "Review";
	return (
		<article
			ref={setNodeRef}
			aria-label={item.title}
			className={cn(
				"group/review min-w-0 rounded-xl border bg-card p-4 transition-colors focus-within:border-primary/50 hover:border-primary/35",
				isList &&
					"flex @2xl/reviews:flex-row flex-col @2xl/reviews:items-center @2xl/reviews:gap-6 gap-3 rounded-none border-0 border-b last:border-b-0",
				isDragging && "opacity-40",
			)}
		>
			<div className="min-w-0 flex-1 space-y-2.5">
				<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
					<span>{label}</span>
					{item.isSample && (
						<Badge
							variant="outline"
							className="font-normal text-xs"
						>
							Sample
						</Badge>
					)}
				</div>
				<H3 className="break-words font-medium text-base leading-snug">
					{path ? (
						<Link
							to={path}
							className="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
						>
							{item.title}
						</Link>
					) : !isExternalReview ? (
						<button
							type="button"
							onClick={() => setIsReviewOpen(true)}
							className="rounded-sm text-start hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
						>
							{item.title}
						</button>
					) : (
						item.title
					)}
				</H3>
				{item.detail && (
					<P className="line-clamp-2 break-words text-muted-foreground text-sm leading-relaxed">
						{item.detail}
					</P>
				)}
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
					{topics.map((topic) => (
						<span
							key={topic.id}
							className="inline-flex max-w-full items-center gap-1.5 text-muted-foreground text-xs"
						>
							<span
								aria-hidden="true"
								className={cn(
									"size-2 shrink-0 rounded-xs",
									topicTone(topic.id),
								)}
							/>
							<span className="truncate">
								{topic.short || topic.name}
							</span>
						</span>
					))}
					{item.topicStatus !== "ready" ? (
						<Small className="text-muted-foreground text-xs">
							{item.topicStatus === "loading"
								? "Checking topic…"
								: "Topic unavailable"}
						</Small>
					) : (
						!topics.length && (
							<Small className="text-muted-foreground text-xs">
								{item.topicIds.length
									? "Topic unavailable"
									: "No topic"}
							</Small>
						)
					)}
					{item.due && (
						<Small className="inline-flex items-center gap-1 text-muted-foreground text-xs">
							<CalendarDays
								aria-hidden="true"
								className="size-3"
							/>
							Due {dateLabel(item.due, undefined, "date")}
						</Small>
					)}
				</div>
			</div>
			<div
				className={cn(
					"mt-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-3 border-t pt-3",
					isList &&
						"mt-0 @2xl/reviews:w-56 @2xl/reviews:shrink-0 @2xl/reviews:border-0 @2xl/reviews:pt-0",
				)}
			>
				<div className="flex min-w-0 max-w-full items-center gap-1">
					{!isList && (
						<Tooltip disableHoverableContent={false}>
							<TooltipTrigger asChild>
								<Button
									ref={setActivatorNodeRef}
									variant="ghost"
									size="icon-sm"
									{...attributes}
									{...listeners}
									aria-label={`Drag ${item.title} to change priority`}
									className="-ml-2 pointer-coarse:size-11 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
								>
									<GripVertical
										aria-hidden="true"
										className="size-4"
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								Drag to change priority, or use the priority
								menu.
							</TooltipContent>
						</Tooltip>
					)}
					<Small
						className="max-w-40 truncate text-muted-foreground text-xs"
						title={item.sourceLabel}
					>
						{item.sourceLabel}
					</Small>
				</div>
				<ForYouPriorityMenu item={item} />
				{path ? (
					<Button
						id={reviewId}
						asChild
						variant="outline"
						size="sm"
						className="pointer-coarse:min-h-11 w-full"
					>
						<Link to={path}>
							{actionLabel}
							<ArrowUpRight
								aria-hidden="true"
								className="ml-auto size-3.5"
							/>
						</Link>
					</Button>
				) : isExternalReview ? (
					<P className="w-full text-muted-foreground text-xs">
						The review conversation is unavailable. Refresh to check
						again.
					</P>
				) : (
					<Button
						id={reviewId}
						variant="outline"
						size="sm"
						onClick={() => setIsReviewOpen(true)}
						className="pointer-coarse:min-h-11 w-full"
					>
						{actionLabel}
						<ArrowUpRight
							aria-hidden="true"
							className="ml-auto size-3.5"
						/>
					</Button>
				)}
			</div>
			{!isExternalReview && (
				<ForYouReviewSheet
					item={item}
					isOpen={isReviewOpen}
					onOpenChange={setIsReviewOpen}
					triggerId={reviewId}
				/>
			)}
		</article>
	);
}
