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

/** How the expense review's result view names its output. */
export const EXPENSE_RESULT_COPY: RoutineResultCopy = {
	title: "Latest review",
	emptyTitle: "Your first review will appear here",
	scheduledHint:
		"Your routine is on. The next approval request in your inbox gets a suggested decision here and by email.",
	disabledHint:
		"Add your guideline documents and enable the routine. Each approval request then gets a suggested decision here.",
	running:
		"Your review is being prepared. Reopen Routines in a moment to read it.",
	failed: "The last review could not be completed",
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

/** How event planning's result view names its output. */
export const EVENT_PLANNING_RESULT_COPY: RoutineResultCopy = {
	title: "Latest plan",
	emptyTitle: "Your first plan will appear here",
	scheduledHint:
		"Your routine is scheduled. Run it now, or come back after its next run to review the lineups.",
	disabledHint:
		"Pin your meetings and choose a schedule, then enable the routine. Each run updates their sheets and emails them to you.",
	running:
		"Your lineups are being planned. Reopen Routines in a moment to read the digest.",
	failed: "The last plan could not be completed",
};
