import { HammerIcon, PanelBottomIcon } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "@semoss/i18n";
import { useRoomSelector } from "@semoss/sdk/react";
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
import { ToolsView } from "../../../components/mcp/tools-view";
import { useRoom } from "../../../contexts/room.context";

/** Which tool a panel is showing. `toolId` is what dedupes it. */
export interface RoomToolParams {
	toolId: string;
	app: string;
	message: string;
}

/**
 * Move this tool out of the sidebar and into the conversation.
 *
 * The one piece of the old sidebar's tab-bar chrome that is genuinely
 * per-panel: it acts on the tool the front tab is showing, so it registers as
 * that panel's control rather than sitting beside the container-level actions.
 */
const RoomToolInlineControl: FC<WorkbenchPanelProps> = ({ id }) => {
	const { config } = useWorkbenchPanel<RoomToolParams>(id);
	const { t } = useTranslation("sidebar");
	const room = useRoom();
	const tool = useRoomSelector(room, (r) =>
		config?.toolId ? r.getTool(config.toolId) : null,
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
					onClick={(e) => {
						e.stopPropagation();
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

const RoomToolPanel = ({ id }: WorkbenchPanelProps) => {
	const { config } = useWorkbenchPanel<RoomToolParams>(id);

	const room = useRoom();

	useWorkbenchControl(id, RoomToolInlineControl);

	// `app` is empty for server tools (provider-executed) -- ToolsView
	// handles the routing internally.
	if (!config?.message || !config?.toolId) {
		return <div>No Tool</div>;
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

/** One tool, opened into the room sidebar. */
export const ROOM_TOOL_PANEL: WorkbenchPanelConfig<RoomToolParams> = {
	name: "Tool",
	icon: ({ className }) => <HammerIcon className={className} />,
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.toolId === b.toolId,
	content: RoomToolPanel,
};
