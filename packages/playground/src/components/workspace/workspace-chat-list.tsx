import { Link } from "react-router-dom";
import { useIteratorPixel } from "@semoss/sdk/react";
import { ScrollArea, Spinner, useInfiniteScroll } from "@semoss/ui/next";

export interface WorkspaceChatListProps {
	/**
	 * List of chats associated with the workspace
	 */
	workspaceId: string;

	/**
	 * Search the chats by name
	 */
	search: string;
}

/**
 * Renders a card representing a workspace
 *
 * @component
 */
export const WorkspaceChatList = ({
	workspaceId,
	search,
}: WorkspaceChatListProps) => {
	// get the data
	const getWorkspaceRooms = useIteratorPixel<
		GetWorkspaceRoomsResponse,
		WorkspaceRoom
	>(
		(limit, offset) =>
			`GetWorkspaceRooms(workspaceId=["${workspaceId}"], ${search ? `filters=[Filter(room_name ?like "${search}")],` : ""} limit=[${limit}], offset=[${offset}]);`,
		(response) => response.total_count,
		(response) => response.rooms,
		[workspaceId, search],
		{ limit: 25 },
	);

	// Attach infinite scroll
	const scrollRef = useInfiniteScroll({
		onLoadMore: () => {
			if (getWorkspaceRooms.isLoading) {
				return;
			}

			if (!getWorkspaceRooms.hasMore) {
				return;
			}
			// get more
			getWorkspaceRooms.loadMore();
		},
	});

	// initial loading
	if (
		getWorkspaceRooms.status === "LOADING" &&
		getWorkspaceRooms.data.length === 0
	) {
		return (
			<div className="flex h-full w-full items-center justify-center px-2 py-4">
				<Spinner />
			</div>
		);
	}

	if (getWorkspaceRooms.status === "ERROR") {
		<div className="px-2 py-4 text-center text-destructive text-sm">
			Error: ${getWorkspaceRooms.error?.message}
		</div>;
	}

	if (
		getWorkspaceRooms.status === "SUCCESS" &&
		getWorkspaceRooms.data.length === 0
	) {
		return (
			<div className="px-2 py-4 text-center text-muted-foreground text-sm">
				No chats
			</div>
		);
	}

	return (
		<ScrollArea className="h-full w-full" viewportRef={scrollRef}>
			<div className="flex flex-col gap-2 p-4">
				{getWorkspaceRooms.data.map((r) => (
					<Link
						key={r.room_id}
						to={`/room/${r.room_id}`}
						aria-label={"Select room"}
						className="flex flex-row justify-between rounded-lg border border-border bg-card px-3 py-4"
					>
						<div
							className="max-w-3/4 truncate font-semibold text-foreground text-sm leading-normal"
							title={r.room_name}
						>
							{r.room_name}
						</div>
						<div className="font-normal text-muted-foreground text-xs leading-normal">
							{r.date_updated}
						</div>
					</Link>
				))}

				{/* Loading more indicator */}
				{getWorkspaceRooms.status === "LOADING" &&
					getWorkspaceRooms.data.length > 0 && (
						<div className="flex items-center justify-center p-4">
							<Spinner className="size-4" />
						</div>
					)}
			</div>
		</ScrollArea>
	);
};
