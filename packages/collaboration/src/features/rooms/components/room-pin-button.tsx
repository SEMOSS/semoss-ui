import { Pin, PinOff } from "lucide-react";
import { useContext, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { RoomTreeContext } from "@/features/room-tree/room-tree.context";
import { ROOM_HISTORY_CHANGED } from "../api/list-rooms";
import { pinRoom } from "../api/pin-room";

interface RoomPinButtonProps {
	/** Exact saved conversation to pin or unpin. */
	roomId: string;
	/** Name included in the control's accessible label. */
	roomName: string;
	/** Verified history-row state while sidebar pins are loading. */
	pinned?: boolean;
}

/** A confirmed server write updates every pin control and sidebar together. */
export function RoomPinButton({
	roomId,
	roomName,
	pinned,
}: RoomPinButtonProps) {
	const { actions, insightId } = useInsight();
	const tree = useContext(RoomTreeContext);
	const [isSaving, setIsSaving] = useState(false);
	const saving = useRef(false);
	const isPinned = tree?.pinnedRoomIds
		? tree.pinnedRoomIds.includes(roomId)
		: pinned;
	const isUnknown = isPinned === undefined;
	const label = isUnknown
		? tree?.error
			? "Retry room pin status"
			: "Loading room pin status"
		: `${isPinned ? "Unpin" : "Pin"} room: ${roomName || "Untitled chat"}`;
	async function handlePin(): Promise<void> {
		if (isUnknown) {
			tree?.retry();
			return;
		}
		if (saving.current) return;
		saving.current = true;
		setIsSaving(true);
		try {
			await pinRoom(actions, roomId, !isPinned);
			window.dispatchEvent(
				new CustomEvent(ROOM_HISTORY_CHANGED, {
					detail: {
						scope: insightId,
						roomId,
						roomName,
						pinned: !isPinned,
					},
				}),
			);
		} catch (cause) {
			toast.error(
				cause instanceof Error
					? cause.message
					: "The room pin could not be saved. Try again.",
			);
		} finally {
			saving.current = false;
			setIsSaving(false);
		}
	}
	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 shrink-0 text-muted-foreground"
					aria-label={label}
					aria-pressed={isPinned}
					aria-busy={isSaving}
					disabled={isSaving || (isUnknown && !tree?.error)}
					onClick={() => void handlePin()}
				>
					{isPinned ? (
						<PinOff aria-hidden="true" />
					) : (
						<Pin aria-hidden="true" />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{isSaving ? "Saving room pin…" : label}
			</TooltipContent>
		</Tooltip>
	);
}
