import { BracesIcon, HammerIcon, PanelBottomIcon } from "lucide-react";
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
import { useRoom } from "../../room/scope/room.context";
import { useRoomSelector } from "../../room/store/use-room-selector";
import { ToolInspector } from "../../tools/inspector/tool-inspector";
import { ToolsView } from "../../tools/views/tools-view";

/** Which tool a panel is showing. `toolId` is what dedupes it. */
interface RoomToolParams {
	/** The tool call's id. */
	toolId: string;
	/** The app that runs the call; empty for a server tool. */
	app: string;
	/** The id of the message that made the call. */
	message: string;
	/** Show the call's details (its info, inputs and output) in place of its view. */
	showsDetails?: boolean;
}

/**
 * The tool tab's controls: switch between the tool's view and the call's
 * details, and move the tool out of the Workspace and into the conversation.
 *
 * The one piece of the Workspace's tab chrome that is genuinely per-panel: it acts on the tool the front tab is showing, so it registers as
 * that panel's control rather than sitting beside the container-level actions.
 * A server tool's view already is its details, so it has no switch.
 */
const RoomToolControls = ({ id }: WorkbenchPanelProps) => {
	const { config, setConfig } = useWorkbenchPanel<RoomToolParams>(id);
	const { t } = useTranslation("sidebar");
	const room = useRoom();
	const toolId = config?.toolId;
	const tool = useRoomSelector(room, (current) =>
		toolId ? current.getTool(toolId) : null,
	);

	if (!tool) {
		return null;
	}

	const showsDetails = config.showsDetails === true;

	return (
		<>
			{!tool.json.server_tool && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							className={WORKBENCH_STYLES.chromeButton}
							aria-label={t("actions.showDetails")}
							aria-pressed={showsDetails}
							onClick={(event) => {
								// keep the click from selecting the tab it sits on
								event.stopPropagation();
								setConfig({ showsDetails: !showsDetails });
							}}
						>
							<BracesIcon
								aria-hidden
								className={WORKBENCH_STYLES.chromeIcon}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>{t("actions.showDetails")}</TooltipContent>
				</Tooltip>
			)}
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
		</>
	);
};

/**
 * One tool call, drawn by `ToolsView` or, with Show Details on, by
 * `ToolInspector`, with its controls registered on the panel's tab.
 */
const RoomToolPanel = ({ id }: WorkbenchPanelProps) => {
	const { config } = useWorkbenchPanel<RoomToolParams>(id);

	const room = useRoom();
	const { t } = useTranslation("tool");
	const toolId = config?.toolId;
	const tool = useRoomSelector(room, (current) =>
		toolId ? current.getTool(toolId) : null,
	);

	useWorkbenchControl(id, RoomToolControls);

	// `app` is empty for server tools (provider-executed) -- ToolsView
	// handles the routing internally.
	if (!config?.message || !config?.toolId) {
		return <div>{t("view.noTool")}</div>;
	}

	if (config.showsDetails && tool && !tool.json.server_tool) {
		return <ToolInspector tool={tool} />;
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
