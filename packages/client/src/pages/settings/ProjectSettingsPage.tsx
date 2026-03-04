import {
	ArrowDownward,
	ArrowUpward,
	FormatListBulletedOutlined,
	SpaceDashboardOutlined,
} from "@mui/icons-material";
import { useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Backdrop,
	CircularProgress,
	Grid,
	Menu,
	Search,
	Select,
	Stack,
	styled,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { ProjectTileCard } from "@/components/app";
import { useAPI, useSettings } from "../../hooks";

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	width: "auto",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: theme.spacing(3),
}));

const StyledSearch = styled(Search)({
	width: "80%",
});

const StyledSearchbarContainer = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	alignItems: "flex-start",
	gap: theme.spacing(3),
}));

const StyledSort = styled(Select)({
	width: "20%",
});

const StyledBackdrop = styled(Backdrop)({
	backgroundColor: "rgba(255, 255, 255, 0.5)",
	zIndex: 1501,
});

const initialState = {
	projects: [],
};

const reducer = (state, action) => {
	switch (action.type) {
		case "field": {
			return {
				...state,
				[action.field]: action.value,
			};
		}
		case "sort": {
			const sortedProjects = [...state.projects];
			if (action.sortBy === "Name") {
				sortedProjects.sort((a, b) => {
					return action.sortType === "ASC"
						? a.project_name
								.toLowerCase()
								.localeCompare(b.project_name.toLowerCase())
						: b.project_name
								.toLowerCase()
								.localeCompare(a.project_name.toLowerCase());
				});
			} else if (action.sortBy === "Date Created") {
				sortedProjects.sort((a, b) => {
					return action.sortType === "ASC"
						? new Date(a.project_date_created).getTime() -
								new Date(b.project_date_created).getTime()
						: new Date(b.project_date_created).getTime() -
								new Date(a.project_date_created).getTime();
				});
			}
			return {
				...state,
				projects: sortedProjects,
			};
		}
	}
	return state;
};

export interface ProjectInterface {
	project_global: boolean;
	project_id: string;
	project_name: string;
	permission: number;
}

export const ProjectSettingsPage = () => {
	const { adminMode } = useSettings();
	const navigate = useNavigate();
	const [state, dispatch] = useReducer(reducer, initialState);
	const { projects } = state;

	const [view, setView] = useState("tile");
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sort, setSort] = useState("Name");
	const [sortOrder, setSortOrder] = useState("ASC");
	const [canCollect, setCanCollect] = useState(true);
	const [offset, setOffset] = useState(0);
	const [isSearching, setIsSearching] = useState(false);

	//** amount of items to be loaded */
	const limit = 30;

	// To focus when getting new results
	const searchbarRef = useRef(null);

	useEffect(() => {
		setIsSearching(true);
		const timer = setTimeout(() => {
			setDebouncedSearch(search);
			setIsSearching(false);
		}, 400);

		return () => {
			clearTimeout(timer);
		};
	}, [search]);

	const getProjects = useAPI([
		"getProjects",
		adminMode,
		debouncedSearch,
		offset,
		limit,
	]);

	const formatProjectName = (str) => {
		let i;
		const frags = str.split("_");
		for (i = 0; i < frags.length; i++) {
			frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
		}
		return frags.join(" ");
	};

	//** reset dataMode if adminMode is toggled */
	useEffect(() => {
		setOffset(0);
		dispatch({
			type: "field",
			field: "projects",
			value: [],
		});
	}, [adminMode, debouncedSearch]);

	//** append data through infinite scroll */
	useEffect(() => {
		if (getProjects.status !== "SUCCESS") {
			return;
		}

		if (getProjects.data.length < limit) {
			setCanCollect(false);
		} else {
			if (!canCollectRef.current) {
				setCanCollect(true);
			}
		}

		const mutateListWithVotes = projects;

		getProjects.data.forEach((proj) => {
			mutateListWithVotes.push({
				...proj,
				project_global: proj.project_global,
				project_id: proj.project_id,
				project_name: proj.project_name,
				project_permission: proj.project_permission,
				project_visibility: proj.project_visibility,
			});
		});

		dispatch({
			type: "field",
			field: "projects",
			value: mutateListWithVotes,
		});

		searchbarRef.current?.focus();
	}, [getProjects.status, getProjects.data]);

	//** infinite sroll variables */
	let scrollEle, scrollTimeout, currentScroll, previousScroll;
	const offsetRef = useRef(0);
	offsetRef.current = offset;
	const canCollectRef = useRef(true);
	canCollectRef.current = canCollect;

	const scrollAll = () => {
		currentScroll = scrollEle.scrollTop + scrollEle.offsetHeight;
		if (
			currentScroll > scrollEle.scrollHeight * 0.75 &&
			currentScroll > previousScroll
		) {
			if (scrollTimeout) {
				clearTimeout(scrollTimeout);
			}

			scrollTimeout = setTimeout(() => {
				if (!canCollectRef.current) {
					return;
				}

				setOffset(offsetRef.current + limit);
			}, 500);
		}

		previousScroll = currentScroll;
	};

	/**
	 * @desc infinite scroll
	 */
	useEffect(() => {
		scrollEle = document.querySelector("#home__content");

		scrollEle.addEventListener("scroll", scrollAll);
		return () => {
			scrollEle.removeEventListener("scroll", scrollAll);
		};
	}, [scrollEle]);

	return (
		<>
			<StyledBackdrop open={getProjects.status === "LOADING" || isSearching}>
				<Stack
					direction={"column"}
					alignItems={"center"}
					justifyContent={"center"}
					spacing={1}
				>
					<CircularProgress />
					<Typography variant="body2">
						{isSearching ? "Searching" : "Loading"}
					</Typography>
					<Typography variant="caption">Projects</Typography>
				</Stack>
			</StyledBackdrop>
			<StyledContainer>
				<StyledSearchbarContainer>
					<StyledSearch
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
						}}
						placeholder="Project"
						size="small"
						onClear={() => setSearch("")}
						ref={searchbarRef}
					/>
					<StyledSort
						size={"small"}
						value={sort}
						onChange={(e) => setSort(e.target.value)}
					>
						<Menu.Item value="Name">Name</Menu.Item>
						<Menu.Item value="Date Created">Date Created</Menu.Item>
						<Menu.Item value="Views">Views</Menu.Item>
						<Menu.Item value="Trending">Trending</Menu.Item>
						<Menu.Item value="Upvotes">Upvotes</Menu.Item>
					</StyledSort>

					<ToggleButtonGroup
						size={"small"}
						value={sortOrder}
						color="primary"
					>
						<ToggleButton
							onClick={(e, v) => {
								dispatch({
									type: "sort",
									sortBy: sort,
									sortType: "DESC",
								});
								setSortOrder(v);
							}}
							value={"DESC"}
							aria-label={"Descending Order"}
							data-testid={"projectSettingsPage-desc-btn"}
						>
							<Tooltip title={"Descending Order"}>
								<ArrowDownward />
							</Tooltip>
						</ToggleButton>
						<ToggleButton
							onClick={(e, v) => {
								dispatch({
									type: "sort",
									sortBy: sort,
									sortType: "ASC",
								});
								setSortOrder(v);
							}}
							value={"ASC"}
							aria-label={"Ascending Order"}
							data-testid={"projectSettingsPage-asc-btn"}
						>
							<Tooltip title={"Ascending Order"}>
								<ArrowUpward />
							</Tooltip>
						</ToggleButton>
					</ToggleButtonGroup>

					<ToggleButtonGroup
						size={"small"}
						value={view}
						color="primary"
					>
						<ToggleButton
							onClick={(e, v) => setView(v)}
							value={"tile"}
							data-testid={"projectSettingsPage-tile-btn"}
						>
							<Tooltip title={"Tile View"}>
								<SpaceDashboardOutlined />
							</Tooltip>
						</ToggleButton>
						<ToggleButton
							onClick={(e, v) => setView(v)}
							value={"list"}
							data-testid={"projectSettingsPage-list-btn"}
						>
							<Tooltip title={"List View"}>
								<FormatListBulletedOutlined />
							</Tooltip>
						</ToggleButton>
					</ToggleButtonGroup>
				</StyledSearchbarContainer>
				<Grid container spacing={3}>
					{projects.length === 0 &&
					getProjects.status === "SUCCESS" &&
					debouncedSearch ? (
						<Grid item xs={12}>
							<Typography
								variant="body1"
								sx={{ textAlign: "center", py: 4 }}
							>
								No projects found matching &quot;{debouncedSearch}
								&quot;
							</Typography>
						</Grid>
					) : null}
					{projects.length
						? projects.map((project, i) => {
								return (
									<Grid
										item
										key={i}
										sm={view === "list" ? 12 : 12}
										md={view === "list" ? 12 : 6}
										lg={view === "list" ? 12 : 4}
										xl={view === "list" ? 12 : 3}
									>
										{view === "list" ? (
											<ProjectTileCard
												name={formatProjectName(
													project.project_name,
												)}
												id={project.project_id}
												description={
													project.description
												}
												onClick={() => {
													navigate(
														`${project.project_id}`,
														{
															state: {
																name: formatProjectName(
																	project.project_name,
																),
																global: false,
																permission: 3,
															},
														},
													);
												}}
											/>
										) : (
											<ProjectTileCard
												name={formatProjectName(
													project.project_name,
												)}
												id={project.project_id}
												description={
													project.description
												}
												onClick={() => {
													navigate(
														`${project.project_id}`,
														{
															state: {
																name: formatProjectName(
																	project.project_name,
																),
																global: false,
																permission: 3,
															},
														},
													);
												}}
											/>
										)}
									</Grid>
								);
							})
						: "No apps to choose from"}
				</Grid>
			</StyledContainer>
		</>
	);
};
