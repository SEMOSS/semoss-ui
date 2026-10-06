import { useState } from "react";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { BriefAsk } from "@/features/dashboard/brief-ask";
import { BriefBrain } from "@/features/dashboard/brief-brain";
import { BriefDay } from "@/features/dashboard/brief-day";
import { BriefHandled } from "@/features/dashboard/brief-handled";
import { BriefHeader } from "@/features/dashboard/brief-header";
import { BriefNeeds } from "@/features/dashboard/brief-needs";

/** The fixed daily brief: your day, the decisions needing you, and a place to ask. */
export function DashboardPage() {
	const [topicId, setTopicId] = useState("");
	return (
		<CollaborationPage>
			<BriefHeader topicId={topicId} onTopicChange={setTopicId} />
			<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12">
				<div className="min-w-0 space-y-4 md:col-span-4 xl:col-span-3">
					<BriefDay />
					<BriefHandled topicId={topicId} />
				</div>
				<div className="min-w-0 md:col-span-8 xl:col-span-5">
					<BriefNeeds topicId={topicId} />
				</div>
				<div className="grid min-w-0 grid-cols-1 gap-4 md:col-span-12 md:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
					<BriefAsk topicId={topicId} onTopicChange={setTopicId} />
					<BriefBrain />
				</div>
			</div>
		</CollaborationPage>
	);
}
