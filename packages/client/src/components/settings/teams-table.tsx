/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
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

export const TeamsTable = ({ type, id }) => {
	const [teams, setTeams] = useState<any[]>([]);
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

	const parseGroupsResponse = (result: unknown) => {
		if (Array.isArray(result)) {
			return {
				groups: result,
				totalGroups: result.length,
				hasTotal: false,
			};
		}
		if (result && typeof result === "object") {
			const payload = result as {
				groups?: any[];
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
		return { groups: [], totalGroups: 0, hasTotal: false };
	};

	useEffect(() => {
		if (!type || !id) return;
		const fetchTeams = async () => {
			setIsLoading(true);
			try {
				let data: any[] = [];
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

				const permissionMap = {
					1: "Author",
					2: "Editor",
					3: "Read-Only",
				};
				const mappedTeams = data.map((team, idx) => ({
					id: team.ID || idx,
					name: team.ID,
					type: team.TYPE,
					permission:
						permissionMap[team.PERMISSION] || team.PERMISSION,
					dateAdded: team.DATEADDED,
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
	}, [id, page, rowsPerPage, type, offset]);

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
				<Table className="mb-[0.5px] rounded-b-xl bg-background">
					<TableHeader>
						<TableRow>
							<TableHead className="p-0">
								<div className="py-3 pr-4 pl-6 text-left">
									Name
								</div>
							</TableHead>
							<TableHead className="px-4">Group Type</TableHead>
							<TableHead className="p-0">
								<div className="px-4 py-3 text-left">
									Permission
								</div>
							</TableHead>
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
									<TableCell className="px-4">
										{team.dateAdded}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={4} className="text-center">
									No teams found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
					<TableFooter>
						<TableRow>
							<TableCell colSpan={4}>
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
											disabled={page === 0 || isLoading}
										>
											{"<<"}
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												setPage(Math.max(0, page - 1))
											}
											disabled={page === 0 || isLoading}
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
	);
};
