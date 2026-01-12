import { Link } from "react-router-dom";
import { useIteratorPixel } from "@semoss/sdk/react";
import { Muted, ScrollArea, Spinner, useInfiniteScroll } from "@semoss/ui/next";

interface WorkspaceChatListProps {
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
		{
			total_count: number;
			rooms: {
				room_id: string;
				room_name: string;
				date_updated: string;
			}[];
		},
		{
			room_id: string;
			room_name: string;
			date_updated: string;
		}
	>(
		(limit, offset) =>
			`GetWorkspaceRooms(workspaceId=["${workspaceId}"], ${search ? `filters=[Filter(room_name ?like "${search}")],` : ""} limit=[${limit}], offset=[${offset}]);`,
		(response) => response.total_count,
		(response) => response.rooms,
		{
			limit: 25,
		},
		[search, workspaceId],
	);

	// Attach infinite scroll
	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaceRooms.isLoading || !getWorkspaceRooms.hasMore,
		onNext: () => {
			getWorkspaceRooms.next();
		},
	});

	// initial loading
	if (getWorkspaceRooms.isLoading && getWorkspaceRooms.data.length === 0) {
		return (
			<div className="flex h-full w-full items-center justify-center px-2 py-4">
				<Spinner />
			</div>
		);
	}

	if (getWorkspaceRooms.isError) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				Error: ${getWorkspaceRooms.error?.message}
			</div>
		);
	}

	if (getWorkspaceRooms.data.length === 0) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Muted>No chats found</Muted>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full w-full" viewportRef={(e) => setScroll(e)}>
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
				{getWorkspaceRooms.isLoading &&
					getWorkspaceRooms.data.length > 0 && (
						<div className="flex items-center justify-center p-4">
							<Spinner className="size-4" />
						</div>
					)}
			</div>
		</ScrollArea>
	);
};
