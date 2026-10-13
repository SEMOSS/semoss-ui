import { ListFilter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	P,
	Small,
} from "@semoss/ui/next";
import { channelMeta } from "../channel-meta";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { selectWorkItems } from "../state/collaboration.selectors";
import type { Channel } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { WorkItemCard } from "./work-item-card";

const STATUS_FILTERS = [
	{ value: "needs_me", label: "Needs you", view: "needs_me" },
	{ value: "open", label: "Open", view: undefined },
	{ value: "waiting", label: "Waiting", view: "waiting" },
	{ value: "done", label: "Handled", view: "done_today" },
	{ value: "snoozed", label: "Snoozed", view: "snoozed" },
] as const;

export type WorkStatusFilter = (typeof STATUS_FILTERS)[number]["value"];

interface WorkFeedOptions {
	/** Limit every status, source count, and action to this topic when present. */
	topicId?: string;
	/** Selected status when this feed is first mounted. */
	initialFilter: WorkStatusFilter;
}

/** The feed's view (status, order, source) and the rows it selects; split so a page can place the menu itself. */
export function useWorkFeed({ topicId, initialFilter }: WorkFeedOptions) {
	const { state } = useCollaborationSession();
	const [sort, setSort] = useState<"top" | "latest">("top");
	const [channel, setChannel] = useState<Channel>();
	const [status, setStatus] = useState(initialFilter);
	const filters = STATUS_FILTERS.filter(
		(filter) => !topicId || filter.value !== "needs_me",
	);
	const selected = STATUS_FILTERS.find((filter) => filter.value === status);
	const { items: all } = selectWorkItems(state, {
		topicId,
		view: selected?.view,
		sort,
	});
	const channels = [...new Set(all.map((item) => item.channel))];
	const activeChannel =
		channel && channels.includes(channel) ? channel : undefined;
	const activeMeta = activeChannel ? channelMeta(activeChannel) : null;
	const items = activeChannel
		? all.filter((item) => item.channel === activeChannel)
		: all;
	// the button names the current view; the menu holds status, order, and source
	const viewLabel = [
		`${selected?.label ?? "Open"} ${items.length}`,
		sort === "latest" && "Latest",
		activeMeta?.label,
	]
		.filter(Boolean)
		.join(", ");
	return {
		topicId,
		filters,
		status,
		setStatus,
		selected,
		sort,
		setSort,
		channels,
		activeChannel,
		activeMeta,
		setChannel,
		all,
		items,
		viewLabel,
		total: (view: (typeof STATUS_FILTERS)[number]["view"]) =>
			selectWorkItems(state, { topicId, view }).total,
	};
}

export type WorkFeed = ReturnType<typeof useWorkFeed>;

/** Shared, explicitly scoped work filters and rows with existing item commands. */
export function WorkItemsFeed(options: WorkFeedOptions) {
	const feed = useWorkFeed(options);
	return (
		<div>
			<div className="flex flex-wrap items-center gap-3 border-border border-b px-4 py-3 md:px-5">
				<WorkRefreshStatus />
				<WorkFilterMenu feed={feed} className="ml-auto" />
			</div>
			<WorkItemsList feed={feed} />
		</div>
	);
}

/** One menu for status, order, and source. */
export function WorkFilterMenu({
	feed,
	className,
}: {
	feed: WorkFeed;
	className?: string;
}) {
	const {
		filters,
		status,
		setStatus,
		sort,
		setSort,
		channels,
		activeChannel,
		activeMeta,
		setChannel,
		all,
		viewLabel,
		total,
	} = feed;
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={
						activeMeta || sort === "latest"
							? "secondary"
							: "outline"
					}
					size="sm"
					className={cn(
						"pointer-coarse:min-h-11 tabular-nums",
						className,
					)}
					aria-label={`Filter work: ${viewLabel}`}
				>
					<ListFilter aria-hidden="true" />
					{viewLabel}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-56">
				<DropdownMenuLabel>Show</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					aria-label="Work status"
					value={status}
					onValueChange={(value) => {
						const filter = filters.find(
							(candidate) => candidate.value === value,
						);
						if (filter) setStatus(filter.value);
					}}
				>
					{filters.map((filter) => (
						<DropdownMenuRadioItem
							key={filter.value}
							value={filter.value}
							className="pointer-coarse:min-h-11"
						>
							{filter.label}
							<span className="ml-auto pl-4 text-muted-foreground tabular-nums">
								{total(filter.view)}
							</span>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>Order</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					aria-label="Sort work"
					value={sort}
					onValueChange={(value) => {
						if (value === "top" || value === "latest")
							setSort(value);
					}}
				>
					<DropdownMenuRadioItem
						value="top"
						className="pointer-coarse:min-h-11"
					>
						Top
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem
						value="latest"
						className="pointer-coarse:min-h-11"
					>
						Latest
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>Source</DropdownMenuLabel>
				<DropdownMenuRadioGroup
					aria-label="Source"
					value={activeChannel ?? "all"}
					onValueChange={(value) =>
						setChannel(
							channels.find((candidate) => candidate === value),
						)
					}
				>
					{["all", ...channels].map((value) => {
						const meta =
							value === "all" ? null : channelMeta(value);
						const Icon = meta?.icon;
						return (
							<DropdownMenuRadioItem
								key={value}
								value={value}
								className="pointer-coarse:min-h-11"
							>
								{Icon && <Icon aria-hidden="true" />}
								{meta?.label ?? "All sources"}
								<span className="ml-auto pl-4 text-muted-foreground tabular-nums">
									{meta
										? all.filter(
												(item) =>
													item.channel === value,
											).length
										: all.length}
								</span>
							</DropdownMenuRadioItem>
						);
					})}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** The rows for the feed's current view, with an empty state that offers a way out. */
export function WorkItemsList({ feed }: { feed: WorkFeed }) {
	const { topicId, items, status, selected, setStatus, viewLabel } = feed;
	const groups = [false, true].filter((isSample) =>
		items.some((item) => item.isSample === isSample),
	);
	return (
		<section aria-label={viewLabel}>
			{groups.map((isSample) => (
				<section
					key={String(isSample)}
					aria-label={isSample ? "Sample items" : "Connected items"}
				>
					{(isSample || groups.length > 1) && (
						<div className="flex items-center gap-2 border-border/50 border-b px-4 py-2 md:px-6">
							<Small className="font-medium text-muted-foreground text-xs">
								{isSample ? "Sample items" : "Connected items"}
							</Small>
							<Badge variant="secondary">
								{
									items.filter(
										(item) => item.isSample === isSample,
									).length
								}
							</Badge>
						</div>
					)}
					{items
						.filter((item) => item.isSample === isSample)
						.map((item) => (
							<WorkItemCard
								key={item.id}
								item={item}
								topicId={topicId}
							/>
						))}
				</section>
			))}
			{!items.length && (
				<div className="space-y-3 p-6">
					<P className="text-muted-foreground text-sm">
						{status === "needs_me"
							? "No work needs you right now."
							: `No ${selected?.label.toLocaleLowerCase() ?? "open"} items ${topicId ? "in this topic" : "in this view"}.`}
					</P>
					{status !== "open" ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setStatus("open")}
						>
							Show all open work
						</Button>
					) : (
						<Button asChild variant="outline" size="sm">
							<Link to="/brain/sources">
								Browse your email and sources
							</Link>
						</Button>
					)}
				</div>
			)}
		</section>
	);
}
