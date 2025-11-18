import { Link } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import { ScrollArea, Spinner } from "@semoss/ui/next";

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
	const limit = 25;
	const offset = 0;

	// get the data
	const getWorkspaceRooms = usePixel<{
		rooms: {
			room_id: string;
			workspace_id: string;
			room_name: string;
			date_updated: string;
			date_created: string;
			room_context: string;
		}[];
		total_count: number;
	}>(
		`GetWorkspaceRooms(workspaceId=["${workspaceId}"], ${search ? `filter=[Filter(room_name ?like "${search}")],` : ""} limit=[${limit}], offset=[${offset}]);`,
		{
			data: {
				rooms: [],
				total_count: -1,
			},
		},
	);

	console.log(getWorkspaceRooms);

	if (getWorkspaceRooms.status === "LOADING") {
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
		getWorkspaceRooms.data.rooms.length === 0
	) {
		return (
			<div className="px-2 py-4 text-center text-muted-foreground text-sm">
				No chats
			</div>
		);
	}

	return (
		<ScrollArea className="h-full w-full">
			<div className="flex flex-col gap-2 p-4">
				{getWorkspaceRooms.data.rooms.map((r) => (
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
			</div>
		</ScrollArea>
	);
};
