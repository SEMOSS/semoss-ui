/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { ArrowDown, ArrowUp } from "lucide-react";
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

export const TeamsTable = ({ type, id }) => {
	const [teams, setTeams] = useState<any[]>([]);
	useEffect(() => {
		if (!type || !id) return;
		const fetchTeams = async () => {
			try {
				let data: any[] = [];
				if (type === "ENGINE") {
					const result = await getGroupsWithAccessToEngine(
						String(id),
						100,
						0,
					);
					data = Array.isArray(result) ? result : [];
				} else if (type === "PROJECT") {
					const result = await getGroupsWithAccessToProject(
						String(id),
						100,
						0,
					);
					data = Array.isArray(result) ? result : [];
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
			} catch (e) {
				console.error(e);
				setTeams([]);
			}
		};
		fetchTeams();
	}, [type, id]);
	const [addModal, setAddModal] = useState(false);
	const [nameOrder, setNameOrder] = useState<"asc" | "desc">("asc");
	const [permissionOrder, setPermissionOrder] = useState<"asc" | "desc">(
		"asc",
	);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);

	const handleNameSort = () => {
		setNameOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		setTeams((prevTeams) =>
			[...prevTeams].sort((a, b) => {
				const nameA = String(a.name);
				const nameB = String(b.name);
				return nameOrder === "asc"
					? nameA.localeCompare(nameB)
					: nameB.localeCompare(nameA);
			}),
		);
	};

	const handlePermissionSort = () => {
		setPermissionOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		setTeams((prevTeams) =>
			[...prevTeams].sort((a, b) => {
				const permA = String(a.permission);
				const permB = String(b.permission);
				return permissionOrder === "asc"
					? permA.localeCompare(permB)
					: permB.localeCompare(permA);
			}),
		);
	};

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
								<Button
									variant="ghost"
									size="sm"
									onClick={handleNameSort}
									className="h-full w-full justify-start gap-1 rounded-none px-4 py-3"
								>
									Name
									{nameOrder === "asc" ? (
										<ArrowUp className="size-4" />
									) : (
										<ArrowDown className="size-4" />
									)}
								</Button>
							</TableHead>
							<TableHead>Group Type</TableHead>
							<TableHead className="p-0">
								<Button
									variant="ghost"
									size="sm"
									onClick={handlePermissionSort}
									className="h-full w-full justify-start gap-1 rounded-none px-4 py-3"
								>
									Permission
									{permissionOrder === "asc" ? (
										<ArrowUp className="size-4" />
									) : (
										<ArrowDown className="size-4" />
									)}
								</Button>
							</TableHead>
							<TableHead>Permission Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{teams.length > 0 ? (
							teams
								.slice(
									page * rowsPerPage,
									page * rowsPerPage + rowsPerPage,
								)
								.map((team) => (
									<TableRow key={team.id}>
										<TableCell>{team.name}</TableCell>
										<TableCell>{team.type}</TableCell>
										<TableCell>{team.permission}</TableCell>
										<TableCell>{team.dateAdded}</TableCell>
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
												setPage(0);
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
										{page * rowsPerPage + 1}-
										{Math.min(
											(page + 1) * rowsPerPage,
											teams.length,
										)}{" "}
										of {teams.length}
									</div>
									<div className="flex gap-1">
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() => setPage(0)}
											disabled={page === 0}
										>
											{"<<"}
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												setPage(Math.max(0, page - 1))
											}
											disabled={page === 0}
										>
											{"<"}
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												setPage(
													Math.min(
														Math.ceil(
															teams.length /
																rowsPerPage,
														) - 1,
														page + 1,
													),
												)
											}
											disabled={
												page >=
												Math.ceil(
													teams.length / rowsPerPage,
												) -
													1
											}
										>
											{">"}
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												setPage(
													Math.ceil(
														teams.length /
															rowsPerPage,
													) - 1,
												)
											}
											disabled={
												page >=
												Math.ceil(
													teams.length / rowsPerPage,
												) -
													1
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
