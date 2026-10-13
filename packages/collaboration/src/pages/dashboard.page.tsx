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
			{/* one left-led column: greeting, ask box, then the list; the day runs beside it from the top */}
			<div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-x-12 gap-y-10 pt-2 sm:pt-8 lg:grid-cols-12">
				<div className="min-w-0 lg:col-span-8">
					<BriefHeader />
					<LandingChatComposer />
					<TodaySuggestions />
					<div className="mt-12">
						<BriefNeeds />
					</div>
				</div>
				<div className="min-w-0 lg:col-span-4 lg:pt-3">
					<BriefDay />
				</div>
			</div>
		</CollaborationPage>
	);
}
