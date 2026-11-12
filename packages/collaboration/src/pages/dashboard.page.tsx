import { Navigate } from "react-router";
import { CollaborationHeroPage } from "@/features/collaboration/components/collaboration-hero-page";
import { LandingChatComposer } from "@/features/daily-chat/landing-chat-composer";
import { BriefActivity } from "@/features/dashboard/brief-activity";
import { BriefDay } from "@/features/dashboard/brief-day";
import { BriefHeader } from "@/features/dashboard/brief-header";
import { BriefWork } from "@/features/dashboard/brief-work";
import { TodaySuggestions } from "@/features/dashboard/today-suggestions";
import { useNeedsOnboarding } from "@/features/onboarding/use-needs-onboarding";

/** Today: a greeting over the hero photo, an ask box, then the top work items, the day's meetings and what came in last. */
export function DashboardPage() {
	// until the owner finishes or skips setup, Today sends them back to it; other pages keep their deep links
	if (useNeedsOnboarding()) return <Navigate to="/onboarding" replace />;

	return (
		<CollaborationHeroPage>
			<BriefHeader />
			{/* the ask box leads; today's cards wait below it */}
			<div className="mx-auto w-full max-w-6xl">
				<LandingChatComposer isHero />
				<TodaySuggestions />
			</div>
			<div className="mt-10 grid @3xl:grid-cols-2 @6xl:grid-cols-13 grid-cols-1 gap-6">
				<div className="@3xl:col-span-2 @6xl:col-span-5 min-w-0">
					<BriefWork />
				</div>
				<div className="@6xl:col-span-4 min-w-0">
					<BriefDay />
				</div>
				<div className="@6xl:col-span-4 min-w-0">
					<BriefActivity />
				</div>
			</div>
		</CollaborationHeroPage>
	);
}
