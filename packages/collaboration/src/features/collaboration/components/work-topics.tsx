import { ArrowRight, Inbox, Layers, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	Checkbox,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Small,
} from "@semoss/ui/next";
import { formatDateToRelative } from "@semoss/utility/date";
import { BriefPanel } from "@/features/dashboard/brief-panel";
import { MailCheckStatus } from "@/features/dashboard/mail-check-status";
import { topicPath } from "@/lib/workspace-paths";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { memoriesAbout } from "../state/memory";
import { CollaborationHeroHeader } from "./collaboration-hero-header";
import { CollaborationHeroPage } from "./collaboration-hero-page";
import { TopicDot } from "./topic-dot";
import { TopicEditor } from "./topic-editor";
import { useWorkItems, waitingOn } from "./work-items-list";
import { WorkTopicsActionsDropdown } from "./work-topics-actions-dropdown";
import { WorkTopicsDeleteDialog } from "./work-topics-delete-dialog";
import { WorkTopicsMergeDialog } from "./work-topics-merge-dialog";
import { WorkTopicsStatusDialog } from "./work-topics-status-dialog";

interface WorkTopicsProps {
	/** Callback when selection changes (for Feature 4: bulk actions). */
	onSelectionChange?: (selectedIds: Set<string>) => void;
}

/** Helper to render stats label with count */
function StatItem({ count, label }: { count: number; label: string }) {
	const textClassName = count === 0 ? "text-muted-foreground/50" : "";
	return (
		<span className={`text-xs ${textClassName}`}>
			{count} {label}
		</span>
	);
}

/** The topics that give each action its purpose, each opening its own page. */
export function WorkTopics({ onSelectionChange }: WorkTopicsProps) {
	const { state } = useCollaborationSession();
	const { items, isMine } = useWorkItems();
	const [isCreating, setIsCreating] = useState(false);
	const [statusFilter, setStatusFilter] = useState<string[]>([
		"active",
		"dormant",
		"suggested",
	]);
	const [selectedFilterOption, setSelectedFilterOption] = useState<string>(
		"active,dormant,suggested",
	);
	const [accountFilter, setAccountFilter] = useState<string | null>(null);
	const [selectedAccountOption, setSelectedAccountOption] =
		useState<string>("all");
	const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(
		new Set(),
	);
	const [statusDialogMode, setStatusDialogMode] = useState<
		"archive" | "restore" | "hibernate" | "wake" | "accept" | null
	>(null);
	const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const createButtonRef = useRef<HTMLButtonElement>(null);
	const topics = state.topics.filter((topic) => {
		const matchesStatus = statusFilter.includes(topic.status);
		const matchesAccount =
			accountFilter === null ||
			accountFilter === "all" ||
			(accountFilter === "none" && topic.accountId === null) ||
			(accountFilter !== "none" && topic.accountId === accountFilter);
		return matchesStatus && matchesAccount;
	});
	const openReviews = state.reviews.filter(
		(review) => review.status === "open",
	).length;

	// Prune selection when filters change: remove IDs that are no longer in the filtered list
	useEffect(() => {
		const visibleIds = new Set(topics.map((t) => t.id));
		const prunedSelection = new Set(
			Array.from(selectedTopicIds).filter((id) => visibleIds.has(id)),
		);
		if (prunedSelection.size !== selectedTopicIds.size) {
			setSelectedTopicIds(prunedSelection);
			onSelectionChange?.(prunedSelection);
		}
	}, [topics, selectedTopicIds, onSelectionChange]);

	// Determine select-all state: checked if all visible rows are selected, indeterminate if some are
	const allVisible = topics.map((t) => t.id);
	const selectedCount = selectedTopicIds.size;
	const isAllSelected =
		allVisible.length > 0 && selectedCount === allVisible.length;
	const isIndeterminate =
		selectedCount > 0 && selectedCount < allVisible.length;

	const toggleTopicSelection = (topicId: string) => {
		const newSelection = new Set(selectedTopicIds);
		if (newSelection.has(topicId)) {
			newSelection.delete(topicId);
		} else {
			newSelection.add(topicId);
		}
		setSelectedTopicIds(newSelection);
		onSelectionChange?.(newSelection);
	};

	const toggleSelectAll = () => {
		if (isAllSelected) {
			setSelectedTopicIds(new Set());
			onSelectionChange?.(new Set());
		} else {
			const newSelection = new Set(allVisible);
			setSelectedTopicIds(newSelection);
			onSelectionChange?.(newSelection);
		}
	};

	const create = (
		<Button
			ref={createButtonRef}
			size="sm"
			className="pointer-coarse:min-h-11"
			onClick={() => setIsCreating(true)}
		>
			<Plus aria-hidden="true" /> New topic
		</Button>
	);
	const list = topics.length ? (
		<ul aria-label="Work topics" className="divide-y divide-border">
			{topics.map((topic) => {
				// the owner's kept work items on this topic, and those waiting on someone
				const work = (items ?? []).filter(
					(item) => !item.proposed && item.topicId === topic.id,
				);
				const open = work.length;
				const waiting = work.filter((item) =>
					waitingOn(item, isMine),
				).length;
				const memories = memoriesAbout(state.memories, {
					type: "topic",
					id: topic.id,
				}).length;
				const relativeDate = topic.stats.lastActivity
					? formatDateToRelative(topic.stats.lastActivity)
					: "";
				const isSelected = selectedTopicIds.has(topic.id);
				return (
					<li key={topic.id} className="flex items-stretch">
						<div className="flex items-center px-4 py-4">
							<Checkbox
								checked={isSelected}
								onCheckedChange={() =>
									toggleTopicSelection(topic.id)
								}
								aria-label={`Select ${topic.name}`}
								className="pointer-coarse:h-6 pointer-coarse:w-6"
							/>
						</div>
						<Link
							to={topicPath(topic.id)}
							// the hero's card has padding of its own, so a row only reaches a little past the text
							className="-mx-2 flex min-w-0 flex-1 flex-col rounded-lg px-2 py-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
						>
							<div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
								<div className="min-w-0 flex-1 space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<Small className="flex items-center gap-2 break-words font-medium text-base">
											{/* TopicDot is size-3 for better visibility */}
											<TopicDot
												topic={topic}
												size="size-3"
											/>
											{topic.name}
										</Small>
										<Badge
											variant="outline"
											className="font-normal capitalize"
										>
											{topic.status}
										</Badge>
										{topic.isSample && (
											<Badge variant="secondary">
												Sample
											</Badge>
										)}
									</div>
									<P className="max-w-prose break-words text-muted-foreground text-sm leading-relaxed">
										{topic.description ||
											"No description yet."}
									</P>
									<div className="flex flex-wrap gap-4 pt-1 text-muted-foreground text-xs">
										<StatItem
											count={topic.stats.threads}
											label="Threads"
										/>
										<StatItem
											count={topic.stats.chats}
											label="Chats"
										/>
										<StatItem
											count={topic.files?.length ?? 0}
											label="Files"
										/>
										<StatItem
											count={memories}
											label="Memories"
										/>
									</div>
								</div>
								<div className="flex shrink-0 flex-col items-end gap-2 pl-4 sm:pl-0">
									<div className="flex shrink-0 items-center gap-4 whitespace-nowrap text-muted-foreground text-sm tabular-nums">
										{items !== null ? (
											<>
												<span>{open} open</span>
												<span>{waiting} waiting</span>
											</>
										) : null}
										<ArrowRight
											aria-hidden="true"
											className="size-4"
										/>
									</div>
									{relativeDate && (
										<div className="whitespace-nowrap text-muted-foreground text-xs">
											<span>Last activity </span>
											<span
												title={new Date(
													topic.stats.lastActivity,
												).toLocaleString()}
												className="font-medium"
											>
												{relativeDate}
											</span>
										</div>
									)}
								</div>
							</div>
						</Link>
					</li>
				);
			})}
		</ul>
	) : (
		<div className="space-y-2">
			<P>No topics yet.</P>
			<P className="text-muted-foreground text-sm">
				Create a topic to group your work items.
			</P>
		</div>
	);
	const editor = isCreating && (
		<TopicEditor
			returnFocusRef={createButtonRef}
			onClose={() => setIsCreating(false)}
		/>
	);

	return (
		<CollaborationHeroPage>
			<CollaborationHeroHeader
				title="Your topics."
				description="Choose a topic to focus on its actions, threads, and sessions."
			>
				<MailCheckStatus />
				<Separator
					orientation="vertical"
					className="data-[orientation=vertical]:h-4"
				/>
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="pointer-coarse:min-h-11 text-foreground"
				>
					<Link to="/work">
						<Layers aria-hidden="true" />
						All work
					</Link>
				</Button>
			</CollaborationHeroHeader>
			{openReviews > 0 && (
				<div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/15 bg-primary/5 px-5 py-4">
					<div className="flex min-w-0 items-center gap-3.5">
						<span
							aria-hidden="true"
							className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-xs"
						>
							<Inbox className="size-4" />
						</span>
						<div className="min-w-0">
							<P className="font-semibold text-sm">
								{openReviews}{" "}
								{openReviews === 1
									? "conversation needs"
									: "conversations need"}{" "}
								topic review
							</P>
							<P className="text-muted-foreground text-xs">
								Confirm which topic these emails and chats
								belong to.
							</P>
						</div>
					</div>
					<Button asChild variant="outline" size="sm">
						<Link to="/brain">
							Review filing
							<ArrowRight aria-hidden="true" className="size-4" />
						</Link>
					</Button>
				</div>
			)}

			{topics.length ? (
				<BriefPanel
					title="All topics"
					count={topics.length}
					detail={create}
				>
					{/* Filter toolbar - positioned between "All topics" heading and topic list */}
					{topics.length > 0 && (
						<div className="mb-4 flex flex-col gap-3 border-border border-b pb-4">
							{/* Top row: Select-all checkbox, Actions button (always visible), and Filters (right-aligned) */}
							<div className="flex items-center justify-between gap-3">
								{/* Left side: Select-all checkbox and Actions button */}
								<div className="flex items-center">
									{/* Checkbox wrapper aligned with list item checkboxes (px-4 py-4) */}
									<div className="flex items-center px-4 py-4">
										<input
											type="checkbox"
											checked={isAllSelected}
											ref={(el) => {
												if (el)
													el.indeterminate =
														isIndeterminate;
											}}
											onChange={toggleSelectAll}
											aria-label="Select all topics"
											className="peer size-4 pointer-coarse:h-6 pointer-coarse:w-6 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:data-[state=checked]:bg-primary dark:aria-invalid:ring-destructive/40"
										/>
									</div>
									{/* Action items container with gap alignment */}
									<div className="flex items-center gap-3">
										{selectedCount > 0 && (
											<output className="text-muted-foreground text-sm">
												{selectedCount} selected
											</output>
										)}
										<WorkTopicsActionsDropdown
											selectedTopicIds={selectedTopicIds}
											allTopics={state.topics}
											onArchive={() => {
												setStatusDialogMode("archive");
											}}
											onRestore={() => {
												setStatusDialogMode("restore");
											}}
											onHibernate={() => {
												setStatusDialogMode(
													"hibernate",
												);
											}}
											onWake={() => {
												setStatusDialogMode("wake");
											}}
											onAccept={() => {
												setStatusDialogMode("accept");
											}}
											onMerge={() => {
												setIsMergeDialogOpen(true);
											}}
											onDelete={() => {
												setIsDeleteDialogOpen(true);
											}}
										/>
									</div>
								</div>
								<div className="flex flex-wrap items-center justify-end gap-3">
									<div className="flex items-center gap-2">
										<Small className="font-medium">
											Status:
										</Small>
										<Select
											value={selectedFilterOption}
											onValueChange={(value) => {
												setSelectedFilterOption(value);
												if (value === "all") {
													setStatusFilter([
														"active",
														"dormant",
														"suggested",
														"archived",
													]);
												} else if (
													value ===
													"active,dormant,suggested"
												) {
													setStatusFilter([
														"active",
														"dormant",
														"suggested",
													]);
												} else {
													setStatusFilter([value]);
												}
											}}
										>
											<SelectTrigger className="w-56">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="active,dormant,suggested">
													All except Archived
												</SelectItem>
												<SelectItem value="active">
													Active
												</SelectItem>
												<SelectItem value="dormant">
													Hibernate
												</SelectItem>
												<SelectItem value="suggested">
													Suggested
												</SelectItem>
												<SelectItem value="archived">
													Archived
												</SelectItem>
												<SelectItem value="all">
													All
												</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="flex items-center gap-2">
										<Small className="font-medium">
											Account:
										</Small>
										<Select
											value={selectedAccountOption}
											onValueChange={(value) => {
												setSelectedAccountOption(value);
												if (value === "all") {
													setAccountFilter(null);
												} else {
													setAccountFilter(value);
												}
											}}
										>
											<SelectTrigger className="w-56">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="max-h-72 overflow-y-auto">
												<SelectItem value="all">
													All
												</SelectItem>
												<SelectItem value="none">
													No account
												</SelectItem>
												{state.accounts.map(
													(account) => (
														<SelectItem
															key={account.id}
															value={account.id}
														>
															{account.name}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>
						</div>
					)}
					{list}
				</BriefPanel>
			) : (
				<div className="space-y-3">
					<P className="font-medium">No topics match your filters.</P>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setSelectedFilterOption("active,dormant,suggested");
							setStatusFilter(["active", "dormant", "suggested"]);
							setSelectedAccountOption("all");
							setAccountFilter(null);
						}}
					>
						Clear filters
					</Button>
				</div>
			)}
			{editor}
			{statusDialogMode && (
				<WorkTopicsStatusDialog
					open={statusDialogMode !== null}
					mode={statusDialogMode}
					selectedTopicIds={selectedTopicIds}
					allTopics={state.topics}
					onOpenChange={(open) => {
						if (!open) setStatusDialogMode(null);
					}}
					onSuccess={() => {
						// Clear selection after successful action
						setSelectedTopicIds(new Set());
						onSelectionChange?.(new Set());
					}}
				/>
			)}
			{isMergeDialogOpen && (
				<WorkTopicsMergeDialog
					open
					selectedTopicIds={selectedTopicIds}
					allTopics={state.topics}
					onOpenChange={(open) => {
						if (!open) setIsMergeDialogOpen(false);
					}}
					onSuccess={() => {
						// Clear selection after successful action
						setSelectedTopicIds(new Set());
						onSelectionChange?.(new Set());
					}}
				/>
			)}
			{isDeleteDialogOpen && (
				<WorkTopicsDeleteDialog
					open
					selectedTopicIds={selectedTopicIds}
					allTopics={state.topics}
					onOpenChange={(open) => {
						if (!open) setIsDeleteDialogOpen(false);
					}}
					onSuccess={() => {
						// Clear selection after successful action
						setSelectedTopicIds(new Set());
						onSelectionChange?.(new Set());
					}}
				/>
			)}
		</CollaborationHeroPage>
	);
}
