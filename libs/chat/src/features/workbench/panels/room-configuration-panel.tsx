import { Settings2Icon } from "lucide-react";
import { useContext } from "react";
import { useRoomSelector } from "@semoss/sdk/react";
import { ScrollArea } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useRoom } from "../../../contexts/room.context";
import { useChat } from "../../../host/chat.context";
import { DraftSettingsContext } from "../draft-settings.context";
import { RoomOptionsForm } from "./room-options-form";

/**
 * The room's settings: its model, instructions, knowledge, and every tool the
 * assistant has. A new chat's draft settings replace the room's, and leave out
 * the room's own toolbox, which is not settled until the first message.
 */
const RoomConfigurationPanel = () => {
	const room = useRoom();
	const { chat } = useChat();
	const draftSettings = useContext(DraftSettingsContext);
	const { isDisabled, model, options, isAgentMode } = useRoomSelector(
		room,
		(r) => ({
			isDisabled: Boolean(
				r.isLoading ||
					r.latestResponseMessage?.isThinking ||
					r.latestResponseMessage?.hasUnfinishedTools,
			),
			model: r.model,
			options: r.options,
			isAgentMode: r.mode === "agent",
		}),
	);
	return (
		<ScrollArea className="h-full w-full">
			<RoomOptionsForm
				disabled={isDisabled}
				model={model}
				options={options}
				isAgentMode={isAgentMode}
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
				integrationSections={
					draftSettings
						? undefined
						: room.integrations.map(({ id, SettingsSection }) =>
								SettingsSection ? (
									<SettingsSection key={id} room={room} />
								) : null,
							)
				}
				{...draftSettings}
			/>
		</ScrollArea>
	);
};

/** The room's model, options, and tools. One per sidebar. */
export const ROOM_CONFIGURATION_PANEL: WorkbenchPanelConfig = {
	name: "Settings",
	icon: ({ className }) => <Settings2Icon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomConfigurationPanel,
};
