import type { ReactNode } from "react";
import { useLocation, useParams } from "react-router";
import { BrainMemory } from "@/features/collaboration/components/brain-memory";
import { BrainReview } from "@/features/collaboration/components/brain-review";
import { BrainThread } from "@/features/collaboration/components/brain-thread";
import { PeopleDirectory } from "@/features/collaboration/components/people-directory";
import { PersonDetail } from "@/features/collaboration/components/person-detail";
import { SourcesAndRules } from "@/features/collaboration/components/sources-and-rules";
import { ThreadsDirectory } from "@/features/collaboration/components/threads-directory";
import { SettingsTabBar } from "@/features/settings/settings-navigation";

/** Setup views (filing, conversations, people, memory, sources) under the Settings tab bar. */
export function BrainPage() {
	const { pathname } = useLocation();
	const { personId, threadId } = useParams();
	let content: ReactNode;
	if (personId) content = <PersonDetail key={personId} />;
	else if (threadId) content = <BrainThread key={threadId} />;
	else if (pathname.endsWith("/memory")) content = <BrainMemory />;
	else if (pathname.endsWith("/sources")) content = <SourcesAndRules />;
	else if (pathname.endsWith("/people")) content = <PeopleDirectory />;
	else if (pathname.endsWith("/threads")) content = <ThreadsDirectory />;
	else content = <BrainReview />;
	return (
		<>
			<SettingsTabBar />
			{content}
		</>
	);
}
