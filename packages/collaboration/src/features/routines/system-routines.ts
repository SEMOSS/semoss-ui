/** The prebuilt routines every owner can turn on, in list order. */
export const SYSTEM_ROUTINES = [
	{
		id: "inbox-daily-brief",
		name: "Inbox daily brief agent",
		pixel: "WorkGetInboxRoutine();",
	},
	{
		id: "weekly-meeting-agendas",
		name: "Weekly meeting agendas agent",
		pixel: "WorkGetAgendaRoutine();",
	},
	{
		id: "event-planning",
		name: "Event planning agent",
		pixel: "WorkGetEventPlanningRoutine();",
	},
	{
		id: "expense-review",
		name: "Expense review agent",
		pixel: "WorkGetExpenseRoutine();",
	},
] as const;

export type SystemRoutineId = (typeof SYSTEM_ROUTINES)[number]["id"];

/** The system routine with this id; undefined for one of the owner's own routines. */
export function findSystemRoutine(id: string | null) {
	return SYSTEM_ROUTINES.find((routine) => routine.id === id);
}
