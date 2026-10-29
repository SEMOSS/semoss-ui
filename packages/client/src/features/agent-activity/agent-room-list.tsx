import {
	ChevronLeft,
	ChevronRight,
	RefreshCw,
	SearchIcon,
	X,
} from "lucide-react";
import type { ReactNode } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	cn,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
} from "@semoss/ui/next";
import {
	AGENT_RUN_ROOMS_PAGE_SIZE,
	type AgentRunRoom,
	type AgentRunRoomStatusFilter,
} from "@/api/agent-runs";
import { type AgentRoomColumn, AgentRoomTable } from "./agent-room-table";
import type { UseAgentRoomQueryResult } from "./use-agent-room-query";
import type { UseAgentRoomsResult } from "./use-agent-rooms";

/** The status filter's choices, in the order the select lists them */
const STATUS_OPTIONS: { value: AgentRunRoomStatusFilter; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "active", label: "In progress" },
	{ value: "failed", label: "Failed" },
];

export interface AgentRoomListProps {
	/** What the list is called, for its toolbar, table and pagination */
	label: string;
	/** The room search, status and page, kept by the page */
	query: UseAgentRoomQueryResult;
	/** The page of rooms read with the query */
	roomPage: UseAgentRoomsResult;
	/** More filters after the search, such as an agent or a user */
	filters?: ReactNode;
	/** Whether the page's own filters narrow the list */
	hasPageFilters?: boolean;
	/** Clears the page's own filters, along with the search and the status */
	onClearPageFilters?: () => void;
	/** More columns after the room */
	columns?: AgentRoomColumn[];
	/** What the list says when there are no rooms at all */
	emptyTitle: string;
	/** More about the empty list, such as where its rooms come from */
	emptyDescription: string;
	/** Opens a room */
	onOpen: (room: AgentRunRoom) => void;
}

/**
 * A page of rooms with agent runs, most recently active first: a toolbar with
 * the room search by name or id, the page's own filters, Status, Clear filters
 * and Refresh, then the rooms, or why there are none, and the pages. While
 * another page is read, the footer says so rather than counting the rooms
 * still shown from the last one.
 */
export const AgentRoomList = ({
	label,
	query,
	roomPage,
	filters,
	hasPageFilters = false,
	onClearPageFilters,
	columns,
	emptyTitle,
	emptyDescription,
	onOpen,
}: AgentRoomListProps) => {
	const { rooms, total, isLoading, isRefreshing, error, refresh } = roomPage;
	const isBusy = isLoading || isRefreshing;
	const hasFilters = query.hasFilters || hasPageFilters;
	const firstShown = query.page * AGENT_RUN_ROOMS_PAGE_SIZE + 1;
	const lastShown = query.page * AGENT_RUN_ROOMS_PAGE_SIZE + rooms.length;

	const handleClearFilters = () => {
		query.clear();
		onClearPageFilters?.();
	};

	return (
		<>
			<div
				role="toolbar"
				aria-label={`${label} filters`}
				className="flex flex-col gap-3 border-b py-3 lg:flex-row lg:items-center"
			>
				<InputGroup className="w-full lg:max-w-xs">
					<InputGroupAddon>
						<SearchIcon
							className="size-4 text-muted-foreground"
							aria-hidden="true"
						/>
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Search rooms by name or id"
						aria-label="Search rooms"
						value={query.search}
						onChange={(event) =>
							query.setSearch(event.target.value)
						}
						data-testid="agentRoomList-search"
					/>
					{query.search ? (
						<InputGroupAddon align="inline-end">
							<InputGroupButton
								size="icon-xs"
								variant="ghost"
								aria-label="Clear the room search"
								onClick={() => query.setSearch("")}
							>
								<X className="size-4" aria-hidden="true" />
							</InputGroupButton>
						</InputGroupAddon>
					) : null}
				</InputGroup>
				<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
					{filters}
					<Select
						value={query.status}
						onValueChange={(value) =>
							query.setStatus(value as AgentRunRoomStatusFilter)
						}
					>
						<SelectTrigger
							className="w-full sm:w-44"
							aria-label={`Status: ${STATUS_OPTIONS.find((option) => option.value === query.status)?.label ?? ""}`}
							data-testid="agentRoomList-status-select"
						>
							<span className="flex min-w-0 items-center gap-1.5">
								<span className="text-muted-foreground">
									Status:
								</span>
								<SelectValue />
							</span>
						</SelectTrigger>
						<SelectContent>
							{STATUS_OPTIONS.map((option) => (
								<SelectItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{hasFilters ? (
						<Button
							type="button"
							variant="ghost"
							onClick={handleClearFilters}
						>
							Clear filters
						</Button>
					) : null}
				</div>
				<Button
					type="button"
					variant="outline"
					size="icon"
					aria-label="Refresh"
					title="Refresh the rooms"
					className="self-end lg:ms-auto lg:self-auto"
					disabled={isBusy}
					onClick={refresh}
				>
					<RefreshCw className="size-4" aria-hidden="true" />
				</Button>
			</div>
			{error ? (
				<Alert variant="destructive" className="mt-4">
					<AlertTitle>Unable to load the rooms</AlertTitle>
					<AlertDescription>
						<P className="break-words text-sm">{error}</P>
						<Button
							type="button"
							variant="outline"
							onClick={refresh}
						>
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			) : isLoading ? (
				<div
					className="flex min-h-60 flex-col gap-4 py-4"
					aria-hidden="true"
				>
					{[0, 1, 2, 3, 4].map((row) => (
						<Skeleton key={row} className="h-10 w-full" />
					))}
				</div>
			) : rooms.length === 0 ? (
				<div className="flex min-h-60 flex-col items-center justify-center gap-2 p-6 text-center">
					<H4 className="font-medium text-base">
						{hasFilters
							? "No matching rooms"
							: query.page > 0
								? "No more rooms"
								: emptyTitle}
					</H4>
					<P className="max-w-prose text-muted-foreground text-sm">
						{hasFilters
							? "Change or clear the filters to see more rooms."
							: emptyDescription}
					</P>
					{hasFilters ? (
						<Button
							type="button"
							variant="outline"
							onClick={handleClearFilters}
						>
							Clear filters
						</Button>
					) : null}
				</div>
			) : (
				<section
					className={cn(
						"min-w-0 overflow-x-auto",
						isRefreshing && "opacity-60",
					)}
					aria-label={label}
					aria-busy={isRefreshing}
				>
					<AgentRoomTable
						rooms={rooms}
						columns={columns}
						onOpen={onOpen}
						caption="Rooms with agent runs, most recently active first"
					/>
				</section>
			)}
			<footer className="flex flex-col gap-3 border-t py-3 sm:flex-row sm:items-center sm:justify-between">
				<output>
					<P className="text-muted-foreground text-sm">
						{isBusy
							? "Loading rooms..."
							: error
								? "Rooms unavailable"
								: rooms.length === 0
									? "0 rooms"
									: `Showing ${firstShown}-${lastShown} of ${total} rooms`}
					</P>
				</output>
				<nav
					aria-label={`${label} pagination`}
					className="flex flex-wrap items-center gap-2"
				>
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label="Previous"
						title="Previous page"
						disabled={isBusy || query.page === 0}
						onClick={() => query.setPage(query.page - 1)}
					>
						<ChevronLeft aria-hidden="true" className="size-4" />
					</Button>
					<span className="min-w-16 text-center text-sm">
						Page {query.page + 1}
					</span>
					<Button
						type="button"
						variant="outline"
						size="icon"
						aria-label="Next"
						title="Next page"
						disabled={
							isBusy || Boolean(error) || lastShown >= total
						}
						onClick={() => query.setPage(query.page + 1)}
					>
						<ChevronRight aria-hidden="true" className="size-4" />
					</Button>
				</nav>
			</footer>
		</>
	);
};
