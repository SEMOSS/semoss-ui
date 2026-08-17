import { useEffect, useState } from "react";
import {
	Button,
	H4,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import {
	getGroupsWithAccessToEngine,
	getGroupsWithAccessToProject,
} from "@/api/teams";
import { AddTeamModal } from "@/components/teams/add-team-modal";
import { useServerPagination } from "@/hooks";

interface RawTeam {
	ID: string;
	TYPE: string;
	PERMISSION: number | string;
	DATEADDED: string;
	USAGERESTRICTION?: string | null;
	USAGEFREQUENCY?: string | null;
	MAXTOKENS?: number | null;
	MAXRESPONSETIME?: number | null;
	MAXCREDITS?: number | null;
}

interface TeamRow {
	id: string | number;
	name: string;
	type: string;
	permission: string;
	dateAdded: string;
	usageRestriction?: string | null;
	usageFrequency?: string | null;
	maxTokens?: number | null;
	maxResponseTime?: number | null;
	maxCredits?: number | null;
}

const parseGroupsResponse = (result: unknown) => {
	if (Array.isArray(result)) {
		return {
			groups: result as RawTeam[],
			totalGroups: result.length,
			hasTotal: false,
		};
	}
	if (result && typeof result === "object") {
		const payload = result as {
			groups?: RawTeam[];
			totalGroups?: number;
		};
		const groups = Array.isArray(payload.groups) ? payload.groups : [];
		const hasTotal = typeof payload.totalGroups === "number";
		return {
			groups,
			totalGroups: hasTotal ? payload.totalGroups : groups.length,
			hasTotal,
		};
	}
	return { groups: [] as RawTeam[], totalGroups: 0, hasTotal: false };
};

const RESTRICTION_LABEL: Record<string, string> = {
	TOKEN: "Token",
	COMPUTE: "Compute time",
	CREDIT: "Credit",
};

const FREQUENCY_LABEL: Record<string, string> = {
	DAY: "Daily",
	WEEK: "Weekly",
	MONTH: "Monthly",
	YEAR: "Yearly",
	ALL_TIME: "All time",
};

function restrictionType(team: TeamRow): string {
	const r = team.usageRestriction?.toUpperCase();
	if (!r || r === "NULL") return "—";
	return RESTRICTION_LABEL[r] ?? r;
}

function restrictionValue(team: TeamRow): string {
	const r = team.usageRestriction?.toUpperCase();
	if (!r || r === "NULL") return "—";
	if (r === "TOKEN" && team.maxTokens != null)
		return team.maxTokens.toLocaleString();
	if (r === "COMPUTE" && team.maxResponseTime != null)
		return `${team.maxResponseTime.toLocaleString()} ms`;
	if (r === "CREDIT" && team.maxCredits != null)
		return team.maxCredits.toLocaleString();
	return "—";
}

function restrictionFrequency(team: TeamRow): string {
	const r = team.usageRestriction?.toUpperCase();
	if (!r || r === "NULL" || !team.usageFrequency) return "—";
	return FREQUENCY_LABEL[team.usageFrequency] ?? team.usageFrequency;
}

export const TeamsTable = ({
	type,
	id,
	engineType,
}: {
	type: string;
	id: string | number;
	engineType?: string;
}) => {
	const showRestrictions = type === "ENGINE" && engineType === "MODEL";
	const [teams, setTeams] = useState<TeamRow[]>([]);
	const [totalTeams, setTotalTeams] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [usesServerPagination, setUsesServerPagination] = useState(false);
	const [addModal, setAddModal] = useState(false);
	const {
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		offset,
		totalPages,
		startRow,
		endRow,
	} = useServerPagination({
		totalCount: totalTeams,
		initialRowsPerPage: 5,
		pageIndexBase: 0,
	});

	useEffect(() => {
		if (!type || !id) return;
		const fetchTeams = async () => {
			setIsLoading(true);
			try {
				let data: RawTeam[] = [];
				let total = 0;
				let serverPaginated = false;
				const limit = rowsPerPage;

				if (type === "ENGINE") {
					const result = await getGroupsWithAccessToEngine(
						String(id),
						limit,
						offset,
					);
					const parsed = parseGroupsResponse(result);
					if (parsed.hasTotal) {
						data = parsed.groups;
						total = parsed.totalGroups;
						serverPaginated = true;
					} else {
						const fullResult = await getGroupsWithAccessToEngine(
							String(id),
							100,
							0,
						);
						const fullParsed = parseGroupsResponse(fullResult);
						data = fullParsed.groups;
						total = fullParsed.totalGroups;
					}
				} else if (type === "PROJECT") {
					const result = await getGroupsWithAccessToProject(
						String(id),
						limit,
						offset,
					);
					const parsed = parseGroupsResponse(result);
					if (parsed.hasTotal) {
						data = parsed.groups;
						total = parsed.totalGroups;
						serverPaginated = true;
					} else {
						const fullResult = await getGroupsWithAccessToProject(
							String(id),
							100,
							0,
						);
						const fullParsed = parseGroupsResponse(fullResult);
						data = fullParsed.groups;
						total = fullParsed.totalGroups;
					}
				}

				const permissionMap: Record<string, string> = {
					"1": "Author",
					"2": "Editor",
					"3": "Read-Only",
				};
				const mappedTeams: TeamRow[] = data.map((team, idx) => ({
					id: team.ID || idx,
					name: team.ID,
					type: team.TYPE,
					permission:
						permissionMap[String(team.PERMISSION)] ||
						String(team.PERMISSION),
					dateAdded: team.DATEADDED,
					usageRestriction: team.USAGERESTRICTION,
					usageFrequency: team.USAGEFREQUENCY,
					maxTokens: team.MAXTOKENS,
					maxResponseTime: team.MAXRESPONSETIME,
					maxCredits: team.MAXCREDITS,
				}));
				setTeams(mappedTeams);
				setTotalTeams(total);
				setUsesServerPagination(serverPaginated);
			} catch (e) {
				console.error(e);
				setTeams([]);
				setTotalTeams(0);
				setUsesServerPagination(false);
			} finally {
				setIsLoading(false);
			}
		};
		fetchTeams();
	}, [id, rowsPerPage, type, offset]);

	const visibleTeams = usesServerPagination
		? teams
		: teams.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

	return (
		<div className="rounded-xl">
			<AddTeamModal
				type={type}
				open={addModal}
				onClose={() => setAddModal(false)}
			/>
			<div className="rounded-xl border border-border">
				<div className="flex items-center self-stretch rounded-t-xl bg-background shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.12)_inset]">
					<div className="flex items-center gap-2.5 p-3 px-6 py-3">
						<H4>Teams</H4>
					</div>
				</div>
				<div className="overflow-x-auto">
					<Table className="mb-[0.5px] rounded-b-xl bg-background">
						<TableHeader>
							<TableRow>
								<TableHead className="p-0">
									<div className="py-3 pr-4 pl-6 text-left">
										Name
									</div>
								</TableHead>
								<TableHead className="px-4">
									Group Type
								</TableHead>
								<TableHead className="p-0">
									<div className="px-4 py-3 text-left">
										Permission
									</div>
								</TableHead>
								{showRestrictions && (
									<>
										<TableHead className="px-4">
											Limit Type
										</TableHead>
										<TableHead className="px-4">
											Limit Value
										</TableHead>
										<TableHead className="px-4">
											Frequency
										</TableHead>
									</>
								)}
								<TableHead className="px-4">
									Permission Date
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{visibleTeams.length > 0 ? (
								visibleTeams.map((team) => (
									<TableRow key={team.id}>
										<TableCell className="pr-4 pl-6">
											{team.name}
										</TableCell>
										<TableCell className="px-4">
											{team.type}
										</TableCell>
										<TableCell className="px-4">
											{team.permission}
										</TableCell>
										{showRestrictions && (
											<>
												<TableCell className="px-4">
													{restrictionType(team)}
												</TableCell>
												<TableCell className="px-4">
													{restrictionValue(team)}
												</TableCell>
												<TableCell className="px-4">
													{restrictionFrequency(team)}
												</TableCell>
											</>
										)}
										<TableCell className="px-4">
											{team.dateAdded}
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={showRestrictions ? 7 : 4}
										className="text-center"
									>
										No teams found
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell colSpan={showRestrictions ? 7 : 4}>
									<div className="flex items-center justify-end gap-4 px-2">
										<div className="flex items-center gap-2">
											<span className="text-sm">
												Rows per page:
											</span>
											<Select
												value={String(rowsPerPage)}
												onValueChange={(value) => {
													setRowsPerPage(
														parseInt(value, 10),
													);
												}}
											>
												<SelectTrigger className="h-8 w-[70px]">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="5">
														5
													</SelectItem>
													<SelectItem value="10">
														10
													</SelectItem>
													<SelectItem value="20">
														20
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="text-sm">
											{startRow}-{endRow} of {totalTeams}
										</div>
										<div className="flex gap-1">
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() => setPage(0)}
												disabled={
													page === 0 || isLoading
												}
											>
												{"<<"}
											</Button>
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() =>
													setPage(
														Math.max(0, page - 1),
													)
												}
												disabled={
													page === 0 || isLoading
												}
											>
												{"<"}
											</Button>
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() =>
													setPage(
														Math.min(
															totalPages - 1,
															page + 1,
														),
													)
												}
												disabled={
													page >= totalPages - 1 ||
													isLoading
												}
											>
												{">"}
											</Button>
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() =>
													setPage(totalPages - 1)
												}
												disabled={
													page >= totalPages - 1 ||
													isLoading
												}
											>
												{">>"}
											</Button>
										</div>
									</div>
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</div>
			</div>
		</div>
	);
};
