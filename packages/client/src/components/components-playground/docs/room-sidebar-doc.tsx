import { useState } from "react";
import { RoomSidebar } from "@semoss/chat/components";
import { DemoSection } from "../demo-section";
import { DocPage } from "../doc-page";
import { SAMPLE_ROOMS } from "../fixtures";
import { type PropDoc, PropsTable } from "../props-table";

const PROPS: PropDoc[] = [
	{
		name: "pinnedRooms",
		type: "RoomSummary[]",
		required: true,
		description: "",
	},
	{
		name: "rooms",
		type: "RoomSummary[]",
		required: true,
		description: "Date-bucketed (Today/Yesterday/Previous 7 Days/…).",
	},
	{
		name: "activeRoomId",
		type: "string | null",
		required: true,
		description: "",
	},
	{ name: "search", type: "string", required: true, description: "" },
	{
		name: "onSearchChange",
		type: "(value: string) => void",
		required: true,
		description: "",
	},
	{ name: "isLoading", type: "boolean", description: "" },
	{ name: "isLoadingMore", type: "boolean", description: "" },
	{ name: "hasMore", type: "boolean", description: "" },
	{
		name: "onLoadMore",
		type: "() => void",
		required: true,
		description: "Infinite-scroll callback.",
	},
	{
		name: "onSelectRoom",
		type: "(roomId: string) => void",
		required: true,
		description: "",
	},
	{ name: "onNewChat", type: "() => void", required: true, description: "" },
	{
		name: "onRenameRoom",
		type: "(roomId: string, name: string) => void",
		required: true,
		description: "",
	},
	{
		name: "onPinRoom",
		type: "(roomId: string, pinned: boolean) => void",
		required: true,
		description: "",
	},
	{
		name: "onDeleteRoom",
		type: "(roomId: string) => void",
		required: true,
		description: "",
	},
	{ name: "className", type: "string", description: "" },
];

export const RoomSidebarDoc = () => {
	const [rooms, setRooms] = useState(SAMPLE_ROOMS);
	const [activeRoomId, setActiveRoomId] = useState<string | null>("r1");
	const [search, setSearch] = useState("");

	const pinnedRooms = rooms.filter((r) => r.pinned);
	const unpinnedRooms = rooms.filter((r) => !r.pinned);

	return (
		<DocPage
			title="RoomSidebar"
			description="A date-bucketed room list with rename/pin/delete and infinite scroll — pure props, pairs with useChatRooms()."
		>
			<DemoSection
				preview={
					<div className="h-96 w-72 overflow-hidden rounded-md border border-border">
						<RoomSidebar
							pinnedRooms={pinnedRooms}
							rooms={unpinnedRooms}
							activeRoomId={activeRoomId}
							search={search}
							onSearchChange={setSearch}
							onLoadMore={() => {}}
							onSelectRoom={setActiveRoomId}
							onNewChat={() => setActiveRoomId(null)}
							onRenameRoom={(roomId, name) =>
								setRooms((prev) =>
									prev.map((r) =>
										r.roomId === roomId
											? { ...r, name }
											: r,
									),
								)
							}
							onPinRoom={(roomId, pinned) =>
								setRooms((prev) =>
									prev.map((r) =>
										r.roomId === roomId
											? { ...r, pinned }
											: r,
									),
								)
							}
							onDeleteRoom={(roomId) =>
								setRooms((prev) =>
									prev.filter((r) => r.roomId !== roomId),
								)
							}
						/>
					</div>
				}
				code={`import { RoomSidebar } from "@semoss/chat/components";
import { useChatRooms } from "@semoss/chat";

const roomsList = useChatRooms();

<RoomSidebar
  pinnedRooms={roomsList.pinnedRooms}
  rooms={roomsList.rooms}
  activeRoomId={activeRoomId}
  search={roomsList.search}
  onSearchChange={roomsList.setSearch}
  isLoading={roomsList.isLoading}
  hasMore={roomsList.hasMore}
  onLoadMore={roomsList.loadMore}
  onSelectRoom={setActiveRoomId}
  onNewChat={() => setActiveRoomId(null)}
  onRenameRoom={roomsList.renameRoom}
  onPinRoom={roomsList.pinRoom}
  onDeleteRoom={roomsList.deleteRoom}
/>`}
			/>
			<PropsTable props={PROPS} />
		</DocPage>
	);
};
