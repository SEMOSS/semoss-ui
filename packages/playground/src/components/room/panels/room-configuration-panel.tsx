import { Settings2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useContext, useEffect, useRef } from "react";
import { ScrollArea } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useRoom } from "@/contexts/room.context";
import { RoomToolboxSection } from "@/features/chat-tools/components/room-toolbox-section";
import { DraftSettingsContext } from "@/features/workbench/draft-settings.context";
import { useChat } from "@/hooks/use-chat";
import { RoomOptionsForm } from "../room-options-form";

/**
 * The room's settings: its model, instructions, knowledge, and every tool the
 * assistant has. A new chat's draft settings replace the room's, and leave out
 * the room's own toolbox, which is not settled until the first message.
 */
const RoomConfigurationPanel = observer(() => {
	const room = useRoom();
	const { chat } = useChat();
	const draftSettings = useContext(DraftSettingsContext);
	const toolsHeadingRef = useRef<HTMLHeadingElement>(null);
	const pendingSection = room.chatTools.pendingSettingsSection;

	// Opening Tools brings them into view, whether or not Settings was open.
	useEffect(() => {
		if (pendingSection !== "tools") return;
		room.chatTools.takeSettingsSection();
		const heading = toolsHeadingRef.current;
		heading?.scrollIntoView({ block: "start" });
		heading?.focus({ preventScroll: true });
	}, [pendingSection, room.chatTools]);

	return (
		<ScrollArea className="h-full w-full">
			<RoomOptionsForm
				disabled={
					room.isLoading ||
					room.latestResponseMessage?.isThinking ||
					room.latestResponseMessage?.hasUnfinishedTools
				}
				model={room.model}
				options={room.options}
				isAgentMode={room.mode === "agent"}
				onModelChange={(model) => {
					if (model) {
						room.setModel(model);
						chat.setSelectedModel(model);
					}
				}}
				onOptionsChange={(options) => {
					if (options) {
						room.setOptions(options);
					}
				}}
				toolbox={
					draftSettings ? undefined : (
						<RoomToolboxSection room={room} />
					)
				}
				toolsHeadingRef={toolsHeadingRef}
				{...draftSettings}
			/>
		</ScrollArea>
	);
});

/** The room's model, options, and tools. One per sidebar. */
export const ROOM_CONFIGURATION_PANEL: WorkbenchPanelConfig = {
	name: "Settings",
	icon: ({ className }) => <Settings2Icon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomConfigurationPanel,
};
