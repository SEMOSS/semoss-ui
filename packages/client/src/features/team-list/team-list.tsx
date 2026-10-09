import { Search, Users } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	useDebouncedValue,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import type { TeamSummary } from "@/api/teams";
import { TablePagination } from "@/components/ui/table-pagination/table-pagination";
import { TeamTypeBadge } from "@/features/team-type/team-type-badge";
import { usePagedList } from "@/hooks/use-paged-list";

export interface TeamListProps {
	/** Loads a page of teams for a search */
	loadTeams: (
		searchTerm: string,
		limit: number,
		offset: number,
	) => Promise<TeamSummary[]>;
	/** Counts the teams for a search */
	countTeams: (searchTerm: string) => Promise<number>;
	/** The path of a team's page */
	getTeamPath: (team: TeamSummary) => string;
	/** The heading shown when there are no teams at all */
	emptyTitle: string;
	/** The line under the heading when there are no teams at all */
	emptyDescription: string;
	/** Actions next to the search, such as creating a team */
	actions?: ReactNode;
	/** Actions for one team, such as editing or deleting it */
	renderRowActions?: (team: TeamSummary) => ReactNode;
	/**
	 * The columns after the team's name: where its members come from, how many
	 * it has, when it was created, and when the signed in user became its manager
	 */
	columns?: TeamListColumn[];
	/** Changing it reads the teams again, such as after one is created */
	refreshKey?: number;
}

/** A column the team list can show after the team's name */
export type TeamListColumn = "type" | "members" | "created" | "managerSince";

/** The columns shown when a page does not choose its own */
const DEFAULT_COLUMNS: TeamListColumn[] = ["type", "members", "created"];

/** Shows a date the team list carries, or a dash */
const formatTeamDate = (date: string | null): string =>
	formatLocalDateTime(date ?? undefined, "MMM D, YYYY") ?? "-";

/**
 * A searchable, paged table of teams that links each team to its page.
 */
export const TeamList = ({
	loadTeams,
	countTeams,
	getTeamPath,
	emptyTitle,
	emptyDescription,
	actions,
	renderRowActions,
	columns = DEFAULT_COLUMNS,
	refreshKey = 0,
}: TeamListProps) => {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search.trim(), 300);

	const loadPage = useCallback(
		(limit: number, offset: number) =>
			loadTeams(debouncedSearch, limit, offset),
		[loadTeams, debouncedSearch],
	);
	const countRows = useCallback(
		() => countTeams(debouncedSearch),
		[countTeams, debouncedSearch],
	);
	const { rows, totalCount, isLoading, error, refresh, pagination } =
		usePagedList({
			loadPage,
			countRows,
			errorMessage: "Could not load the teams",
			refreshKey,
		});

	const shows = (column: TeamListColumn): boolean => columns.includes(column);
	const columnCount = 1 + columns.length + (renderRowActions ? 1 : 0);
	const hasSearch = debouncedSearch.length > 0;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<InputGroup className="w-full sm:max-w-sm">
					<InputGroupAddon>
						<Search className="size-4" aria-hidden />
					</InputGroupAddon>
					<InputGroupInput
						aria-label="Search teams by name"
						placeholder="Search teams by name"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							pagination.resetPage();
						}}
					/>
				</InputGroup>
				{actions ? (
					<div className="flex items-center gap-2">{actions}</div>
				) : null}
			</div>

			{error ? (
				<Alert variant="destructive">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						{error}
						<Button variant="outline" size="sm" onClick={refresh}>
							Try Again
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			<div className="overflow-hidden rounded-lg border">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-4">Team</TableHead>
								{shows("type") ? (
									<TableHead>Members From</TableHead>
								) : null}
								{shows("members") ? (
									<TableHead>Members</TableHead>
								) : null}
								{shows("created") ? (
									<TableHead className="hidden md:table-cell">
										Created
									</TableHead>
								) : null}
								{shows("managerSince") ? (
									<TableHead className="hidden sm:table-cell">
										Manager Since
									</TableHead>
								) : null}
								{renderRowActions ? (
									<TableHead className="w-12">
										<span className="sr-only">Actions</span>
									</TableHead>
								) : null}
							</TableRow>
						</TableHeader>
						<TableBody aria-busy={isLoading}>
							{rows.length > 0 ? (
								rows.map((team) => (
									<TableRow key={`${team.type}:${team.id}`}>
										<TableCell className="max-w-0 pl-4">
											<Link
												to={getTeamPath(team)}
												className="block truncate font-medium text-foreground hover:underline focus-visible:underline"
											>
												{team.id}
											</Link>
											<p className="truncate text-muted-foreground text-sm">
												{team.description ||
													"No description"}
											</p>
										</TableCell>
										{shows("type") ? (
											<TableCell className="w-48">
												<TeamTypeBadge
													type={team.type}
												/>
											</TableCell>
										) : null}
										{shows("members") ? (
											<TableCell className="w-32 whitespace-nowrap">
												{team.memberCount === null ? (
													<span className="text-muted-foreground">
														-
													</span>
												) : (
													<span className="inline-flex items-center gap-1.5">
														<Users
															className="size-4 text-muted-foreground"
															aria-hidden
														/>
														{team.memberCount}
														<span className="sr-only">
															{team.memberCount ===
															1
																? "member"
																: "members"}
														</span>
													</span>
												)}
											</TableCell>
										) : null}
										{shows("created") ? (
											<TableCell className="hidden w-36 whitespace-nowrap text-muted-foreground md:table-cell">
												{formatTeamDate(team.dateAdded)}
											</TableCell>
										) : null}
										{shows("managerSince") ? (
											<TableCell className="hidden w-36 whitespace-nowrap text-muted-foreground sm:table-cell">
												{formatTeamDate(
													team.managerSince,
												)}
											</TableCell>
										) : null}
										{renderRowActions ? (
											<TableCell className="w-12 pr-4 text-right">
												{renderRowActions(team)}
											</TableCell>
										) : null}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columnCount}
										className="h-40"
									>
										{isLoading ? (
											<p className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
												<Spinner />
												Loading teams...
											</p>
										) : error ? null : (
											<div className="flex flex-col items-center gap-2 text-center">
												<Users
													className="size-5 text-muted-foreground"
													aria-hidden
												/>
												<p className="font-medium">
													{hasSearch
														? "No teams match that search"
														: emptyTitle}
												</p>
												<p className="max-w-md text-muted-foreground text-sm">
													{hasSearch
														? "Try a different name."
														: emptyDescription}
												</p>
												{hasSearch ? (
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setSearch("");
															pagination.resetPage();
														}}
													>
														Clear Search
													</Button>
												) : null}
											</div>
										)}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<TablePagination
					className="border-t px-4 py-3"
					startRow={pagination.startRow}
					endRow={pagination.endRow}
					totalCount={totalCount}
					page={pagination.page}
					totalPages={pagination.totalPages}
					rowsPerPage={pagination.rowsPerPage}
					onPageChange={pagination.setPage}
					onRowsPerPageChange={pagination.setRowsPerPage}
					disabled={isLoading}
				/>
			</div>
		</div>
	);
};
