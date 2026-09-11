import { BotIcon } from "lucide-react";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { RoomSubagent } from "../room-subagent";

/** Which subagent a panel is showing. */
export interface RoomSubagentParams {
	subagentId: string;
}

const RoomSubagentPanel = ({
	config,
}: WorkbenchPanelProps<RoomSubagentParams>) => (
	<RoomSubagent subagentId={config?.subagentId} />
);

/** One spawned subagent's status and result. */
export const ROOM_SUBAGENT_PANEL: WorkbenchPanelConfig<RoomSubagentParams> = {
	name: "Subagent",
	icon: ({ className }) => <BotIcon className={className} />,
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.subagentId === b.subagentId,
	content: RoomSubagentPanel,
};
