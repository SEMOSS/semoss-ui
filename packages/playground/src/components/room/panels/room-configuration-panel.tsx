import { Settings2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { createContext, type ReactNode, useContext } from "react";
import { ScrollArea } from "@semoss/ui/next";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useRoom } from "@/contexts";
import { useChat } from "@/hooks";
import {
	RoomOptionsForm,
	type RoomOptionsFormProps,
} from "../room-options-form";

/**
 * The settings a host has the configuration panel edit in place of its
 * room's own, or null for the room's.
 */
const RoomSettingsFormContext = createContext<RoomOptionsFormProps | null>(
	null,
);

/** Props for {@link RoomSettingsFormProvider}. */
export interface RoomSettingsFormProviderProps {
	/** The form's settings and handlers. */
	value: RoomOptionsFormProps;
	children: ReactNode;
}

/**
 * Have the configuration panels below edit other settings than their room's
 * own. The new-chat page shows its draft's settings this way in the sidebar of
 * the room it created early for Chat Files, since that room only takes the
 * draft's options when the first message is sent.
 */
export const RoomSettingsFormProvider = ({
	value,
	children,
}: RoomSettingsFormProviderProps) => (
	<RoomSettingsFormContext.Provider value={value}>
		{children}
	</RoomSettingsFormContext.Provider>
);

const RoomConfigurationPanel = observer(() => {
	const room = useRoom();
	const { chat } = useChat();
	const hostForm = useContext(RoomSettingsFormContext);

	return (
		<ScrollArea className="h-full w-full">
			{hostForm ? (
				<RoomOptionsForm {...hostForm} />
			) : (
				<RoomOptionsForm
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
				/>
			)}
		</ScrollArea>
	);
});

/** The room's model and options form. One per sidebar. */
export const ROOM_CONFIGURATION_PANEL: WorkbenchPanelConfig = {
	name: "Configuration",
	icon: ({ className }) => <Settings2Icon className={className} />,
	canRename: false,
	mount: "keepAlive",
	content: RoomConfigurationPanel,
};
