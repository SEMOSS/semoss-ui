import { H2, P } from "@semoss/ui/next";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { dashboardTimeZone } from "@/features/dashboard/dashboard-calendar";

interface DailyChatWelcomeProps {
	/** Profile name, when the owner has supplied one. */
	userName?: string;
}

/** Center a brief greeting above the new-chat composer, as in Playground. */
export function DailyChatWelcome({ userName }: DailyChatWelcomeProps) {
	const collaboration = useOptionalCollaborationSession();
	const firstName = userName?.trim().split(/\s+/)[0];
	const profile =
		collaboration?.state.liveProfile ?? collaboration?.state.profile;
	const hour = Number(
		new Intl.DateTimeFormat("en-GB", {
			timeZone: dashboardTimeZone(profile?.timezone ?? ""),
			hour: "numeric",
			hourCycle: "h23",
		}).format(new Date()),
	);
	const greeting =
		hour < 12
			? "Good morning"
			: hour < 18
				? "Good afternoon"
				: "Good evening";
	return (
		<section
			aria-label="Assistant welcome"
			className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center"
		>
			<H2 className="text-2xl sm:text-3xl">
				{greeting}
				{firstName ? `, ${firstName}` : ""}.
			</H2>
			<P className="text-muted-foreground">
				What would you like to work on?
			</P>
		</section>
	);
}
