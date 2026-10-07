import { useLocation, useParams } from "react-router";
import { AboutYou } from "@/features/collaboration/components/about-you";
import { BrainReview } from "@/features/collaboration/components/brain-review";
import { BrainThread } from "@/features/collaboration/components/brain-thread";
import { PeopleDirectory } from "@/features/collaboration/components/people-directory";
import { PersonDetail } from "@/features/collaboration/components/person-detail";
import { SourcesAndRules } from "@/features/collaboration/components/sources-and-rules";
import { ThreadsDirectory } from "@/features/collaboration/components/threads-directory";
import { TopicDetail } from "@/features/collaboration/components/topic-detail";

/** Thin routes compose the Brain feature views. */
export function BrainPage() {
	const { pathname } = useLocation();
	const { topicId, personId, threadId } = useParams();
	if (topicId) return <TopicDetail key={topicId} />;
	if (personId) return <PersonDetail key={personId} />;
	if (threadId) return <BrainThread key={threadId} />;
	if (pathname.endsWith("/profile")) return <AboutYou />;
	if (pathname.endsWith("/sources")) return <SourcesAndRules />;
	if (pathname.endsWith("/people")) return <PeopleDirectory />;
	if (pathname.endsWith("/threads")) return <ThreadsDirectory />;
	return <BrainReview />;
}
