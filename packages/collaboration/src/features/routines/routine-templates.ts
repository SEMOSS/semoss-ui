import type { CUSTOM_ROUTINE_DELIVERIES } from "./custom-routine-schema";
import type { ROUTINE_DAYS } from "./routine-schema";

/** A starting point for a new routine: a common job, written the way an owner would ask for it. */
export interface RoutineTemplate {
	/** Stable, so the idea keeps its avatar color. */
	id: string;
	name: string;
	/** The task in the owner's words; like any task, it never says how the result is sent. */
	prompt: string;
	days: (typeof ROUTINE_DAYS)[number][];
	/** Local run time, HH:mm. */
	time: string;
	delivery: (typeof CUSTOM_ROUTINE_DELIVERIES)[number];
}

const WEEKDAYS: RoutineTemplate["days"] = ["MON", "TUE", "WED", "THU", "FRI"];

/** The ideas a new routine can start from, most common first. */
export const ROUTINE_TEMPLATES: readonly RoutineTemplate[] = [
	{
		id: "template-client-asks",
		name: "Client asks digest",
		prompt: "Summarize what my clients asked for since yesterday, grouped by client, and flag anything that is waiting on me.",
		days: WEEKDAYS,
		time: "08:00",
		delivery: "email",
	},
	{
		id: "template-waiting-on-me",
		name: "Waiting on my reply",
		prompt: "List the emails from the last two days that are still waiting on my reply, most urgent first, with one line on what each person needs.",
		days: WEEKDAYS,
		time: "09:00",
		delivery: "email",
	},
	{
		id: "template-meeting-prep",
		name: "Tomorrow's meeting prep",
		prompt: "For each meeting on my calendar tomorrow, summarize my recent emails and chats with the people in it and list what I should bring up.",
		days: WEEKDAYS,
		time: "16:00",
		delivery: "email",
	},
	{
		id: "template-weekly-status",
		name: "Weekly status draft",
		prompt: "Write my weekly status from my sent mail and chats this week: what I finished, what is in progress, and what is blocked.",
		days: ["FRI"],
		time: "15:00",
		delivery: "email",
	},
	{
		id: "template-monday-priorities",
		name: "Monday priorities",
		prompt: "Look at my inbox, calendar, and open conversations and give me my top five priorities for the week, with one line on why each matters.",
		days: ["MON"],
		time: "07:30",
		delivery: "teams",
	},
];
