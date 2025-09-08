import { Add, Delete, Edit } from "@mui/icons-material";
import { useState } from "react";
import {
	Button,
	Checkbox,
	IconButton,
	styled,
	Table,
	Typography,
} from "@semoss/ui";
import { AddTeamModal } from "@/components/teams/AddTeamModal";
import { useEngine } from "@/hooks";

const StyledAddButton = styled(Button)({
	width: "150px",
	borderRadius: "12px",
	marginBottom: "16px",
});

const StyledButtonContainer = styled("div")({
	display: "flex",
	justifyContent: "flex-end",
	width: "100%",
	marginTop: "16px",
});

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

const StyledTableCell = styled(Table.Cell)({
	paddingLeft: "16px",
});

const StyledCheckbox = styled(Checkbox)({
	paddingBottom: "0px",
});

export const TeamsTable = () => {
	const [teams, setTeams] = useState([
		{
			id: 1,
			name: "Team 1",
			permission: "Editor",
			dateAdded: "2025-05-14 14:34:42",
			limitType: "None",
			limitValue: "-",
			frequency: "-",
		},
		{
			id: 2,
			name: "Team 2",
			permission: "Author",
			dateAdded: "2025-05-15 10:00:00",
			limitType: "None",
			limitValue: "-",
			frequency: "-",
		},
	]);
	const [addModal, setAddModal] = useState(false);
	const [nameOrder, setNameOrder] = useState<"asc" | "desc">("asc");
	const [permissionOrder, setPermissionOrder] = useState<"asc" | "desc">(
		"asc",
	);
	const { type } = useEngine();

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
			<StyledButtonContainer>
				<StyledAddButton
					variant="contained"
					startIcon={<Add />}
					onClick={() => setAddModal(true)}
					data-testid={"teams-settings-add-btn"}
				>
					Add Team
				</StyledAddButton>
			</StyledButtonContainer>
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
							<Table.Cell size="small" padding="checkbox">
								<Checkbox />
							</Table.Cell>
							<Table.Cell size="small">
								<Table.Sort
									active={true}
									direction={nameOrder}
									onClick={handleNameSort}
								>
									Name
								</Table.Sort>
							</Table.Cell>
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
							<Table.Cell size="small">
								Model Limit Type
							</Table.Cell>
							<Table.Cell size="small">Limit Value</Table.Cell>
							<Table.Cell size="small">Frequency</Table.Cell>
							<Table.Cell size="small">Actions</Table.Cell>
						</Table.Row>
					</Table.Head>
					<Table.Body>
						{teams.map((team) => (
							<Table.Row key={team.id}>
								<StyledTableCell
									size="medium"
									padding="checkbox"
								>
									<StyledCheckbox />
								</StyledTableCell>
								<Table.Cell>{team.name}</Table.Cell>
								<Table.Cell>{team.permission}</Table.Cell>
								<Table.Cell>{team.dateAdded}</Table.Cell>
								<Table.Cell>{team.limitType}</Table.Cell>
								<Table.Cell>{team.limitValue}</Table.Cell>
								<Table.Cell>{team.frequency}</Table.Cell>
								<Table.Cell size="medium">
									<IconButton>
										<Edit />
									</IconButton>
									<IconButton>
										<Delete />
									</IconButton>
								</Table.Cell>
							</Table.Row>
						))}
					</Table.Body>
					<Table.Footer>
						<Table.Row>
							<Table.Pagination
								page={0}
								rowsPerPage={5}
								rowsPerPageOptions={[5, 10, 20]}
								count={teams.length}
								onPageChange={() => {}}
								onRowsPerPageChange={() => {}}
							/>
						</Table.Row>
					</Table.Footer>
				</StyledTeamTable>
			</StyledTableContainer>
		</div>
	);
};
