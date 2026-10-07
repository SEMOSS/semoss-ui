import type { ReactNode } from "react";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { BriefBrain } from "@/features/dashboard/brief-brain";
import { BriefDay } from "@/features/dashboard/brief-day";
import { BriefHandled } from "@/features/dashboard/brief-handled";
import { BriefHeader } from "@/features/dashboard/brief-header";
import { BriefNeeds } from "@/features/dashboard/brief-needs";
import { RecentSessions } from "@/features/dashboard/recent-sessions";

/** Global overview with one chat entry point and independent workspace sections. */
export function DashboardPage({
	chatComposer,
}: {
	/** The visual fixture supplies the real composer with a local preview session. */
	chatComposer?: ReactNode;
} = {}) {
	return (
		<CollaborationPage>
			<BriefHeader />
			<div className="mb-6 min-w-0">
				{chatComposer ?? <LandingChatComposer />}
			</div>
			<div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-12">
				<div className="min-w-0 md:row-span-2 xl:col-span-5 xl:col-start-4 xl:row-start-1">
					<BriefNeeds />
				</div>
				<div className="min-w-0 space-y-4 xl:col-span-4 xl:col-start-9 xl:row-start-1">
					<BriefBrain />
					<RecentSessions />
				</div>
				<div className="min-w-0 space-y-4 xl:col-span-3 xl:col-start-1 xl:row-start-1">
					<BriefDay />
					<BriefHandled />
				</div>
			</div>
		</CollaborationPage>
	);
}
