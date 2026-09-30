import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import {
	Badge,
	Button,
	cn,
	H1,
	P,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { channelMeta } from "../channel-meta";
import { dateLabel } from "../date-label";
import { WorkRefreshStatus } from "../live/work-refresh-status";
import { selectWorkItems } from "../state/collaboration.selectors";
import type { Channel } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { collaborationTabsStyles } from "./collaboration-tabs.styles";
import { PersonAvatar } from "./person-avatar";
import { WorkItemCard } from "./work-item-card";
import { WorkOverview } from "./work-overview";

/** The ranked work feed, with live imports separated from the supplied scenario. */
export function WorkFeed() {
	const { state, dispatch } = useCollaborationSession();
	const { topicId } = useParams();
	const { pathname } = useLocation();
	const [sort, setSort] = useState("top");
	const [channel, setChannel] = useState<Channel>();
	const view = pathname.endsWith("/waiting")
		? "waiting"
		: pathname.endsWith("/done")
			? "done"
			: "open";
	const topic = state.topics.find((candidate) => candidate.id === topicId);
	const filters = {
		view:
			view === "waiting"
				? ("waiting" as const)
				: view === "done"
					? ("done_today" as const)
					: topicId
						? undefined
						: ("needs_me" as const),
		topicId,
		sort: sort === "latest" ? ("latest" as const) : ("top" as const),
	};
	const { items: all } = selectWorkItems(state, filters);
	// the source filter shows once the feed holds more than one source
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
	const snoozed = state.items.filter(
		(item) =>
			item.status === "snoozed" &&
			(!topicId || item.topicIds.includes(topicId)),
	);
	return (
		<CollaborationSurface aside={<WorkOverview />} asideTitle="Overview">
			<header className="space-y-1 px-4 pt-5 pb-2 md:px-6">
				{topic && (
					<div
						className="mb-3 h-1 w-12 rounded-full bg-primary"
						aria-hidden="true"
					/>
				)}
				<div className="flex flex-wrap items-center gap-2">
					<H1 className="font-semibold text-xl">{title}</H1>
					<WorkRefreshStatus />
				</div>
				<P className="text-muted-foreground text-sm">
					{topic?.description ||
						(view === "waiting"
							? "Things you asked for that have not come back."
							: view === "done"
								? "Completed in this session."
								: "What needs your attention, across your topics.")}
				</P>
				{topic && (
					<>
						<div className="flex flex-wrap items-center gap-3 pt-3 text-muted-foreground text-xs">
							<div className="-space-x-2 flex" aria-hidden="true">
								{topic.people
									.filter(
										(member) => member.state === "member",
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
										(member) => member.state === "member",
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
				<div className="flex flex-wrap items-center justify-between gap-x-3 border-b px-4 md:px-6">
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
					{channels.length > 1 && (
						<fieldset className="flex flex-wrap items-center gap-1 py-2">
							<legend className="sr-only">
								Filter by source
							</legend>
							{[undefined, ...channels].map((value) => {
								const count = value
									? all.filter(
											(item) => item.channel === value,
										).length
									: all.length;
								const meta = value ? channelMeta(value) : null;
								const Icon = meta?.icon;
								return (
									<Button
										key={value ?? "all"}
										variant={
											active === value
												? "secondary"
												: "ghost"
										}
										size="sm"
										className="h-7 rounded-full px-3 font-normal text-xs"
										aria-pressed={active === value}
										onClick={() => setChannel(value)}
									>
										{Icon && (
											<Icon
												aria-hidden="true"
												className="size-3"
											/>
										)}
										{meta?.label ?? "All"}
										<span className="text-muted-foreground">
											{count}
										</span>
									</Button>
								);
							})}
						</fieldset>
					)}
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
								{(!isSample || hasConnectedItems) && (
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
									<div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 md:px-6">
										<P className="text-muted-foreground text-sm">
											{isSample
												? "No items in this view."
												: "No connected items in this view."}
										</P>
										{!isSample && (
											<Link
												to="/brain/sources"
												className="text-primary text-sm underline underline-offset-4"
											>
												Browse your email and sources
											</Link>
										)}
									</div>
								)}
							</section>
						);
					})}
				</TabsContent>
			</Tabs>
			{snoozed.length > 0 && view === "open" && (
				<details className="border-b p-4 md:px-6">
					<summary className="cursor-pointer font-medium">
						{snoozed.length} snoozed
					</summary>
					<ul className="mt-3 space-y-2">
						{snoozed.map((item) => (
							<li
								key={item.id}
								className="flex flex-wrap items-center justify-between gap-2"
							>
								<div>
									<Small>{item.title}</Small>
									{item.snoozeUntil && (
										<Small className="text-muted-foreground">
											Until{" "}
											{dateLabel(
												item.snoozeUntil,
												(item.isSample
													? state.profile
													: state.liveProfile
												)?.timezone,
											)}
										</Small>
									)}
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										dispatch({
											type: "item.update",
											itemId: item.id,
											changes: {
												status:
													item.snoozedFrom ?? "open",
											},
										})
									}
								>
									Bring back
								</Button>
							</li>
						))}
					</ul>
				</details>
			)}
		</CollaborationSurface>
	);
}
