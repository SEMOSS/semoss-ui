import { Add, ArrowBack, ArrowForward, ExpandMore } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { debounced } from "@semoss/sdk/react";
import {
	Box,
	Button,
	Grid,
	IconButton,
	Menu,
	Search,
	styled,
	Typography,
} from "@semoss/ui";
import { getTeams } from "@/api";
import { AddTeamModal } from "@/components/teams/add-team-modal";
import { TeamTileCard } from "@/components/teams/TeamTileCard";
import { useSettings } from "@/hooks/useSettings";

export interface DBMember {
	ID: string;
	NAME: string;
	PERMISSION: string;
	EMAIL: string;
	SELECTED: boolean;
}

export interface Database {
	app_cost: string;
	app_favorite: number;
	app_id: string;
	app_name: string;
	app_type: string;
	database_cost: string;
	database_id: string;
	database_name: string;
	database_type: string;
	low_database_name: string;
	database_global: true;
	database_favorite?: number;
	permission?: number;
	user_permission?: number;
}

const StyledContainer = styled("div")({
	display: "flex",
	width: "100%",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: "24px",
});

const StyledSearchbarContainer = styled("div")({
	display: "flex",
	width: "100%",
	alignItems: "flex-start",
	justifyContent: "space-between",
	gap: "24px",
});

const StyledSearchbar = styled(Search)({
	width: "80%",
});

const initialState = {
	favoritedDbs: [],
	teams: [],
};

const StyledSearchbarDiv = styled("div")({
	display: "flex",
	gap: "16px",
});

const StyledAddButton = styled(Button)({
	width: "150px",
	borderRadius: "12px",
});

const reducer = (state, action) => {
	switch (action.type) {
		case "field": {
			return {
				...state,
				[action.field]: action.value,
			};
		}
	}
	return state;
};

const TeamsList = styled("div")({
	width: "100%",
});

export const TeamsSettingsPage = observer(() => {
	const { adminMode } = useSettings();
	const navigate = useNavigate();

	const [addModal, setAddModal] = useState(false);
	const [filteredTeams, setFilteredTeams] = useState([]);
	const [state, dispatch] = useReducer(reducer, initialState);
	const { teams } = state;
	const [anchorEl, setAnchorEl] = useState(null);

	const [search, setSearch] = useState("");

	const searchbarRef = useRef(null);

	useEffect(() => {
		getTeams(true).then((data) => {
			dispatch({
				type: "field",
				field: "teams",
				value: data,
			});
		});
	}, [adminMode, search]);

	// Updated debounced filtering function
	const filterTeams = useCallback(() => {
		setFilteredTeams(
			teams
				.filter((d) =>
					d.id.toLowerCase().includes(search.toLowerCase()),
				)
				.sort((a, b) => a.id.localeCompare(b.id)),
		);
	}, [teams, search]);

	const debouncedFilterTeams = debounced(filterTeams, 150);

	// Trigger debounced filtering when teams or search changes
	useEffect(() => {
		debouncedFilterTeams();
	}, [teams, search, debouncedFilterTeams]);

	const handleMenuClick = (event) => {
		setAnchorEl(event.currentTarget);
	};
	const handleMenuClose = () => {
		setAnchorEl(null);
	};
	const handleSort = (order) => {
		const sorted = [...filteredTeams].sort((a, b) => {
			if (order === "asc") {
				return a.id.localeCompare(b.id);
			} else {
				return b.id.localeCompare(a.id);
			}
		});
		setFilteredTeams(sorted);
		handleMenuClose();
	};

	const isAsc = () => {
		const sorted = [...filteredTeams].sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		return JSON.stringify(filteredTeams) === JSON.stringify(sorted);
	};

	const isDesc = () => {
		const sorted = [...filteredTeams].sort((a, b) => {
			return b.id.localeCompare(a.id);
		});
		return JSON.stringify(filteredTeams) === JSON.stringify(sorted);
	};

	// Build a URL-safe slug for a team id WITHOUT mutating case or removing characters (just encode)
	const teamSlug = useCallback((id: string) => encodeURIComponent(id), []);

	return (
		<StyledContainer>
			<StyledSearchbarContainer>
				<Typography
					variant="h5"
					sx={{
						fontSize: "24px",
						fontWeight: 500,
						fontFamily: "Inter",
					}}
				>
					Teams
				</Typography>
				<StyledSearchbarDiv>
					<StyledSearchbar
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
						}}
						size="small"
						ref={searchbarRef}
					/>
					<StyledAddButton
						variant="contained"
						startIcon={<Add />}
						onClick={() => setAddModal(true)}
						data-testid={"teamsSettings-add-btn"}
					>
						Add Team
					</StyledAddButton>
				</StyledSearchbarDiv>
			</StyledSearchbarContainer>

			<TeamsList>
				<Box
					sx={{
						display: "flex",
						justifyContent: "flex-end",
						mb: 2,
					}}
				>
					<IconButton
						onClick={handleMenuClick}
						data-testid={"teamsSettings-sort-btn"}
					>
						<Typography
							sx={{ color: "#212121", borderRadius: "0px" }}
							variant="body2"
						>
							Sort By
						</Typography>
						<ExpandMore />
					</IconButton>
				</Box>

				<Menu
					anchorEl={anchorEl}
					open={Boolean(anchorEl)}
					onClose={handleMenuClose}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "right",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: "left",
					}}
					sx={{
						"& .MuiList-root": {
							width: "218px",
							margin: "0px",
						},
						"& .MuiPaper-root": {
							borderRadius: "4px",
						},
					}}
				>
					<Menu.Item
						onClick={() => handleSort("asc")}
						sx={{
							backgroundColor: isAsc() ? "#EBF3F8" : "inherit",
						}}
					>
						A<ArrowForward fontSize="small" />Z
					</Menu.Item>
					<Menu.Item
						onClick={() => handleSort("desc")}
						sx={{
							backgroundColor: isDesc() ? "#EBF3F8" : "inherit",
						}}
					>
						Z<ArrowBack fontSize="small" />A
					</Menu.Item>
				</Menu>

				<Grid container spacing={3}>
					{filteredTeams.map((team, i) => (
						<Grid
							item
							key={team.id || i}
							sm={12}
							md={6}
							lg={4}
							xl={3}
						>
							<TeamTileCard
								key={team.id || i}
								id={team.id}
								type={team.type}
								description={team.description}
								dispatch={dispatch}
								teams={teams}
								onClick={() =>
									navigate(
										`${teamSlug(team.type)}/${teamSlug(team.id)}`,
									)
								}
							/>
						</Grid>
					))}
				</Grid>
			</TeamsList>

			<AddTeamModal
				open={addModal}
				onClose={(team) => {
					if (team) {
						const obj = {
							id: team.id,
							type: team.type,
							description: team.description,
						};

						dispatch({
							type: "field",
							field: "teams",
							value: [...teams, obj],
						});
					}
					setAddModal(false);
				}}
			/>
		</StyledContainer>
	);
});
