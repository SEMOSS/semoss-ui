import { useEffect, useState } from "react";
import { styled, Table, Typography } from "@semoss/ui";
import { getTeamsByEngineId } from "@/api/teams";
import { AddTeamModal } from "@/components/teams/AddTeamModal";
import { useEngine } from "@/hooks";

const StyledTableContainer = styled(Table.Container)(({ theme }) => ({
	borderRadius: "12px",
	border: `1px solid ${theme.palette.secondary.border}`,
}));

const StyledTeamTable = styled(Table)({
	backgroundColor: "white",
});

const StyledTableTitleContainer = styled("div")({
	display: "flex",
	alignItems: "center",
	alignSelf: "stretch",
	boxShadow: "0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset",
	backgroundColor: "white",
});

const StyledTableTitleDiv = styled("div")({
	display: "flex",
	padding: "12px 24px 12px 16px",
	alignItems: "center",
	gap: "10px",
});

export const TeamsTable = () => {
	const [teams, setTeams] = useState([]);
	const { type, active } = useEngine();
	const engineId = active?.id;

	useEffect(() => {
		if (!engineId) return;
		const fetchTeams = async () => {
			try {
				const data = await getTeamsByEngineId(engineId, 10, 0);
				const permissionMap = {
					1: 'Author',
					2: 'Editor',
					3: 'Read-Only',
				};
				const mappedTeams = (Array.isArray(data) ? data : []).map(
					(team, idx) => ({
						id: team.id || idx,
						name: team.id,
						type: team.type,
						permission: permissionMap[team.permission] || team.permission,
						dateAdded: team.dateadded,
					}),
				);
				setTeams(mappedTeams);
			} catch (e) {
				console.error(e);
				setTeams([]);
			}
		};
		fetchTeams();
	}, [engineId]);
	const [addModal, setAddModal] = useState(false);
	const [nameOrder, setNameOrder] = useState<"asc" | "desc">("asc");
	const [permissionOrder, setPermissionOrder] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);

	const handleNameSort = () => {
		setNameOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		setTeams((prevTeams) =>
			[...prevTeams].sort((a, b) =>
				nameOrder === "asc"
					? a.name.localeCompare(b.name)
					: b.name.localeCompare(a.name),
			),
		);
	};

	const handlePermissionSort = () => {
		setPermissionOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		setTeams((prevTeams) =>
			[...prevTeams].sort((a, b) =>
				permissionOrder === "asc"
					? a.permission.localeCompare(b.permission)
					: b.permission.localeCompare(a.permission),
			),
		);
	};

	return (
		<div>
			<AddTeamModal
				type={type}
				open={addModal}
				onClose={() => setAddModal(false)}
			/>
			<StyledTableContainer>
				<StyledTableTitleContainer>
					<StyledTableTitleDiv>
						<Typography variant={"h6"}>Teams</Typography>
					</StyledTableTitleDiv>
				</StyledTableTitleContainer>
				<StyledTeamTable>
					<Table.Head>
						<Table.Row>
							<Table.Cell size="small">
								<Table.Sort
									active={true}
									direction={nameOrder}
									onClick={handleNameSort}
								>
									Name
								</Table.Sort>
							</Table.Cell>
							<Table.Cell size="small">Group Type</Table.Cell>
							<Table.Cell size="small">
								<Table.Sort
									active={true}
									direction={permissionOrder}
									onClick={handlePermissionSort}
								>
									Permission
								</Table.Sort>
							</Table.Cell>
							<Table.Cell size="small">
								Permission Date
							</Table.Cell>
						</Table.Row>
					</Table.Head>
					<Table.Body>
						{teams
							.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
							.map((team) => (
								<Table.Row key={team.id}>
									<Table.Cell>{team.name}</Table.Cell>
									<Table.Cell>{team.type}</Table.Cell>
									<Table.Cell>{team.permission}</Table.Cell>
									<Table.Cell>{team.dateAdded}</Table.Cell>
								</Table.Row>
							))}
					</Table.Body>
					<Table.Footer>
						<Table.Row>
							<Table.Pagination
								page={page}
								rowsPerPage={rowsPerPage}
								rowsPerPageOptions={[5, 10, 20]}
								count={teams.length}
								onPageChange={(_, newPage) => setPage(newPage)}
								onRowsPerPageChange={e => {
									setRowsPerPage(parseInt(e.target.value, 10));
									setPage(0);
								}}
							/>
						</Table.Row>
					</Table.Footer>
				</StyledTeamTable>
			</StyledTableContainer>
		</div>
	);
};
