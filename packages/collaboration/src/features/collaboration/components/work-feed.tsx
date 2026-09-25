import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import {
	Badge,
	Button,
	H1,
	P,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { dateLabel } from "../date-label";
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationSurface } from "./collaboration-surface";
import { WorkItemCard } from "./work-item-card";
import { WorkOverview } from "./work-overview";

/** The ranked work feed, with live imports separated from the supplied scenario. */
export function WorkFeed() {
	const { state, dispatch } = useCollaborationSession();
	const { topicId } = useParams();
	const { pathname } = useLocation();
	const [sort, setSort] = useState("top");
	const view = pathname.endsWith("/waiting")
		? "waiting"
		: pathname.endsWith("/done")
			? "done"
			: "open";
	const topic = state.topics.find((candidate) => candidate.id === topicId);
	const { items } = selectWorkItems(state, {
		view:
			view === "waiting"
				? "waiting"
				: view === "done"
					? "done_today"
					: "needs_me",
		topicId,
		sort: sort === "latest" ? "latest" : "top",
	});
	const title =
		topic?.name ||
		(view === "waiting"
			? "Waiting on others"
			: view === "done"
				? "Done"
				: "For you");
	const snoozed = state.items.filter(
		(item) =>
			item.status === "snoozed" &&
			(!topicId || item.topicIds.includes(topicId)),
	);
	return (
		<CollaborationSurface aside={<WorkOverview />} asideTitle="Overview">
			<header className="space-y-3 border-b px-4 py-5 md:px-6">
				<div className="flex flex-wrap items-center gap-2">
					<H1 className="font-semibold text-xl">{title}</H1>
					{topic?.isSample && (
						<Badge variant="outline">Sample topic</Badge>
					)}
				</div>
				<P className="text-muted-foreground">
					{topic?.description ||
						(view === "waiting"
							? "Things you asked for that have not come back."
							: view === "done"
								? "Completed in this session."
								: "A clear place for the conversations and next steps that need you.")}
				</P>
				{topic && (
					<>
						<Button asChild variant="outline" size="sm">
							<Link
								to={`/brain/topics/${encodeURIComponent(topic.id)}`}
							>
								Edit in Brain
							</Link>
						</Button>
						<ul className="space-y-1">
							{topic.goals.map((goal) => (
								<li
									key={goal.noteId}
									className={
										goal.status === "done"
											? "text-muted-foreground line-through"
											: "text-muted-foreground"
									}
								>
									{goal.text}
								</li>
							))}
						</ul>
					</>
				)}
			</header>
			<Tabs value={sort} onValueChange={setSort}>
				<div className="border-b px-4 py-2 md:px-6">
					<TabsList aria-label="Sort work">
						<TabsTrigger value="top">Top</TabsTrigger>
						<TabsTrigger value="latest">Latest</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value={sort} className="mt-0">
					{[false, true].map((isSample) => {
						const group = items.filter(
							(item) => item.isSample === isSample,
						);
						return (
							<section
								key={String(isSample)}
								aria-label={
									isSample
										? "Sample scenario"
										: "Connected items"
								}
							>
								<div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-3 md:px-6">
									<Small className="font-medium">
										{isSample
											? "Sample scenario"
											: "Connected items"}
									</Small>
									<Badge variant="outline">
										{group.length}
									</Badge>
									{isSample && (
										<Small className="text-muted-foreground">
											Fictional data · Sep 24, 2026
										</Small>
									)}
								</div>
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
												? "No sample items in this view."
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
