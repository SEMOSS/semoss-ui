import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { BriefDay } from "@/features/dashboard/brief-day";
import { BriefHeader } from "@/features/dashboard/brief-header";
import { BriefNeeds } from "@/features/dashboard/brief-needs";
import { TodaySuggestions } from "@/features/dashboard/today-suggestions";

/** Today: what is due, an ask box, the short task list and the day's meetings. */
export function DashboardPage() {
	return (
		<CollaborationPage>
			<BriefHeader />
			<div className="mb-6 min-w-0">
				<LandingChatComposer />
				<TodaySuggestions />
			</div>
			<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
				<div className="min-w-0 lg:col-span-8">
					<BriefNeeds />
				</div>
				<div className="min-w-0 lg:col-span-4">
					<BriefDay />
				</div>
			</div>
		</CollaborationPage>
	);
}
