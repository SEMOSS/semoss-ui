import {
	DndContext,
	DragOverlay,
	PointerSensor,
	pointerWithin,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	CheckCheck,
	LayoutGrid,
	List,
	RefreshCw,
	Search,
	X,
} from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	H2,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useIsMobile,
} from "@semoss/ui/next";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { topicTone } from "@/features/collaboration/topic-tone";
import { useForYou } from "./for-you.context";
import { FOR_YOU_PRIORITIES, selectForYouItems } from "./for-you.model";
import { ForYouCard } from "./for-you-card";
import { ForYouColumn } from "./for-you-column";

/** One pending review collection, organized by priority or scanned as a list. */
export function ForYouWorkspace() {
	const queue = useForYou();
	const { state } = useCollaborationSession();
	const [params, setParams] = useSearchParams();
	const isMobile = useIsMobile();
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);
	const requestedView = params.get("view");
	const view =
		requestedView === "board" || requestedView === "list"
			? requestedView
			: isMobile
				? "list"
				: "board";
	const topicId = params.get("topic") || undefined;
	const search = params.get("q") ?? "";
	const items = selectForYouItems(queue.items, { topicId, search });
	const topics = [...state.topics].sort((a, b) =>
		a.name.localeCompare(b.name),
	);
	const topic = topics.find(({ id }) => id === topicId);
	const dragged = queue.items.find(({ id }) => id === draggedId);
	const hasFilters = Boolean(topicId || search);
	const hasUnavailableTopics = queue.items.some(
		(item) => item.topicStatus !== "ready",
	);

	/** Preserve independent filters when changing a single presentation choice. */
	function changeParam(name: string, value: string): void {
		setParams(
			(current) => {
				const next = new URLSearchParams(current);
				if (value) next.set(name, value);
				else next.delete(name);
				return next;
			},
			{ replace: true },
		);
	}

	function clearFilters(): void {
		setParams(
			(current) => {
				const next = new URLSearchParams(current);
				next.delete("topic");
				next.delete("q");
				return next;
			},
			{ replace: true },
		);
	}

	return (
		<CollaborationPage>
			<div
				data-for-you-heading
				tabIndex={-1}
				className="rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
			>
				<CollaborationPageHeader
					title="For you"
					description="Reviews, questions, and decisions waiting on you."
					actions={
						<Button
							variant="outline"
							size="sm"
							className="pointer-coarse:min-h-11"
							disabled={queue.isLoading}
							onClick={queue.refresh}
						>
							<RefreshCw
								aria-hidden="true"
								className={cn(
									queue.isLoading &&
										"animate-spin motion-reduce:animate-none",
								)}
							/>
							{queue.isLoading ? "Checking…" : "Refresh"}
						</Button>
					}
				/>
			</div>
			<Tabs
				value={view}
				onValueChange={(value) => changeParam("view", value)}
				className="min-w-0 gap-0"
			>
				<div className="flex flex-wrap items-center gap-3 border-b pb-4">
					<TabsList
						aria-label="For you view"
						className="pointer-coarse:h-12 shrink-0"
					>
						<TabsTrigger value="board">
							<LayoutGrid aria-hidden="true" />
							Board
						</TabsTrigger>
						<TabsTrigger value="list">
							<List aria-hidden="true" />
							List
						</TabsTrigger>
					</TabsList>
					<Select
						value={topicId ?? "__all__"}
						onValueChange={(value) =>
							changeParam(
								"topic",
								value === "__all__" ? "" : value,
							)
						}
					>
						<SelectTrigger
							aria-label="Filter by topic"
							data-for-you-topic
							className="pointer-coarse:min-h-11 w-full max-w-full bg-background sm:w-56"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All topics</SelectItem>
							<SelectItem value="__none__">No topic</SelectItem>
							{topicId && topicId !== "__none__" && !topic && (
								<SelectItem value={topicId}>
									Unavailable topic
								</SelectItem>
							)}
							{topics.map((candidate) => (
								<SelectItem
									key={candidate.id}
									value={candidate.id}
								>
									<span
										aria-hidden="true"
										className={cn(
											"size-2 shrink-0 rounded-xs",
											topicTone(candidate.id),
										)}
									/>
									<span className="truncate">
										{candidate.name}
										{candidate.status === "archived"
											? " (archived)"
											: ""}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="w-full sm:ml-auto sm:w-64">
						<InputGroup className="pointer-coarse:h-11 bg-background">
							<InputGroupAddon>
								<Search aria-hidden="true" />
							</InputGroupAddon>
							<InputGroupInput
								aria-label="Search reviews"
								placeholder="Search reviews…"
								value={search}
								onChange={(event) =>
									changeParam("q", event.target.value)
								}
							/>
						</InputGroup>
					</div>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-2 py-4">
					<output className="text-muted-foreground text-sm tabular-nums">
						{items.length} {items.length === 1 ? "item" : "items"}
						{hasFilters
							? ` of ${queue.items.length}`
							: " waiting for review"}
						{!queue.isComplete &&
							!queue.isLoading &&
							" · Partially checked"}
					</output>
					{hasFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearFilters}
						>
							<X aria-hidden="true" />
							Clear filters
						</Button>
					)}
				</div>
				{queue.errors.length > 0 && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>
							{queue.errors.join(" ")}
							<Button
								variant="link"
								size="sm"
								onClick={queue.refresh}
							>
								Retry
							</Button>
						</AlertDescription>
					</Alert>
				)}
				{topicId && hasUnavailableTopics && (
					<P className="mb-4 text-muted-foreground text-sm">
						Some topic links are still unavailable. Those items
						remain visible in All topics.
					</P>
				)}
				{queue.isLoading && !queue.items.length ? (
					<section
						aria-label="Loading reviews"
						aria-busy="true"
						className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
					>
						<output className="sr-only">Loading reviews…</output>
						{[0, 1, 2, 3].map((key) => (
							<Skeleton key={key} className="h-56 rounded-xl" />
						))}
					</section>
				) : !items.length ? (
					<div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 py-12 text-center">
						<CheckCheck
							aria-hidden="true"
							className="size-7 text-muted-foreground"
						/>
						<H2 className="text-lg">
							{hasFilters
								? "No matching reviews"
								: queue.isComplete
									? "You’re all caught up"
									: "No reviews found yet"}
						</H2>
						<P className="max-w-md text-muted-foreground text-sm">
							{hasFilters
								? "Try another topic or clear your search."
								: queue.isComplete
									? "When something needs your attention, it will appear here."
									: "We haven’t finished checking every source. Refresh to check again."}
						</P>
						{hasFilters && (
							<Button variant="outline" onClick={clearFilters}>
								Clear filters
							</Button>
						)}
					</div>
				) : (
					<>
						<TabsContent value="board" className="mt-0">
							<DndContext
								sensors={sensors}
								collisionDetection={pointerWithin}
								accessibility={{
									screenReaderInstructions: {
										draggable:
											"Use the priority menu to change priority with the keyboard.",
									},
									announcements: {
										onDragStart: ({ active }) =>
											`Moving ${queue.items.find(({ id }) => id === active.id)?.title ?? "review"}.`,
										onDragOver: ({ over }) => {
											const priority =
												FOR_YOU_PRIORITIES.find(
													({ id }) => id === over?.id,
												);
											return priority
												? `Over ${priority.label} priority.`
												: "Outside priority columns.";
										},
										onDragEnd: ({ active, over }) => {
											const item = queue.items.find(
												({ id }) => id === active.id,
											);
											const priority =
												FOR_YOU_PRIORITIES.find(
													({ id }) => id === over?.id,
												);
											return item && priority
												? `${item.title} is now ${priority.label} priority.`
												: "Priority unchanged.";
										},
										onDragCancel: () =>
											"Move cancelled. Priority unchanged.",
									},
								}}
								onDragStart={({ active }) =>
									setDraggedId(String(active.id))
								}
								onDragCancel={() => setDraggedId(null)}
								onDragEnd={({ active, over }) => {
									setDraggedId(null);
									const item = queue.items.find(
										({ id }) => id === active.id,
									);
									const priority = FOR_YOU_PRIORITIES.find(
										({ id }) => id === over?.id,
									);
									if (
										!item ||
										!priority ||
										(item.priority ?? "P2") === priority.id
									)
										return;
									queue.setPriority(item, priority.id);
								}}
							>
								<div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
									{FOR_YOU_PRIORITIES.map(({ id }) => (
										<ForYouColumn
											key={id}
											priority={id}
											items={items.filter(
												(item) =>
													(item.priority ?? "P2") ===
													id,
											)}
										/>
									))}
								</div>
								<DragOverlay>
									{dragged && (
										<div className="max-w-72 rounded-xl border bg-card p-4 font-medium text-sm shadow-sm">
											{dragged.title}
										</div>
									)}
								</DragOverlay>
							</DndContext>
						</TabsContent>
						<TabsContent
							value="list"
							className="@container/reviews mt-0 overflow-hidden rounded-xl border bg-card"
						>
							{items.map((item) => (
								<ForYouCard
									key={item.id}
									item={item}
									view="list"
								/>
							))}
						</TabsContent>
					</>
				)}
			</Tabs>
		</CollaborationPage>
	);
}
