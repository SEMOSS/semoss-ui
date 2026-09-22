import type {
	ActivityFilters,
	ActivityPeriod,
	ActivityRow,
	ActivitySort,
} from "../types/activity";
import { compareId, compareUpdated } from "./activity-rows";

export function selectAttention(rows: readonly ActivityRow[]): ActivityRow[] {
	return rows
		.filter(
			({ session }) => session.status === "Your review" || session.unread,
		)
		.sort(
			(first, second) =>
				Number(second.session.status === "Your review") -
					Number(first.session.status === "Your review") ||
				compareUpdated(first, second) ||
				compareId(first, second),
		);
}

function selectActivity(
	rows: readonly ActivityRow[],
	query = "",
	sort: ActivitySort = "date-desc",
): ActivityRow[] {
	const search = query.trim().toLowerCase();
	return rows
		.filter(
			({ agentName, session }) =>
				agentName.toLowerCase().includes(search) ||
				session.title.toLowerCase().includes(search),
		)
		.sort((first, second) => {
			const nameOrder = first.agentName.localeCompare(
				second.agentName,
				"en",
				{
					sensitivity: "base",
				},
			);
			if (sort === "name-asc" || sort === "name-desc") {
				return (
					nameOrder * (sort === "name-asc" ? 1 : -1) ||
					compareUpdated(first, second) ||
					compareId(first, second)
				);
			}
			return (
				compareUpdated(first, second, sort === "date-asc" ? 1 : -1) ||
				nameOrder ||
				compareId(first, second)
			);
		});
}

const sevenDays = 7 * 24 * 60 * 60 * 1000;

function matchesPeriod(row: ActivityRow, period: ActivityPeriod, now: number) {
	return (
		period === "all" ||
		(row.updatedTime !== null && row.updatedTime >= now - sevenDays)
	);
}

function matchesQuery(row: ActivityRow, query: string) {
	const search = query.trim().toLowerCase();
	return (
		row.agentName.toLowerCase().includes(search) ||
		row.session.title.toLowerCase().includes(search) ||
		row.session.preview.toLowerCase().includes(search)
	);
}

export function selectFilteredActivity(
	rows: readonly ActivityRow[],
	filters: ActivityFilters = {},
): ActivityRow[] {
	const {
		query = "",
		group = "recent",
		source = "all",
		period = "all",
		showRoutine = false,
		now = Date.now(),
	} = filters;
	const filtered = rows.filter(
		(row) =>
			matchesQuery(row, query) &&
			(source === "all" ||
				(source === "human"
					? row.session.origin === "You"
					: row.session.origin !== "You")) &&
			matchesPeriod(row, period, now) &&
			(showRoutine || !row.session.routine),
	);
	return selectActivity(
		filtered,
		"",
		group === "agent" ? "name-asc" : "date-desc",
	);
}
