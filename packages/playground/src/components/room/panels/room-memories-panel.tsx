import { Brain, RefreshCw, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Skeleton, toast } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useRoom } from "@/contexts";

interface Memory {
	memory_id: string;
	event_type: string;
	content: string;
	date_created: string;
}

interface ListMemoriesResult {
	memories: Memory[];
	total_count: number;
	has_more: boolean;
}

/**
 * Memories captured in this room, shown in the room's right-hand side panel.
 * Scope is locked to the room's id (mirrors RoomAuditLogPanel's locked scope) -
 * account-wide memory management lives in Settings instead.
 */
const RoomMemoriesPanel = observer(() => {
	const room = useRoom();
	const roomId = room.roomId;

	const [memories, setMemories] = useState<Memory[]>([]);
	const [loading, setLoading] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchMemories = useCallback(async () => {
		if (!roomId) {
			setMemories([]);
			return;
		}
		setLoading(true);
		try {
			const response = await room.runRoomPixel<[ListMemoriesResult]>(
				`ListMemories(roomId=${JSON.stringify(roomId)}, limit=50, offset=0);`,
				false,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(`API Error: ${output}`);
			}
			const result = output as unknown as ListMemoriesResult;
			setMemories(result?.memories ?? []);
		} catch (error) {
			setMemories([]);
			toast.error(`Error fetching memories: ${error}`);
		} finally {
			setLoading(false);
		}
	}, [room, roomId]);

	useEffect(() => {
		fetchMemories();
	}, [fetchMemories]);

	const handleDelete = async (memoryId: string) => {
		setDeletingId(memoryId);
		try {
			const response = await room.runRoomPixel<[boolean]>(
				`DeleteMemory(memoryId=${JSON.stringify(memoryId)});`,
				false,
			);
			const { operationType, output } = response.pixelReturn[0];
			if (operationType.indexOf("ERROR") > -1) {
				throw new Error(`API Error: ${output}`);
			}
			setMemories((prev) => prev.filter((m) => m.memory_id !== memoryId));
			toast.success("Memory deleted");
		} catch (error) {
			toast.error(`Error deleting memory: ${error}`);
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="flex h-full w-full flex-col gap-3 overflow-auto p-4">
			<div className="flex items-center justify-between">
				<p className="text-muted-foreground text-sm">
					Memories captured from this conversation.
				</p>
				<Button
					variant="outline"
					size="icon-sm"
					title="Refresh"
					onClick={fetchMemories}
				>
					<RefreshCw className="size-4" />
				</Button>
			</div>
			{loading ? (
				<div className="flex flex-col gap-2">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
			) : memories.length === 0 ? (
				<p className="py-8 text-center text-muted-foreground text-sm">
					No memories captured in this room yet.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{memories.map((memory) => (
						<div
							key={memory.memory_id}
							className="flex items-start justify-between gap-2 rounded-md border p-3"
						>
							<div className="flex flex-col gap-1">
								<Badge
									variant="outline"
									className="w-fit font-normal"
								>
									{memory.event_type}
								</Badge>
								<p className="text-sm">{memory.content}</p>
								<span className="text-muted-foreground text-xs">
									{memory.date_created}
								</span>
							</div>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={`Delete memory: ${memory.content.slice(0, 40)}`}
								disabled={deletingId === memory.memory_id}
								onClick={() => handleDelete(memory.memory_id)}
							>
								<Trash2 className="size-4" />
							</Button>
						</div>
					))}
				</div>
			)}
		</div>
	);
});

/** The room's captured memories. One per sidebar. */
export const ROOM_MEMORIES_PANEL: WorkbenchPanelConfig = {
	name: "Memories",
	icon: ({ className }) => <Brain className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomMemoriesPanel,
};
