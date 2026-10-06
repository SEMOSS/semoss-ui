import type { ReactNode } from "react";
import { useLocation, useParams } from "react-router";
import { BrainReview } from "@/features/collaboration/components/brain-review";
import { BrainThread } from "@/features/collaboration/components/brain-thread";
import { CollaborationBrainNavigation } from "@/features/collaboration/components/collaboration-brain-navigation";
import { PeopleDirectory } from "@/features/collaboration/components/people-directory";
import { PersonDetail } from "@/features/collaboration/components/person-detail";
import { SourcesAndRules } from "@/features/collaboration/components/sources-and-rules";
import { ThreadsDirectory } from "@/features/collaboration/components/threads-directory";
import { TopicDetail } from "@/features/collaboration/components/topic-detail";

/** Thin routes compose the Brain feature views. */
export function BrainPage() {
	const { pathname } = useLocation();
	const { topicId, personId, threadId } = useParams();
	let content: ReactNode;
	if (topicId) content = <TopicDetail key={topicId} />;
	else if (personId) content = <PersonDetail key={personId} />;
	else if (threadId) content = <BrainThread key={threadId} />;
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
			{content}
		</>
	);
}
