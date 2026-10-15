import { Info, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import type {
	EffectivePermissionRow,
	EffectivePermissions as EffectivePermissionsData,
	PermissionTargetResource,
} from "@semoss/sdk";
import { LoginTypeLabel, PersonIdentity } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	AlertTitle,
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
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { TablePagination } from "@/components/ui/table-pagination/table-pagination";
import { AccessViewHeader } from "@/features/bulk-access-management/access-view-header";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import { AccessSourceChip } from "./access-source-chip";
import {
	type AccessOrigin,
	getAccessOrigin,
	matchesEffectiveSearch,
} from "./effective-access-origin";
import { ProviderTeamRow } from "./provider-team-row";
import { useEffectivePermissions } from "./use-effective-permissions";

/** Rows per page; most lists fit on one */
const PAGE_SIZE = 1000;

/** Which people the table shows */
type OriginFilter = "ALL" | AccessOrigin;

/** The filter's choices */
const ORIGIN_FILTERS: { value: OriginFilter; label: string }[] = [
	{ value: "ALL", label: "Everyone" },
	{ value: "DIRECT", label: "Direct Only" },
	{ value: "TEAMS", label: "Teams Only" },
	{ value: "BOTH", label: "Both" },
];

/** One row of the table: a person, or a team whose members cannot be listed */
type TableEntry =
	| { kind: "PERSON"; row: EffectivePermissionRow }
	| { kind: "TEAM"; team: EffectivePermissionsData["unlistedTeams"][number] };

export interface EffectivePermissionsProps {
	/** The project or engine */
	target: PermissionTargetResource;
	/** Its name */
	name: string;
	/** Where its access page is, relative to this view */
	backTo: string;
	/** Whether to read in admin mode; outside it an admin has only their own permissions */
	admin?: boolean;
	/** The title's heading level: 3 when the view sits under a page's own heading */
	headingLevel?: 2 | 3;
}

/**
 * Everyone who can use a project or engine in the end, one row per person: the
 * most access they have, and every place it comes from, whether given to them
 * directly or through a team.
 */
export const EffectivePermissions = ({
	target,
	name,
	backTo,
	admin = false,
	headingLevel = 2,
}: EffectivePermissionsProps) => {
	const { access, isLoading, error, refresh } = useEffectivePermissions(
		target,
		admin,
	);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<OriginFilter>("ALL");
	const [page, setPage] = useState(0);
	const normalizedSearch = search.trim().toLowerCase();
	const people = access?.people ?? [];
	const unlistedTeams = access?.unlistedTeams ?? [];
	// the teams that cannot be listed come first, so they are not missed
	const visible: TableEntry[] = [
		...unlistedTeams
			.filter(
				(team) =>
					(filter === "ALL" || filter === "TEAMS") &&
					(!normalizedSearch ||
						team.id.toLowerCase().includes(normalizedSearch)),
			)
			.map((team) => ({ kind: "TEAM" as const, team })),
		...people
			.filter(
				(row) =>
					matchesEffectiveSearch(row, normalizedSearch) &&
					(filter === "ALL" || getAccessOrigin(row) === filter),
			)
			.map((row) => ({ kind: "PERSON" as const, row })),
	];
	const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const pageRows = visible.slice(
		currentPage * PAGE_SIZE,
		currentPage * PAGE_SIZE + PAGE_SIZE,
	);

	return (
		<div className="flex w-full flex-col gap-6">
			<AccessViewHeader
				headingLevel={headingLevel}
				title="Effective Permissions"
				description={
					<>
						Everyone who can use {name}, with the most access they
						have and where it comes from: given to them directly, or
						through a team they are in.
					</>
				}
				backTo={backTo}
				backLabel="Back to Members"
				actions={
					<Button
						type="button"
						variant="outline"
						disabled={isLoading}
						onClick={refresh}
					>
						<RefreshCw className="size-4" aria-hidden />
						Refresh
					</Button>
				}
			/>

			{error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{unlistedTeams.length > 0 ? (
				<Alert>
					<Info className="size-4" aria-hidden />
					<AlertTitle>
						Login Provider Teams Show as One Row
					</AlertTitle>
					<AlertDescription>
						Teams that mirror a group in a login provider, such as
						Microsoft, get their members from that provider when
						people sign in. This app does not keep a list of who is
						in them, so each one shows as a single row, and everyone
						in the group gets the access shown.
					</AlertDescription>
				</Alert>
			) : null}

			{isLoading && !access ? (
				<output className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
					{/* the output announces the text, so the spinner is not a second status */}
					<Spinner className="size-4" aria-hidden />
					Loading who can use this...
				</output>
			) : access ? (
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<InputGroup className="w-full sm:max-w-sm">
							<InputGroupAddon>
								<Search className="size-4" aria-hidden />
							</InputGroupAddon>
							<InputGroupInput
								aria-label="Search people or teams"
								placeholder="Search people or teams"
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(0);
								}}
							/>
						</InputGroup>
						<ToggleGroup
							type="single"
							variant="outline"
							value={filter}
							onValueChange={(value) => {
								const option = ORIGIN_FILTERS.find(
									(item) => item.value === value,
								);
								if (option) {
									setFilter(option.value);
									setPage(0);
								}
							}}
							aria-label="Where access comes from"
						>
							{ORIGIN_FILTERS.map((option) => (
								<ToggleGroupItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					</div>

					<div className="overflow-x-auto rounded-xl border border-border">
						<Table className="bg-background">
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Name</TableHead>
									<TableHead>Login Type</TableHead>
									<TableHead>Access</TableHead>
									<TableHead>From</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pageRows.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={4}
											className="py-6 text-center text-muted-foreground"
										>
											{people.length === 0 &&
											unlistedTeams.length === 0 ? (
												"No one can use this yet"
											) : (
												<div className="flex flex-col items-center gap-2">
													No one matches the search or
													filter
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => {
															setSearch("");
															setFilter("ALL");
															setPage(0);
														}}
													>
														Show Everyone
													</Button>
												</div>
											)}
										</TableCell>
									</TableRow>
								) : (
									pageRows.map((entry) => {
										if (entry.kind === "TEAM") {
											return (
												<ProviderTeamRow
													key={`team:${entry.team.type}:${entry.team.id}`}
													team={entry.team}
												/>
											);
										}
										const { row } = entry;
										const label =
											row.subject.name ||
											row.subject.email ||
											row.subject.id;
										return (
											<TableRow
												key={`${row.subject.type}:${row.subject.id}`}
											>
												<TableCell className="pl-6">
													<PersonIdentity
														name={label}
														type={row.subject.type}
														id={row.subject.id}
														email={
															row.subject.email
														}
													/>
												</TableCell>
												<TableCell>
													<LoginTypeLabel
														type={row.subject.type}
														className="text-sm"
													/>
												</TableCell>
												<TableCell className="font-medium">
													{getLevelLabel(row.level)}
												</TableCell>
												<TableCell>
													<div className="flex flex-wrap gap-1.5">
														{row.sources.map(
															(source) => (
																<AccessSourceChip
																	key={
																		source.kind ===
																		"TEAM"
																			? `${source.type}:${source.id}`
																			: "DIRECT"
																	}
																	source={
																		source
																	}
																	isEffective={
																		source.level ===
																		row.level
																	}
																/>
															),
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</div>
					{visible.length > PAGE_SIZE ? (
						<TablePagination
							startRow={currentPage * PAGE_SIZE + 1}
							endRow={Math.min(
								(currentPage + 1) * PAGE_SIZE,
								visible.length,
							)}
							totalCount={visible.length}
							page={currentPage}
							totalPages={totalPages}
							rowsPerPage={PAGE_SIZE}
							onPageChange={setPage}
							onRowsPerPageChange={() => setPage(0)}
							rowsPerPageOptions={[PAGE_SIZE]}
						/>
					) : null}
				</div>
			) : null}
		</div>
	);
};
