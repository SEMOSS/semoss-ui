import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
	Button,
	Input,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
} from "@semoss/ui/next";
import { channelMeta } from "../channel-meta";
import { dateLabel } from "../date-label";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { resumeThread } from "../work-item-actions";
import { BrainOverview } from "./brain-overview";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { ThreadMenu } from "./thread-menu";
import { TopicChip } from "./topic-chip";

/** Thread inventory with topic, exclusion, ignored, and automated filters. */
export function ThreadsDirectory() {
	const fieldId = useId();
	const { state, dispatch } = useCollaborationSession();
	const [params, setParams] = useSearchParams();
	const [query, setQuery] = useState("");
	const filter = params.get("filter") ?? "all";
	const threads = state.threads.filter((thread) => {
		if (!thread.subject.toLowerCase().includes(query.toLowerCase()))
			return false;
		if (filter === "needs")
			return (
				thread.needsTopicChoice ||
				!thread.topicLinks.some((link) => link.source !== "suggested")
			);
		if (filter === "multi") return thread.topicLinks.length > 1;
		if (filter === "excluded")
			return thread.participants.some(
				(participant) => !participant.included,
			);
		if (filter === "muted") return thread.muted;
		if (filter === "automated") return thread.automated === true;
		return true;
	});
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title="Threads"
					description="Conversations you have filed. A thread can belong to several topics."
				/>
			}
			aside={<BrainOverview />}
			asideTitle="Brain overview"
		>
			<div className="flex flex-wrap items-center gap-2 border-b p-4 md:px-6">
				<div className="min-w-40 flex-1">
					<Label
						htmlFor={`${fieldId}-thread-search`}
						className="sr-only"
					>
						Search threads
					</Label>
					<Input
						id={`${fieldId}-thread-search`}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Filter by subject"
						className="h-9 text-sm"
					/>
				</div>
				<div>
					<Label
						htmlFor={`${fieldId}-thread-filter`}
						className="sr-only"
					>
						Show
					</Label>
					<Select
						value={filter}
						onValueChange={(value) =>
							setParams(value === "all" ? {} : { filter: value })
						}
					>
						<SelectTrigger
							id={`${fieldId}-thread-filter`}
							className="h-9"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All threads</SelectItem>
							<SelectItem value="needs">Needs a topic</SelectItem>
							<SelectItem value="multi">
								Several topics
							</SelectItem>
							<SelectItem value="excluded">
								Has exclusions
							</SelectItem>
							<SelectItem value="muted">Ignored</SelectItem>
							<SelectItem value="automated">Automated</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<output className="block px-4 pt-3 pb-2 font-medium text-muted-foreground text-xs md:px-6">
				{threads.length} threads
			</output>
			<ul>
				{threads.map((thread) => {
					const Icon = channelMeta(thread.channel).icon;
					return (
						<ThreadMenu key={thread.id} thread={thread}>
							{(menu) => (
								<li className="flex flex-wrap items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/30 md:px-6">
									<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
										<Icon
											className="size-4"
											aria-hidden="true"
										/>
										<span className="sr-only">
											{channelMeta(thread.channel).label}
										</span>
									</span>
									<div className="min-w-0 flex-1">
										<Link
											className="break-words font-medium text-sm hover:underline"
											to={`/brain/threads/${encodeURIComponent(thread.id)}`}
										>
											{thread.subject}
										</Link>
										<Small className="mt-0.5 font-normal text-muted-foreground text-xs leading-5">
											{dateLabel(thread.lastAt)}
											{thread.muted
												? " \u00b7 Ignored"
												: ""}
											{thread.automated
												? " \u00b7 Automated"
												: ""}
										</Small>
									</div>
									<div className="flex flex-wrap gap-1.5">
										{thread.topicLinks.map((link) => {
											const topic = state.topics.find(
												(item) =>
													item.id === link.topicId,
											);
											return (
												topic && (
													<TopicChip
														key={topic.id}
														topic={topic}
														suggested={
															link.source ===
															"suggested"
														}
													/>
												)
											);
										})}
										{!thread.topicLinks.length && (
											<Small className="font-normal text-muted-foreground text-xs">
												No topic
											</Small>
										)}
									</div>
									{thread.muted && (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												resumeThread(dispatch, thread)
											}
										>
											Resume thread
										</Button>
									)}
									{menu}
								</li>
							)}
						</ThreadMenu>
					);
				})}
			</ul>
			{!threads.length && (
				<P className="p-6 text-muted-foreground">
					No matching threads.
				</P>
			)}
		</CollaborationSurface>
	);
}
