import { H1, P } from "@semoss/ui/next";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { dashboardTimeZone } from "@/features/dashboard/dashboard-calendar";

interface DailyChatHeaderProps {
	/** Profile display name used in the dedicated chat page greeting. */
	userName?: string;
}

/** New Session contains a chat and its tools, with one centered welcome. */
export function DailyChatHeader({ userName }: DailyChatHeaderProps) {
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
		<header className="flex min-w-0 flex-col gap-2 text-center">
			<H1 className="text-2xl sm:text-3xl">
				{greeting}
				{firstName ? `, ${firstName}` : ""}.
			</H1>
			<P className="text-muted-foreground">
				What would you like to work on?
			</P>
		</header>
	);
}
