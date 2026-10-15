import type { RoutineResultCopy } from "./routine-result";

/** How the inbox brief's result view names its output. */
export const INBOX_RESULT_COPY: RoutineResultCopy = {
	title: "Latest brief",
	emptyTitle: "Your first brief will appear here",
	scheduledHint:
		"Your routine is scheduled. Come back after its first run to catch up on your inbox.",
	disabledHint:
		"Choose your schedule and enable the routine. Each run will bring your latest inbox summary to this page.",
	running:
		"Your inbox brief is being prepared. Reopen Routines in a moment to read it.",
	failed: "The last brief could not be completed",
};

/** How the weekly agendas' result view names its output. */
export const AGENDA_RESULT_COPY: RoutineResultCopy = {
	title: "Latest agendas",
	emptyTitle: "Your first agendas will appear here",
	scheduledHint:
		"Your routine is scheduled. Come back after its next run to review proposed agendas.",
	disabledHint:
		"Choose your meetings and schedule, then enable the routine. Each run brings proposed agendas to this page.",
	running:
		"Your agendas are being prepared. Reopen Routines in a moment to read them.",
	failed: "The last agendas could not be completed",
};
