import type { ReactNode } from "react";
import { useLocation, useParams } from "react-router";
import { BrainMemory } from "@/features/collaboration/components/brain-memory";
import { BrainReview } from "@/features/collaboration/components/brain-review";
import { BrainThread } from "@/features/collaboration/components/brain-thread";
import { CollaborationBrainNavigation } from "@/features/collaboration/components/collaboration-brain-navigation";
import { PeopleDirectory } from "@/features/collaboration/components/people-directory";
import { PersonDetail } from "@/features/collaboration/components/person-detail";
import { SourcesAndRules } from "@/features/collaboration/components/sources-and-rules";
import { ThreadsDirectory } from "@/features/collaboration/components/threads-directory";
import { TopicDetail } from "@/features/collaboration/components/topic-detail";
import { useCollaborationResource } from "@/features/collaboration/live/work-updates.context";

/** Thin routes compose the Brain feature views. */
export function BrainPage() {
	const { pathname } = useLocation();
	const { topicId, personId, threadId } = useParams();
	const resource = useCollaborationResource(
		topicId
			? `topic:${topicId}`
			: personId || pathname.endsWith("/people")
				? "people"
				: threadId || pathname.endsWith("/threads")
					? "threads"
					: pathname.endsWith("/memory")
						? "memories"
						: pathname.endsWith("/sources")
							? "rules"
							: "reviews",
	);
	const context = useCollaborationResource(
		`topic-context:${topicId ?? ""}`,
		Boolean(topicId),
	);
	useCollaborationResource(
		"memories",
		Boolean(
			personId ||
				threadId ||
				(!topicId &&
					!pathname.endsWith("/sources") &&
					!pathname.endsWith("/people") &&
					!pathname.endsWith("/threads")),
		),
	);
	useCollaborationResource("accounts", Boolean(personId || topicId));

	let content: ReactNode;
	if (topicId) content = <TopicDetail key={topicId} />;
	else if (personId) content = <PersonDetail key={personId} />;
	else if (threadId) content = <BrainThread key={threadId} />;
	else if (pathname.endsWith("/memory")) content = <BrainMemory />;
	else if (pathname.endsWith("/sources")) content = <SourcesAndRules />;
	else if (pathname.endsWith("/people")) content = <PeopleDirectory />;
	else if (pathname.endsWith("/threads")) content = <ThreadsDirectory />;
	else content = <BrainReview />;
	return (
		<>
			<div className="shrink-0 bg-muted/15 px-4 pt-4 sm:px-6 lg:px-8">
				<div className="mx-auto w-full max-w-screen-2xl">
					<CollaborationBrainNavigation />
				</div>
			</div>
			{(resource.isLoading || context.isLoading) && (
				<output className="block p-4">Loading saved context…</output>
			)}
			{(resource.error || context.error) && (
				<p className="p-4" role="alert">
					{resource.error || context.error}{" "}
					<button
						type="button"
						onClick={() => {
							resource.refresh();
							if (topicId) context.refresh();
						}}
					>
						Retry
					</button>
				</p>
			)}
			{resource.complete && (!topicId || context.complete) && content}
		</>
	);
}
