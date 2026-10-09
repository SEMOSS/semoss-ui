import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { BriefBrain } from "@/features/dashboard/brief-brain";
import { BriefDay } from "@/features/dashboard/brief-day";
import { BriefHandled } from "@/features/dashboard/brief-handled";
import { BriefHeader } from "@/features/dashboard/brief-header";

/** Global overview with one chat entry point and independent workspace sections. */
export function DashboardPage() {
	return (
		<CollaborationPage>
			<BriefHeader />
			<div className="mb-6 min-w-0">
				<LandingChatComposer />
			</div>
			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
				<BriefDay />
				<BriefBrain />
				<BriefHandled />
			</div>
		</CollaborationPage>
	);
}
