import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import { useRoomOrContext } from "../../room/scope/room.context";
import type { RoomStore } from "../../room/store/room.store";
import type { CompactionStrategy } from "../../room/store/room-compaction";
import { useRoomSelector } from "../../room/store/use-room-selector";
import { readRoomTurnState } from "../messages/room-turn-state";
import { RoomInput } from "./room-input";
import { useComposerSession } from "./use-composer-session";

/** Props for {@link RoomComposer}. */
interface RoomComposerProps {
	/** The room the composer sends to; defaults to the room in context. */
	room?: RoomStore;
}

/** A room's composer: sends, stops, and compacts the room's turns. */
export const RoomComposer = ({ room: roomProp }: RoomComposerProps) => {
	const room = useRoomOrContext(roomProp);
	const { t } = useTranslation("room");
	const session = useComposerSession(room);
	const { isBusy, sendState } = useRoomSelector(room, readRoomTurnState);
	const hasOutstandingTools = useRoomSelector(
		room,
		(current) => current.latestResponseMessage?.hasUnfinishedTools ?? false,
	);

	/**
	 * Send a message to the room.
	 *
	 * @param prompt - The message's text.
	 * @param files - The files to upload with it.
	 * @returns True once it was sent; a failed send throws instead.
	 */
	const handlePrompt = async (prompt: string, files: File[]) => {
		// ask the room, which saves its options first — let errors propagate
		// so room-input can restore files
		await room.askMessage(prompt, files);

		// An agent run can change the room's tools on the server and only
		// resolves once the run is over, so re-sync the options then,
		// preserving workspace MCPs that are only held in memory. A chat turn
		// re-syncs when its last tool result is saved instead. Skipped when the
		// turn just errored (e.g. a cancel that failed to persist) — a
		// successful sync clears the room's error state, which would otherwise
		// wipe the message the user just needs to see.
		if (room.mode === "agent" && !room.error) {
			await room.syncRoomOptions();
		}

		return true;
	};

	/**
	 * Compact the conversation and toast the outcome.
	 *
	 * @param strategy - How to compact; the room's default when absent.
	 */
	const handleCompactMessages = async (strategy?: CompactionStrategy) => {
		try {
			const result = await room.compactMessages(strategy);
			if (result === "skipped") {
				toast.info(t("settings.compactSkipped"));
			} else {
				toast.success(t("settings.compactSuccess"));
			}
		} catch {
			toast.error(t("settings.compactError"));
		}
	};

	return (
		<div className="flex w-full shrink-0 flex-col @md:px-6 px-4 py-4">
			<div className="mx-auto flex w-full max-w-3xl flex-col">
				<RoomInput
					className="max-h-72 min-h-24"
					isLoading={isBusy}
					session={session}
					room={room}
					onPrompt={handlePrompt}
					sendState={sendState}
					variant={{
						kind: "room",
						onStop: room.cancelActiveJob,
						onCompact: handleCompactMessages,
						hasOutstandingTools,
					}}
					excludeCommandIds={[
						// A room's mode is fixed at creation — never let an
						// existing room switch into agent-harness mid-chat.
						"agent-harness",
					]}
				/>
			</div>
		</div>
	);
};
