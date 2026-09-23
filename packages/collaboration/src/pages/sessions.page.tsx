import { Plus, Search } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	FieldLegend,
	FieldSet,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { EmptyView } from "@/components/common/empty-view";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { ActivityList } from "@/features/activity/components/activity-list";
import type {
	ActivityPeriod,
	ActivityRow,
	ActivitySource,
} from "@/features/activity/types/activity";
import {
	selectAttention,
	selectFilteredActivity,
} from "@/features/activity/utils/activity-selectors";
import {
	mapPlaygroundRoom,
	type PlaygroundRoomRow,
	playgroundRoomsSchema,
} from "@/features/rooms/api/room-schemas";
import { sessionFromRoom } from "@/features/rooms/utils/session-from-room";
import { pixel } from "@/lib/pixel";
import { newRoomPath, roomPath } from "@/lib/workspace-paths";

type SessionView = "all" | "attention";

const roomPageSize = 100;

/** Lists every room returned for the current user. */
export function SessionsPage() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const [view, setView] = useState<SessionView>("all");
	const [search, setSearch] = useState("");
	const [source, setSource] = useState<ActivitySource>("all");
	const [period, setPeriod] = useState<ActivityPeriod>("7");
	const searchId = useId();
	const workspaceFilterId = useId();
	const sourceFilterId = useId();
	const periodFilterId = useId();
	const requestedWorkspaceId = searchParams.get("agentId") ?? "";
	const workspaceId = requestedWorkspaceId || "all";
	const searchTerm = useDebouncedValue(search).trim();
	const roomsQuery = useIteratorPixel<unknown, PlaygroundRoomRow>(
		(limit, offset) =>
			pixel("GetPlaygroundRooms", {
				limit: limit + 1,
				offset,
				sort: "DESC",
				search: searchTerm || undefined,
				roomOptionsSearch:
					workspaceId === "all" ? undefined : workspaceId,
				includeUnnamedRooms: true,
			}),
		(response) =>
			Array.isArray(response) && response.length <= roomPageSize
				? -1
				: Number.POSITIVE_INFINITY,
		(response) => {
			const parsed = playgroundRoomsSchema.safeParse(response);
			if (!parsed.success) {
				throw new Error(
					"SEMOSS returned an invalid sessions response.",
				);
			}
			return parsed.data.slice(0, roomPageSize);
		},
		{ limit: roomPageSize },
		[workspaceId, searchTerm],
	);

	const sessions = useMemo(() => {
		const seen = new Set<string>();
		return roomsQuery.data
			.filter((room) => {
				if (seen.has(room.ROOM_ID)) return false;
				seen.add(room.ROOM_ID);
				return true;
			})
			.map(mapPlaygroundRoom)
			.map(sessionFromRoom);
	}, [roomsQuery.data]);
	const workspaceIds = useMemo(
		() =>
			Array.from(
				new Set([
					...sessions
						.map((session) => session.agentId)
						.filter(Boolean),
					...(requestedWorkspaceId ? [requestedWorkspaceId] : []),
				]),
			).sort((first, second) =>
				first.localeCompare(second, "en", { sensitivity: "base" }),
			),
		[sessions, requestedWorkspaceId],
	);
	const isLoading = roomsQuery.isLoading;
	const queryError = roomsQuery.error;
	const allRows = useMemo<ActivityRow[]>(
		() =>
			sessions.map((session) => {
				const timestamp = Date.parse(session.updatedAt);
				return {
					agentName: session.agentId || "No workspace",
					session,
					updatedTime: Number.isFinite(timestamp) ? timestamp : null,
				};
			}),
		[sessions],
	);
	const viewRows = view === "attention" ? selectAttention(allRows) : allRows;
	const workspaceRows =
		workspaceId === "all"
			? viewRows
			: viewRows.filter((row) => row.session.agentId === workspaceId);
	const normalizedSearch = search.trim().toLocaleLowerCase();
	const searchedRows = normalizedSearch
		? workspaceRows.filter((row) =>
				row.session.title
					.toLocaleLowerCase()
					.includes(normalizedSearch),
			)
		: workspaceRows;
	const rows = selectFilteredActivity(searchedRows, {
		source,
		period,
	});
	const hasSessions = sessions.length > 0;
	const hasResults = rows.length > 0;

	function handleWorkspaceChange(nextWorkspaceId: string) {
		const nextSearchParams = new URLSearchParams(searchParams);
		if (nextWorkspaceId === "all") nextSearchParams.delete("agentId");
		else nextSearchParams.set("agentId", nextWorkspaceId);
		setSearchParams(nextSearchParams, { replace: true });
	}

	function handleOpenSession(sessionId: string) {
		const session = sessions.find((item) => item.id === sessionId);
		if (!session) return;
		navigate(roomPath(session.id));
	}

	function handleShowAllSessions() {
		setView("all");
		setSearch("");
		handleWorkspaceChange("all");
		setSource("all");
		setPeriod("all");
	}

	const handleLoadMore = useCallback(() => {
		if (!roomsQuery.isLoading && roomsQuery.hasMore) roomsQuery.next();
	}, [roomsQuery.hasMore, roomsQuery.isLoading, roomsQuery.next]);

	const { setScroll } = useInfiniteScroll({
		disabled: roomsQuery.isLoading || !roomsQuery.hasMore,
		triggerOnMount: false,
		onNext: handleLoadMore,
	});

	return (
		<div
			ref={setScroll}
			className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/40"
		>
			<PageContainer className="flex flex-col gap-6">
				<PageHeader
					eyebrow="A room for every thread"
					title="Your sessions"
					description="Different topics. Different context. One place to pick up where you left off."
					action={
						<Button
							size="sm"
							onClick={() => navigate(newRoomPath())}
						>
							<Plus aria-hidden="true" />
							New session
						</Button>
					}
				/>

				<Tabs
					value={view}
					onValueChange={(value) => setView(value as SessionView)}
					className="gap-4"
				>
					<TabsList
						aria-label="Session view"
						className="w-full sm:w-fit"
					>
						<TabsTrigger value="all">All sessions</TabsTrigger>
						<TabsTrigger value="attention">Needs you</TabsTrigger>
					</TabsList>

					<TabsContent value={view} className="mt-0">
						<section
							aria-label="Sessions"
							aria-busy={isLoading}
							className="overflow-hidden rounded-lg border bg-card shadow-sm"
						>
							<FieldSet className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
								<FieldLegend className="sr-only">
									Session filters
								</FieldLegend>
								<label htmlFor={searchId} className="sr-only">
									Search sessions
								</label>
								<InputGroup className="w-full lg:max-w-sm">
									<InputGroupAddon>
										<Search aria-hidden="true" />
									</InputGroupAddon>
									<InputGroupInput
										id={searchId}
										type="search"
										value={search}
										onChange={(event) =>
											setSearch(event.target.value)
										}
										placeholder="Search sessions"
										autoComplete="off"
									/>
								</InputGroup>

								<div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto">
									<label
										htmlFor={workspaceFilterId}
										className="sr-only"
									>
										Filter by workspace
									</label>
									<Select
										value={workspaceId}
										onValueChange={handleWorkspaceChange}
									>
										<SelectTrigger
											id={workspaceFilterId}
											className="w-full lg:min-w-48"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												All workspaces
											</SelectItem>
											{workspaceIds.map((id) => (
												<SelectItem key={id} value={id}>
													{id}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									<label
										htmlFor={sourceFilterId}
										className="sr-only"
									>
										Filter activity source
									</label>
									<Select
										value={source}
										onValueChange={(value) =>
											setSource(value as ActivitySource)
										}
									>
										<SelectTrigger
											id={sourceFilterId}
											className="w-full"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												All activity
											</SelectItem>
											<SelectItem value="human">
												Human-started
											</SelectItem>
											<SelectItem value="automated">
												Automated &amp; hooks
											</SelectItem>
										</SelectContent>
									</Select>

									<label
										htmlFor={periodFilterId}
										className="sr-only"
									>
										Time range
									</label>
									<Select
										value={period}
										onValueChange={(value) =>
											setPeriod(value as ActivityPeriod)
										}
									>
										<SelectTrigger
											id={periodFilterId}
											className="w-full"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="7">
												Last 7 days
											</SelectItem>
											<SelectItem value="all">
												All time
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</FieldSet>

							{queryError && !hasSessions ? (
								<EmptyView
									title="Could not load sessions"
									action={
										<Button
											variant="outline"
											onClick={roomsQuery.reset}
										>
											Try again
										</Button>
									}
								>
									{queryError.message}
								</EmptyView>
							) : isLoading && !hasSessions ? (
								<div className="flex min-h-48 items-center justify-center p-6">
									<Spinner aria-label="Loading sessions" />
								</div>
							) : !hasSessions && workspaceId === "all" ? (
								<EmptyView
									title="No sessions yet"
									action={
										<Button
											onClick={() =>
												navigate(newRoomPath())
											}
										>
											New session
										</Button>
									}
								>
									Start a session with one of your agents to
									continue here later.
								</EmptyView>
							) : !hasResults ? (
								<EmptyView
									title="No matching sessions"
									action={
										<Button
											variant="outline"
											onClick={handleShowAllSessions}
										>
											Show all sessions
										</Button>
									}
								>
									Change or clear the current filters to see
									more sessions.
								</EmptyView>
							) : (
								<ActivityList
									rows={rows}
									onOpen={handleOpenSession}
								/>
							)}

							{hasSessions && queryError ? (
								<div
									role="alert"
									className="flex flex-col items-center gap-2 border-t p-4 text-sm sm:flex-row sm:justify-center"
								>
									<span>Could not load more sessions.</span>
									<Button
										variant="outline"
										size="sm"
										onClick={roomsQuery.reset}
									>
										Try again
									</Button>
								</div>
							) : isLoading && hasSessions ? (
								<output className="flex items-center justify-center gap-2 border-t p-4 text-muted-foreground text-sm">
									<Spinner aria-hidden="true" />
									Loading more sessions
								</output>
							) : roomsQuery.hasMore ? (
								<div className="flex justify-center border-t p-4">
									<Button
										variant="outline"
										onClick={handleLoadMore}
									>
										Load more sessions
									</Button>
								</div>
							) : null}

							<output
								className="block border-t px-4 py-3 text-end text-muted-foreground text-xs"
								aria-live="polite"
							>
								{rows.length}{" "}
								{rows.length === 1 ? "session" : "sessions"}{" "}
								shown
							</output>
						</section>
					</TabsContent>
				</Tabs>
			</PageContainer>
		</div>
	);
}
