import { Navigate } from "react-router";
import heroPhoto from "@/assets/img/today-hero.jpg";
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
		// no scroller of its own: the shell scrolls Today with its header, and on desktop the page starts behind that header
		<div className="lg:-mt-14 relative isolate min-w-0 px-4 pb-8 sm:px-6 lg:px-8 lg:pt-14">
			{/* decorative; hidden where it would crowd the greeting or glare on a dark page */}
			<img
				src={heroPhoto}
				alt=""
				className="-z-10 mask-b-from-60% mask-l-from-50% pointer-events-none absolute top-0 right-0 hidden h-auto w-3/5 max-w-4xl select-none xl:not-dark:block"
			/>
			<div className="@container mx-auto w-full max-w-screen-2xl">
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
			</div>
		</div>
	);
}
