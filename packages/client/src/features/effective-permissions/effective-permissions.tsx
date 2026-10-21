import { Gauge, Info, RefreshCw, Search } from "lucide-react";
import { useId, useState } from "react";
import type {
	EffectivePermissionRow,
	EffectivePermissions as EffectivePermissionsData,
	PermissionTargetResource,
} from "@semoss/sdk";
import {
	describeBilledTo,
	LoginTypeLabel,
	ModelUsageLimitRules,
	PersonIdentity,
	UsageLimitGuideButton,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Checkbox,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	ToggleGroup,
	ToggleGroupItem,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { TablePagination } from "@/components/ui/table-pagination/table-pagination";
import { AccessViewHeader } from "@/features/bulk-access-management/access-view-header";
import { getLevelLabel } from "@/features/bulk-access-management/permission-batch";
import { UsageLimitPathSheet } from "@/features/usage-limit-path/usage-limit-path-sheet";
import type { UsageLimitPathRequest } from "@/features/usage-limit-path/use-usage-limit-path";
import { AccessSourceChip } from "./access-source-chip";
import {
	type AccessOrigin,
	getAccessOrigin,
	matchesEffectiveSearch,
} from "./effective-access-origin";
import {
	BILLED_TO_FILTERS,
	type BilledToFilter,
	describeNotApplied,
	getEffectiveLimit,
	isNotCapped,
	matchesBilledTo,
} from "./effective-usage";
import { ModelLimitRow } from "./model-limit-row";
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
	| { rowType: "PERSON"; row: EffectivePermissionRow }
	| {
			rowType: "TEAM";
			team: EffectivePermissionsData["unlistedTeams"][number];
	  };

/** The person whose path the sheet shows */
interface PathPerson {
	/** The request for their path */
	request: UsageLimitPathRequest;
	/** Their name */
	label: string;
}

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
	/**
	 * Whether the target is a model, so the view shows which usage limit
	 * applies to each person's calls, the model total and the public use limit
	 */
	isModel?: boolean;
}

/**
 * Everyone who can use a project or engine in the end, one row per person: the
 * most access they have, and every place it comes from, whether given to them
 * directly or through a team. On a model, each row also says which usage limit
 * applies to the person's calls, and opens how every limit applies to them.
 */
export const EffectivePermissions = ({
	target,
	name,
	backTo,
	admin = false,
	headingLevel = 2,
	isModel = false,
}: EffectivePermissionsProps) => {
	const billedToId = useId();
	const notCappedId = useId();
	const { access, isLoading, error, refresh } = useEffectivePermissions(
		target,
		admin,
	);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState<OriginFilter>("ALL");
	const [billedTo, setBilledTo] = useState<BilledToFilter>("ALL");
	const [isNotCappedOnly, setIsNotCappedOnly] = useState(false);
	const [page, setPage] = useState(0);
	// the person last opened stays while the sheet closes, so its title does
	// not change during the animation; isPathOpen opens and closes it
	const [pathPerson, setPathPerson] = useState<PathPerson | null>(null);
	const [isPathOpen, setIsPathOpen] = useState(false);
	const normalizedSearch = search.trim().toLowerCase();
	const people = access?.people ?? [];
	const unlistedTeams = access?.unlistedTeams ?? [];
	const isUsageFiltered = isModel && (billedTo !== "ALL" || isNotCappedOnly);
	const modelTotal =
		access?.ceilings.find(
			(ceiling) => ceiling.limitType === "MODEL_TOTAL",
		) ?? null;
	const publicUse = isModel ? (access?.publicUse ?? null) : null;
	// the model-wide rows show unless the list is searched or filtered
	const showsModelRows =
		isModel && !normalizedSearch && filter === "ALL" && !isUsageFiltered;
	const columnCount = isModel ? 7 : 4;
	// the teams that cannot be listed come first, so they are not missed
	const visible: TableEntry[] = [
		...unlistedTeams
			.filter(
				(team) =>
					(filter === "ALL" || filter === "TEAMS") &&
					!isUsageFiltered &&
					(!normalizedSearch ||
						team.id.toLowerCase().includes(normalizedSearch)),
			)
			.map((team) => ({ rowType: "TEAM" as const, team })),
		...people
			.filter(
				(row) =>
					matchesEffectiveSearch(row, normalizedSearch) &&
					(filter === "ALL" || getAccessOrigin(row) === filter) &&
					(!isModel ||
						(matchesBilledTo(row, billedTo) &&
							(!isNotCappedOnly || isNotCapped(row)))),
			)
			.map((row) => ({ rowType: "PERSON" as const, row })),
	];
	const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
	const currentPage = Math.min(page, totalPages - 1);
	const pageRows = visible.slice(
		currentPage * PAGE_SIZE,
		currentPage * PAGE_SIZE + PAGE_SIZE,
	);

	const clearFilters = () => {
		setSearch("");
		setFilter("ALL");
		setBilledTo("ALL");
		setIsNotCappedOnly(false);
		setPage(0);
	};

	return (
		<div className="flex w-full flex-col gap-6">
			<AccessViewHeader
				headingLevel={headingLevel}
				title="Effective Permissions"
				description={
					isModel ? (
						<>
							Everyone who can use {name}, with the most access
							they have, where it comes from, and which usage
							limit applies to their calls.
						</>
					) : (
						<>
							Everyone who can use {name}, with the most access
							they have and where it comes from: given to them
							directly, or through a team they are in.
						</>
					)
				}
				backTo={backTo}
				backLabel="Back to Members"
				actions={
					<>
						{isModel ? (
							<UsageLimitGuideButton
								viewer={
									admin ? { isAdminMode: true } : undefined
								}
							/>
						) : null}
						<Button
							type="button"
							variant="outline"
							disabled={isLoading}
							onClick={refresh}
						>
							<RefreshCw className="size-4" aria-hidden />
							Refresh
						</Button>
					</>
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
					<div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
						<InputGroup className="w-full lg:max-w-sm">
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
						<div className="flex flex-wrap items-center gap-3">
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
							{isModel ? (
								<>
									<div className="flex items-center gap-2">
										<Label htmlFor={billedToId}>
											Limit Applied By
										</Label>
										<Select
											value={billedTo}
											onValueChange={(value) => {
												const option =
													BILLED_TO_FILTERS.find(
														(item) =>
															item.value ===
															value,
													);
												if (option) {
													setBilledTo(option.value);
													setPage(0);
												}
											}}
										>
											<SelectTrigger
												id={billedToId}
												className="w-56"
											>
												<SelectValue>
													{
														BILLED_TO_FILTERS.find(
															(option) =>
																option.value ===
																billedTo,
														)?.label
													}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{BILLED_TO_FILTERS.map(
													(option) => (
														<SelectItem
															key={option.value}
															value={option.value}
														>
															{option.label}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
									</div>
									<div className="flex items-center gap-2">
										<Checkbox
											id={notCappedId}
											checked={isNotCappedOnly}
											onCheckedChange={(checked) => {
												setIsNotCappedOnly(
													checked === true,
												);
												setPage(0);
											}}
										/>
										<Label htmlFor={notCappedId}>
											Only People Not Capped
										</Label>
									</div>
								</>
							) : null}
						</div>
					</div>

					<div className="overflow-x-auto rounded-xl border border-border">
						<Table className="bg-background">
							<TableHeader>
								<TableRow>
									<TableHead className="pl-6">Name</TableHead>
									<TableHead>Login Type</TableHead>
									<TableHead>Access</TableHead>
									<TableHead>From</TableHead>
									{isModel ? (
										<>
											<TableHead>
												Limit Applied By
											</TableHead>
											<TableHead>Usage Limit</TableHead>
											<TableHead className="w-px">
												<span className="sr-only">
													How Limits Apply
												</span>
											</TableHead>
										</>
									) : null}
								</TableRow>
							</TableHeader>
							<TableBody>
								{showsModelRows && currentPage === 0 ? (
									<>
										{modelTotal ? (
											<ModelLimitRow
												limitType="MODEL_TOTAL"
												usageLimit={
													modelTotal.usageLimit
												}
												hasActionsColumn
											/>
										) : null}
										{publicUse ? (
											<ModelLimitRow
												limitType="PUBLIC"
												usageLimit={
													publicUse.usageLimit
												}
												isPublic={publicUse.isPublic}
												hasActionsColumn
											/>
										) : null}
									</>
								) : null}
								{pageRows.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={columnCount}
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
														onClick={clearFilters}
													>
														Show Everyone
													</Button>
												</div>
											)}
										</TableCell>
									</TableRow>
								) : (
									pageRows.map((entry) => {
										if (entry.rowType === "TEAM") {
											return (
												<ProviderTeamRow
													key={`team:${entry.team.type}:${entry.team.id}`}
													team={entry.team}
													isModel={isModel}
													hasActionsColumn={isModel}
												/>
											);
										}
										const { row } = entry;
										const label =
											row.subject.name ||
											row.subject.email ||
											row.subject.id;
										const usage = row.usage;
										const effectiveLimit =
											getEffectiveLimit(usage);
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
																		source.sourceType ===
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
												{isModel ? (
													<>
														<TableCell className="min-w-40 whitespace-normal text-sm">
															<div className="flex flex-col gap-0.5">
																<span
																	className={
																		usage?.billedTo
																			? undefined
																			: "text-muted-foreground"
																	}
																>
																	{describeBilledTo(
																		usage?.billedTo ??
																			null,
																		usage?.nextTeams,
																	)}
																</span>
																{usage?.notApplied.map(
																	(item) => (
																		<span
																			key={`${item.limitType}:${item.type ?? ""}:${item.id ?? ""}`}
																			className="text-muted-foreground text-xs"
																		>
																			{describeNotApplied(
																				item,
																			)}
																		</span>
																	),
																)}
															</div>
														</TableCell>
														<TableCell className="min-w-52 whitespace-normal text-sm">
															<ModelUsageLimitRules
																limit={
																	effectiveLimit.limit
																}
																source={
																	effectiveLimit.source
																}
																emptyLabel="No Limit"
															/>
														</TableCell>
														<TableCell className="pr-4">
															<Tooltip>
																<TooltipTrigger
																	asChild
																>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon-sm"
																		aria-label={`How limits apply to ${label}`}
																		onClick={() => {
																			setIsPathOpen(
																				true,
																			);
																			setPathPerson(
																				{
																					label,
																					request:
																						{
																							engineId:
																								target.id,
																							person: {
																								id: row
																									.subject
																									.id,
																								type: row
																									.subject
																									.type,
																							},
																							admin,
																						},
																				},
																			);
																		}}
																	>
																		<Gauge
																			className="size-4"
																			aria-hidden
																		/>
																	</Button>
																</TooltipTrigger>
																<TooltipContent>
																	How Limits
																	Apply
																</TooltipContent>
															</Tooltip>
														</TableCell>
													</>
												) : null}
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

			{isModel ? (
				<UsageLimitPathSheet
					request={isPathOpen ? (pathPerson?.request ?? null) : null}
					title={
						pathPerson
							? `How Limits Apply to ${pathPerson.label} on ${name}`
							: "How Limits Apply"
					}
					description="Every limit that applies to this person's calls, in the order they are checked, and the one their calls stop at."
					onClose={() => setIsPathOpen(false)}
				/>
			) : null}
		</div>
	);
};
