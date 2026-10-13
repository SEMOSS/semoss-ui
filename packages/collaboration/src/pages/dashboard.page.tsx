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
			{/* the ask box leads; today's list waits below it */}
			<div className="mx-auto w-full max-w-3xl pt-4 pb-12 sm:pt-12">
				<BriefHeader />
				<LandingChatComposer />
				<TodaySuggestions />
			</div>
			<div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-6 lg:grid-cols-12">
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
