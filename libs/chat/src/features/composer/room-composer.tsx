import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { toast } from "@semoss/ui/next";
import { useChatSession } from "../chat/use-chat-session";
import { readRoomTurnState } from "../conversation/room-turn-state";
import type { RoomStore } from "../room/room.store";
import { RoomInput } from "./room-input";

interface RoomComposerProps {
	/** The room the composer sends to. */
	room: RoomStore;
}

/** A room's composer: sends, stops, and compacts the room's turns. */
export const RoomComposer = observer(({ room }: RoomComposerProps) => {
	const { chat } = useChatSession();
	const { t } = useTranslation("room");
	const { isBusy, sendState } = readRoomTurnState(room);

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

	const handleCompactMessages = async (
		strategy?: "TOOL_PRUNE" | "SUMMARY" | "AUTO",
	) => {
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
					predefinedPrompts={room.options.predefinedPrompts}
					className="max-h-72 min-h-24"
					isLoading={isBusy}
					model={room.model}
					room={room}
					setModel={(model) => {
						room.setModel(model);
						chat.setSelectedModel(model);
					}}
					options={room.options}
					onMcpChange={(mcp) =>
						room.setOptions({
							...room.options,
							mcp,
						})
					}
					onPrompt={handlePrompt}
					hasOutstandingTools={
						room.latestResponseMessage.hasUnfinishedTools
					}
					sendState={sendState}
					onStop={room.cancelActiveJob}
					onCompact={handleCompactMessages}
					excludeCommandIds={[
						// A room's mode is fixed at creation — never let an
						// existing room switch into agent-harness mid-chat.
						"agent-harness",
					]}
				/>
			</div>
		</div>
	);
});
