import { CalendarDays, Mail, MessagesSquare } from "lucide-react";
import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
	H1,
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
import { dateLabel } from "../date-label";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { BrainOverview } from "./brain-overview";
import { CollaborationSurface } from "./collaboration-surface";
import { TopicChip } from "./topic-chip";

/** Thread inventory with topic, exclusion, and mute filters. */
export function ThreadsDirectory() {
	const fieldId = useId();
	const { state } = useCollaborationSession();
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
		return true;
	});
	return (
		<CollaborationSurface
			aside={<BrainOverview />}
			asideTitle="Brain overview"
		>
			<header className="space-y-1.5 px-4 pt-5 pb-4 md:px-6">
				<H1 className="font-semibold text-xl">Threads</H1>
				<P className="text-muted-foreground text-sm">
					Conversations you have filed. A thread can belong to several
					topics.
				</P>
			</header>
			<div className="flex flex-wrap items-center gap-2 border-b px-4 pb-3 md:px-6">
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
							<SelectItem value="muted">Muted</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
			<output className="block px-4 pt-3 pb-2 font-medium text-muted-foreground text-xs md:px-6">
				{threads.length} threads
			</output>
			<ul>
				{threads.map((thread) => (
					<li
						key={thread.id}
						className="flex flex-wrap items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/30 md:px-6"
					>
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
							{thread.channel === "email" ? (
								<Mail className="size-4" aria-hidden="true" />
							) : thread.channel === "calendar" ? (
								<CalendarDays
									className="size-4"
									aria-hidden="true"
								/>
							) : (
								<MessagesSquare
									className="size-4"
									aria-hidden="true"
								/>
							)}
							<span className="sr-only">{thread.channel}</span>
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
								{thread.muted ? " · Muted" : ""}
							</Small>
						</div>
						<div className="flex flex-wrap gap-1.5">
							{thread.topicLinks.map((link) => {
								const topic = state.topics.find(
									(item) => item.id === link.topicId,
								);
								return (
									topic && (
										<TopicChip
											key={topic.id}
											topic={topic}
											suggested={
												link.source === "suggested"
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
					</li>
				))}
			</ul>
			{!threads.length && (
				<P className="p-6 text-muted-foreground">
					No matching threads.
				</P>
			)}
		</CollaborationSurface>
	);
}
