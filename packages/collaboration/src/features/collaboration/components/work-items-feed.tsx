import { ListFilter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import {
	Badge,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	P,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { channelMeta } from "../channel-meta";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { selectWorkItems } from "../state/collaboration.selectors";
import type { Channel } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { WorkItemCard } from "./work-item-card";

const STATUS_FILTERS = [
	{ value: "needs_me", label: "Needs review", view: "needs_me" },
	{ value: "open", label: "Open", view: undefined },
	{ value: "waiting", label: "Waiting", view: "waiting" },
	{ value: "done", label: "Handled", view: "done_today" },
	{ value: "snoozed", label: "Snoozed", view: "snoozed" },
] as const;

export type WorkStatusFilter = (typeof STATUS_FILTERS)[number]["value"];

interface WorkItemsFeedProps {
	/** Limit every status, source count, and action to this topic when present. */
	topicId?: string;
	/** Selected status when this feed is first mounted. */
	initialFilter: WorkStatusFilter;
	/** Search scope supplied by a bookmarked status route. */
	search?: string;
}

/** Shared, explicitly scoped work filters and rows with existing item commands. */
export function WorkItemsFeed({
	topicId,
	initialFilter,
	search,
}: WorkItemsFeedProps) {
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
		search,
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
	const groups = [false, true].filter((isSample) =>
		items.some((item) => item.isSample === isSample),
	);

	return (
		<Tabs
			value={status}
			onValueChange={(value) => {
				const filter = filters.find(
					(candidate) => candidate.value === value,
				);
				if (filter) setStatus(filter.value);
			}}
			className="gap-0"
		>
			<div className="border-border border-b p-4 md:px-5">
				<TabsList
					aria-label="Task status"
					className={collaborationTabsStyles.list}
				>
					{filters.map((filter) => (
						<TabsTrigger
							key={filter.value}
							value={filter.value}
							className={collaborationTabsStyles.trigger}
						>
							{filter.label}
							<span className="text-muted-foreground tabular-nums">
								{
									selectWorkItems(state, {
										topicId,
										search,
										view: filter.view,
									}).total
								}
							</span>
						</TabsTrigger>
					))}
				</TabsList>
			</div>
			<div className="flex flex-wrap items-center gap-3 border-border border-b px-4 py-3 md:px-5">
				<ToggleGroup
					type="single"
					size="sm"
					value={sort}
					aria-label="Sort tasks"
					onValueChange={(value) => {
						if (value === "top" || value === "latest")
							setSort(value);
					}}
				>
					<ToggleGroupItem
						value="top"
						className="pointer-coarse:min-h-11"
					>
						Top
					</ToggleGroupItem>
					<ToggleGroupItem
						value="latest"
						className="pointer-coarse:min-h-11"
					>
						Latest
					</ToggleGroupItem>
				</ToggleGroup>
				<WorkRefreshStatus
					scope={topicId ? `topic-work:${topicId}` : "items"}
				/>
				<div className="ml-auto flex items-center gap-2">
					<output className="text-muted-foreground text-sm tabular-nums">
						{items.length} {items.length === 1 ? "item" : "items"}
					</output>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant={activeMeta ? "secondary" : "outline"}
								size="sm"
								className="pointer-coarse:min-h-11"
								aria-label={`Filter by source: ${activeMeta?.label ?? "All sources"}`}
							>
								<ListFilter aria-hidden="true" />
								{activeMeta?.label ?? "All sources"}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Source</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuRadioGroup
								aria-label="Source"
								value={activeChannel ?? "all"}
								onValueChange={(value) =>
									setChannel(
										channels.find(
											(candidate) => candidate === value,
										),
									)
								}
							>
								{["all", ...channels].map((value) => {
									const meta =
										value === "all"
											? null
											: channelMeta(value);
									const Icon = meta?.icon;
									return (
										<DropdownMenuRadioItem
											key={value}
											value={value}
											className="pointer-coarse:min-h-11"
										>
											{Icon && (
												<Icon aria-hidden="true" />
											)}
											{meta?.label ?? "All sources"}
											<span className="ml-auto pl-4 text-muted-foreground tabular-nums">
												{meta
													? all.filter(
															(item) =>
																item.channel ===
																value,
														).length
													: all.length}
											</span>
										</DropdownMenuRadioItem>
									);
								})}
							</DropdownMenuRadioGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			<TabsContent value={status} className="mt-0">
				{groups.map((isSample) => (
					<section
						key={String(isSample)}
						aria-label={
							isSample ? "Sample items" : "Connected items"
						}
					>
						{(isSample || groups.length > 1) && (
							<div className="flex items-center gap-2 border-border/50 border-b px-4 py-2 md:px-6">
								<Small className="font-medium text-muted-foreground text-xs">
									{isSample
										? "Sample items"
										: "Connected items"}
								</Small>
								<Badge variant="secondary">
									{
										items.filter(
											(item) =>
												item.isSample === isSample,
										).length
									}
								</Badge>
							</div>
						)}
						{items
							.filter((item) => item.isSample === isSample)
							.map((item) => (
								<WorkItemCard key={item.id} item={item} />
							))}
					</section>
				))}
				{!items.length && (
					<div className="space-y-3 p-6">
						<P className="text-muted-foreground text-sm">
							{status === "needs_me"
								? "No tasks need you right now."
								: `No ${selected?.label.toLocaleLowerCase() ?? "open"} items ${topicId ? "in this topic" : "in this view"}.`}
						</P>
						{status !== "open" ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setStatus("open")}
							>
								Show all open tasks
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
			</TabsContent>
		</Tabs>
	);
}
