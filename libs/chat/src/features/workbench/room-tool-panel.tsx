import { HammerIcon, PanelBottomIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import {
	useWorkbenchControl,
	useWorkbenchPanel,
	WORKBENCH_STYLES,
} from "@semoss/workbench";
import { ToolsView } from "../mcp/tools-view";
import { useRoom } from "../room/room.context";
import { useRoomSelector } from "../room/use-room-selector";

/** Which tool a panel is showing. `toolId` is what dedupes it. */
interface RoomToolParams {
	/** The tool call's id. */
	toolId: string;
	/** The app that runs the call; empty for a server tool. */
	app: string;
	/** The id of the message that made the call. */
	message: string;
}

/**
 * Moves this tool out of the Workspace and into the conversation.
 *
 * The one piece of the Workspace's tab chrome that is genuinely per-panel: it acts on the tool the front tab is showing, so it registers as
 * that panel's control rather than sitting beside the container-level actions.
 */
const RoomToolInlineControl = ({ id }: WorkbenchPanelProps) => {
	const { config } = useWorkbenchPanel<RoomToolParams>(id);
	const { t } = useTranslation("sidebar");
	const room = useRoom();
	const toolId = config?.toolId;
	const tool = useRoomSelector(room, (current) =>
		toolId ? current.getTool(toolId) : null,
	);

	if (!tool) {
		return null;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					className={WORKBENCH_STYLES.chromeButton}
					aria-label={t("actions.openInline")}
					onClick={(event) => {
						// keep the click from selecting the tab it sits on
						event.stopPropagation();
						tool.openTool("inline");
					}}
				>
					<PanelBottomIcon
						aria-hidden
						className={WORKBENCH_STYLES.chromeIcon}
					/>
				</Button>
			</TooltipTrigger>
			<TooltipContent>{t("actions.openInline")}</TooltipContent>
		</Tooltip>
	);
};

/**
 * One tool call, drawn by `ToolsView`, with its "open inline" control
 * registered on the panel's tab.
 */
const RoomToolPanel = ({ id }: WorkbenchPanelProps) => {
	const { config } = useWorkbenchPanel<RoomToolParams>(id);

	const room = useRoom();
	const { t } = useTranslation("tool");

	useWorkbenchControl(id, RoomToolInlineControl);

	// `app` is empty for server tools (provider-executed) -- ToolsView
	// handles the routing internally.
	if (!config?.message || !config?.toolId) {
		return <div>{t("view.noTool")}</div>;
	}

	return (
		<ToolsView
			room={room}
			app={config.app}
			message={config.message}
			toolId={config.toolId}
		/>
	);
};

/** One tool call, opened into the room's Workspace; one tab per call. */
export const ROOM_TOOL_PANEL: WorkbenchPanelConfig<RoomToolParams> = {
	name: "Tool",
	icon: ({ className }) => <HammerIcon className={className} />,
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.toolId === b.toolId,
	content: RoomToolPanel,
};
