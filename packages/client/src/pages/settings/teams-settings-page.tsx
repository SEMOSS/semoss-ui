import { Plus, Search, Users } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	H3,
	H4,
	Input,
	P,
} from "@semoss/ui/next";
import { getTeams, getTeamsCount } from "@/api";
import { AddTeamModal } from "@/components/teams/add-team-modal";
import { TeamTileCard } from "@/components/teams/team-tile-card";
import { useNavigate } from "@/hooks/useNavigate";
import { useSettings } from "@/hooks/useSettings";

const initialState = {
	favoritedDbs: [],
	teams: [],
};

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

const PAGE_SIZE = 50;

export const TeamsSettingsPage = observer(() => {
	const { adminMode } = useSettings();
	const navigate = useNavigate();

	const [addModal, setAddModal] = useState(false);
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [offset, setOffset] = useState(0);
	const [totalTeamsAll, setTotalTeamsAll] = useState(0);
	const [totalTeamsFiltered, setTotalTeamsFiltered] = useState(0);
	const [state, dispatch] = useReducer(reducer, initialState);
	const { teams } = state;

	const [search, setSearch] = useState("");

	const searchbarRef = useRef<HTMLInputElement | null>(null);
	const loadMoreRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(search.trim());
		}, 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		let isMounted = true;

		const loadTeams = async () => {
			setIsLoading(true);
			try {
				const [teamsResponse, countResponse] = await Promise.all([
					getTeams(adminMode, debouncedSearch, PAGE_SIZE, 0),
					getTeamsCount(adminMode, debouncedSearch),
				]);

				if (!isMounted) {
					return;
				}

				const loadedTeams = Array.isArray(teamsResponse)
					? teamsResponse
					: [];
				const totalCount =
					typeof countResponse === "number"
						? countResponse
						: Number(
								(countResponse as { count?: number })?.count ??
									(countResponse as { numGroups?: number })
										?.numGroups ??
									0,
							);
				const safeTotalCount = Number.isFinite(totalCount)
					? totalCount
					: 0;

				dispatch({
					type: "field",
					field: "teams",
					value: loadedTeams,
				});
				if (debouncedSearch.length === 0) {
					setTotalTeamsAll(safeTotalCount);
				}
				setTotalTeamsFiltered(safeTotalCount);
				setOffset(loadedTeams.length);
			} catch (error) {
				if (!isMounted) {
					return;
				}
				console.error(error);
				dispatch({
					type: "field",
					field: "teams",
					value: [],
				});
				if (debouncedSearch.length === 0) {
					setTotalTeamsAll(0);
				}
				setTotalTeamsFiltered(0);
				setOffset(0);
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadTeams();

		return () => {
			isMounted = false;
		};
	}, [adminMode, debouncedSearch]);

	const loadMoreTeams = useCallback(async () => {
		const activeTotalTeams =
			debouncedSearch.length > 0 ? totalTeamsFiltered : totalTeamsAll;
		if (isLoading) {
			return;
		}
		if (offset >= activeTotalTeams) {
			return;
		}

		setIsLoading(true);
		try {
			const teamsResponse = await getTeams(
				adminMode,
				debouncedSearch,
				PAGE_SIZE,
				offset,
			);
			const loadedTeams = Array.isArray(teamsResponse)
				? teamsResponse
				: [];

			dispatch({
				type: "field",
				field: "teams",
				value: [...teams, ...loadedTeams],
			});
			setOffset((prev) => prev + loadedTeams.length);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}, [
		adminMode,
		debouncedSearch,
		isLoading,
		offset,
		teams,
		totalTeamsAll,
		totalTeamsFiltered,
	]);

	useEffect(() => {
		if (!loadMoreRef.current) {
			return;
		}
		const activeTotalTeams =
			debouncedSearch.length > 0 ? totalTeamsFiltered : totalTeamsAll;
		if (isLoading || offset >= activeTotalTeams) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					loadMoreTeams();
				}
			},
			{
				root: null,
				rootMargin: "200px",
				threshold: 0,
			},
		);

		observer.observe(loadMoreRef.current);

		return () => {
			observer.disconnect();
		};
	}, [
		debouncedSearch,
		isLoading,
		loadMoreTeams,
		offset,
		totalTeamsAll,
		totalTeamsFiltered,
	]);

	// Build a URL-safe slug for a team id WITHOUT mutating case or removing characters (just encode)
	const teamSlug = useCallback((id: string) => encodeURIComponent(id), []);
	const handleTeamDelete = useCallback(async () => {
		setTotalTeamsAll((prev) => Math.max(prev - 1, 0));
		setTotalTeamsFiltered((prev) => Math.max(prev - 1, 0));
		setOffset((prev) => Math.max(prev - 1, 0));

		try {
			const totalCountAll = await getTeamsCount(adminMode);
			setTotalTeamsAll(totalCountAll);

			if (debouncedSearch.length > 0) {
				const totalCountFiltered = await getTeamsCount(
					adminMode,
					debouncedSearch,
				);
				setTotalTeamsFiltered(totalCountFiltered);
			} else {
				setTotalTeamsFiltered(totalCountAll);
			}
		} catch (error) {
			console.error(error);
		}
	}, [adminMode, debouncedSearch]);

	const visibleTeams = teams.length || 0;
	const resultLabel =
		debouncedSearch.length > 0
			? `${visibleTeams} of ${totalTeamsAll} teams`
			: `${totalTeamsAll} teams`;

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex w-full flex-col gap-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="space-y-1">
						<H3>Teams</H3>
						<P className="text-muted-foreground">
							Manage team access, members, and permissions across
							your workspace.
						</P>
					</div>
					<Button
						className="h-10 gap-2"
						onClick={() => setAddModal(true)}
						data-testid={"teamsSettings-add-btn"}
					>
						<Plus className="size-4" />
						Add Team
					</Button>
				</div>
				<div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
					<Badge
						variant="secondary"
						className="rounded-full px-3 py-1"
					>
						{resultLabel}
					</Badge>
				</div>
			</div>

			<div className="relative w-full">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
				<Input
					ref={searchbarRef}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search teams by name"
					aria-label="Search teams"
					className="pl-9"
				/>
			</div>

			<div className="min-h-[220px]">
				{visibleTeams === 0 && !isLoading ? (
					<Card className="border-dashed">
						<CardContent className="flex flex-col items-center gap-3 py-12 text-center">
							<div className="rounded-full bg-muted p-3">
								<Users className="size-5 text-muted-foreground" />
							</div>
							<H4>No teams found</H4>
							<P className="max-w-md text-muted-foreground">
								Try adjusting your search or create a new team
								to start managing permissions.
							</P>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{teams.map((team, i) => (
							<div key={team.id || i} className="h-full">
								<TeamTileCard
									key={team.id || i}
									id={team.id}
									type={team.type}
									description={team.description}
									dispatch={dispatch}
									teams={teams}
									onDelete={handleTeamDelete}
									onClick={() =>
										navigate(
											`${teamSlug(team.type)}/${teamSlug(team.id)}`,
										)
									}
								/>
							</div>
						))}
					</div>
				)}
				{visibleTeams > 0 && (
					<div
						ref={loadMoreRef}
						className="flex w-full items-center justify-center py-6 text-muted-foreground text-sm"
					>
						{isLoading
							? "Loading more teams..."
							: offset <
									(debouncedSearch.length > 0
										? totalTeamsFiltered
										: totalTeamsAll)
								? "Scroll to load more"
								: "All teams loaded"}
					</div>
				)}
			</div>

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
						setTotalTeamsAll((prev) => prev + 1);
						if (debouncedSearch.length === 0) {
							setTotalTeamsFiltered((prev) => prev + 1);
							setOffset((prev) => prev + 1);
						}
					}
					setAddModal(false);
				}}
			/>
		</div>
	);
});
