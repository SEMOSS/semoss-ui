import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
	Badge,
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
		<CollaborationSurface>
			<header className="space-y-2 border-b p-4 md:p-6">
				<H1 className="font-semibold text-xl">Threads</H1>
				<P className="text-muted-foreground">
					Conversations you have filed. A thread can belong to several
					topics.
				</P>
			</header>
			<div className="flex flex-wrap items-end gap-4 border-b p-4 md:px-6">
				<div className="min-w-0 flex-1 space-y-2">
					<Label htmlFor={`${fieldId}-thread-search`}>
						Search threads
					</Label>
					<Input
						id={`${fieldId}-thread-search`}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor={`${fieldId}-thread-filter`}>Show</Label>
					<Select
						value={filter}
						onValueChange={(value) =>
							setParams(value === "all" ? {} : { filter: value })
						}
					>
						<SelectTrigger id={`${fieldId}-thread-filter`}>
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
			<output className="block px-4 py-3 text-muted-foreground text-sm md:px-6">
				{threads.length} threads
			</output>
			<ul>
				{threads.map((thread) => (
					<li
						key={thread.id}
						className="flex flex-wrap items-center gap-3 border-b p-4 md:px-6"
					>
						<Badge variant="outline">{thread.channel}</Badge>
						<div className="min-w-0 flex-1">
							<Link
								className="break-words font-medium hover:underline"
								to={`/brain/threads/${encodeURIComponent(thread.id)}`}
							>
								{thread.subject}
							</Link>
							<Small className="text-muted-foreground">
								{dateLabel(thread.lastAt)} ·{" "}
								{thread.isSample ? "Sample" : "Connected"}
								{thread.muted ? " · Muted" : ""}
							</Small>
						</div>
						<div className="flex flex-wrap gap-2">
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
