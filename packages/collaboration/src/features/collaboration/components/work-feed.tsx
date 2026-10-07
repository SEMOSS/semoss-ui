import { Check, Clock, ListFilter } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
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
	H1,
	P,
	Separator,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { channelMeta } from "../channel-meta";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { useWorkUpdates } from "../live/work-updates.context";
import { selectWorkItems } from "../state/collaboration.selectors";
import type { Channel } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { PersonAvatar } from "./person-avatar";
import { WorkItemCard } from "./work-item-card";
import { WorkOverview } from "./work-overview";

// the open feed can be switched to what was finished or put off, in the same scope;
// a tooltip trigger owns each toggle's data-state, so the pressed look keys off aria-checked
const STATUS_FILTERS = [
	{ value: "done", label: "Done", icon: Check },
	{ value: "snoozed", label: "Snoozed", icon: Clock },
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

/** The ranked work feed, with live imports separated from the supplied scenario. */
export function WorkFeed() {
	const { state } = useCollaborationSession();
	const updates = useWorkUpdates();
	const { topicId } = useParams();
	const { pathname } = useLocation();
	const [sort, setSort] = useState("top");
	const [channel, setChannel] = useState<Channel>();
	const [status, setStatus] = useState<StatusFilter>();
	const view = pathname.endsWith("/waiting")
		? "waiting"
		: pathname.endsWith("/done")
			? "done"
			: "open";
	// Waiting and Done are already a status, so only the open feed switches
	const shownStatus = view === "open" ? status : undefined;
	const topic = state.topics.find((candidate) => candidate.id === topicId);
	const filters = {
		view:
			view === "waiting"
				? ("waiting" as const)
				: view === "done" || shownStatus === "done"
					? ("done_today" as const)
					: shownStatus === "snoozed"
						? ("snoozed" as const)
						: topicId
							? undefined
							: ("needs_me" as const),
		topicId,
		sort: sort === "latest" ? ("latest" as const) : ("top" as const),
	};
	const { items: all } = selectWorkItems(state, filters);
	const channels = [...new Set(all.map((item) => item.channel))];
	const active = channel && channels.includes(channel) ? channel : undefined;
	const items = active ? all.filter((item) => item.channel === active) : all;
	const title =
		topic?.name ||
		(view === "waiting"
			? "Waiting on others"
			: view === "done"
				? "Done"
				: "For you");
	const hasConnectedItems = items.some((item) => !item.isSample);
	// live data has no sample items, so the sample section only shows when it has something to add
	const hasSampleData = state.items.some((item) => item.isSample);
	const groups = (hasConnectedItems ? [false, true] : [true, false]).filter(
		(isSample) =>
			!isSample ||
			(hasSampleData &&
				!(hasConnectedItems && !items.some((item) => item.isSample))),
	);
	const statusCounts = {
		done: selectWorkItems(state, { view: "done_today", topicId }).total,
		snoozed: selectWorkItems(state, { view: "snoozed", topicId }).total,
	};
	const activeMeta = active ? channelMeta(active) : null;
	return (
		<CollaborationSurface aside={<WorkOverview />} asideTitle="Overview">
			<header className="space-y-1 px-4 pt-5 pb-3 md:px-6">
				{topic && (
					<div
						className="mb-3 h-1 w-12 rounded-full bg-primary"
						aria-hidden="true"
					/>
				)}
				<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<H1 className="font-semibold text-2xl">{title}</H1>
					<P className="text-muted-foreground text-sm">
						{topic?.description ||
							(view === "waiting"
								? "Things you asked for that have not come back."
								: view === "done"
									? "Completed in this session."
									: "What needs your attention, across your topics.")}
					</P>
				</div>
				{topic && (
					<>
						<div className="flex flex-wrap items-center gap-3 pt-3 text-muted-foreground text-xs">
							<div className="-space-x-2 flex" aria-hidden="true">
								{topic.people
									.filter(
										(member) => member.state !== "removed",
									)
									.slice(0, 4)
									.map((member) => {
										const person = state.people.find(
											(candidate) =>
												candidate.id ===
												member.personId,
										);
										return person ? (
											<PersonAvatar
												key={person.id}
												name={person.name}
												initials={person.initials}
												className="size-6 ring-2 ring-card"
											/>
										) : null;
									})}
							</div>
							<span>
								{
									topic.people.filter(
										(member) => member.state !== "removed",
									).length
								}{" "}
								people
							</span>
							<span>{topic.stats.threads} threads</span>
							<Link
								className="text-primary hover:underline"
								to={`/brain/topics/${encodeURIComponent(topic.id)}`}
							>
								Edit in Brain
							</Link>
						</div>
						<ul className="space-y-1 pt-3">
							{topic.goals.map((goal) => (
								<li
									key={goal.noteId}
									className={cn(
										"flex items-center gap-2 text-muted-foreground text-sm",
										goal.status === "done" &&
											"line-through",
									)}
								>
									<span
										aria-hidden="true"
										className={cn(
											"size-3 shrink-0 rounded-full border border-border",
											goal.status === "done" &&
												"border-success bg-success",
										)}
									/>
									{goal.text}
								</li>
							))}
						</ul>
					</>
				)}
			</header>
			<Tabs value={sort} onValueChange={setSort} className="gap-0">
				<div className="border-border border-b px-4 md:px-6">
					<TabsList
						aria-label="Sort work"
						className={collaborationTabsStyles.list}
					>
						<TabsTrigger
							value="top"
							className={collaborationTabsStyles.trigger}
						>
							Top
						</TabsTrigger>
						<TabsTrigger
							value="latest"
							className={collaborationTabsStyles.trigger}
						>
							Latest
						</TabsTrigger>
					</TabsList>
				</div>
				<div className="flex min-h-12 flex-wrap items-center gap-2 border-border border-b bg-muted/40 px-4 py-2 md:px-6">
					<WorkRefreshStatus />
					{view === "open" && (
						<>
							{updates && (
								<Separator
									orientation="vertical"
									className="data-[orientation=vertical]:h-5"
								/>
							)}
							<ToggleGroup
								type="single"
								size="sm"
								spacing={1}
								aria-label="Show finished or snoozed work"
								value={shownStatus ?? ""}
								onValueChange={(value) =>
									setStatus(
										STATUS_FILTERS.find(
											(filter) => filter.value === value,
										)?.value,
									)
								}
							>
								{STATUS_FILTERS.map(
									({ value, label, icon: Icon }) => (
										<Tooltip key={value}>
											<TooltipTrigger asChild>
												<ToggleGroupItem
													value={value}
													aria-label={`Show ${label.toLowerCase()} (${statusCounts[value]})`}
													className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 px-2 text-muted-foreground aria-checked:bg-accent aria-checked:text-primary"
												>
													<Icon aria-hidden="true" />
												</ToggleGroupItem>
											</TooltipTrigger>
											<TooltipContent>
												{shownStatus === value
													? "Back to open work"
													: `${label} (${statusCounts[value]})`}
											</TooltipContent>
										</Tooltip>
									),
								)}
							</ToggleGroup>
						</>
					)}
					<div className="ml-auto flex items-center gap-1">
						<span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-sm tabular-nums">
							{items.length}
							<span className="sr-only">
								{items.length === 1 ? " item" : " items"}
							</span>
						</span>
						<DropdownMenu>
							<Tooltip>
								<TooltipTrigger asChild>
									<DropdownMenuTrigger asChild>
										<Button
											variant={
												activeMeta
													? "secondary"
													: "ghost"
											}
											size={activeMeta ? "sm" : "icon-sm"}
											className="pointer-coarse:min-h-11 pointer-coarse:min-w-11"
											aria-label={`Filter by source: ${activeMeta?.label ?? "All sources"}`}
										>
											<ListFilter aria-hidden="true" />
											{activeMeta?.label}
										</Button>
									</DropdownMenuTrigger>
								</TooltipTrigger>
								<TooltipContent>
									Filter by source
								</TooltipContent>
							</Tooltip>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel className="font-normal text-muted-foreground">
									Source
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuRadioGroup
									aria-label="Source"
									value={active ?? "all"}
									onValueChange={(value) =>
										setChannel(
											channels.find(
												(candidate) =>
													candidate === value,
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
												className="min-h-8 pointer-coarse:min-h-11"
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
				<TabsContent value={sort} className="mt-0">
					{groups.map((isSample) => {
						const group = items.filter(
							(item) => item.isSample === isSample,
						);
						return (
							<section
								key={String(isSample)}
								aria-label={
									isSample ? "Work items" : "Connected items"
								}
							>
								{groups.length > 1 && (
									<div className="flex flex-wrap items-center gap-2 border-border/50 border-b px-4 py-2 md:px-6">
										<Small className="font-medium text-muted-foreground text-xs">
											{isSample
												? "Work items"
												: "Connected items"}
										</Small>
										<Badge
											variant="secondary"
											className="px-1.5 py-0 text-xs"
										>
											{group.length}
										</Badge>
									</div>
								)}
								{group.length ? (
									group.map((item) => (
										<WorkItemCard
											key={item.id}
											item={item}
										/>
									))
								) : (
									<div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-6 md:px-6">
										<P className="text-muted-foreground text-sm">
											{shownStatus === "done"
												? "Nothing finished in this view yet."
												: shownStatus === "snoozed"
													? "Nothing snoozed in this view."
													: isSample
														? "No items in this view."
														: "No connected items in this view."}
										</P>
										{shownStatus ? (
											<Button
												variant="link"
												size="sm"
												className="h-auto p-0"
												onClick={() =>
													setStatus(undefined)
												}
											>
												Back to open work
											</Button>
										) : (
											!isSample && (
												<Link
													to="/brain/sources"
													className="text-primary text-sm underline underline-offset-4"
												>
													Browse your email and
													sources
												</Link>
											)
										)}
									</div>
								)}
							</section>
						);
					})}
				</TabsContent>
			</Tabs>
		</CollaborationSurface>
	);
}
