import { BracesIcon, HammerIcon, PanelBottomIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type { FC } from "react";
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
import { ToolsView } from "@/components";
import { useRoom } from "@/contexts";
import { ToolInspector } from "@/features/tool-inspector/tool-inspector";

/** Which tool a panel is showing. `toolId` is what dedupes it. */
interface RoomToolParams {
	toolId: string;
	app: string;
	message: string;
	/** Show the call's details (its info, inputs and output) in place of its view. */
	showsDetails?: boolean;
}

/**
 * The tool tab's controls: switch between the tool's view and the call's
 * details, and move the tool out of the sidebar and into the conversation.
 *
 * The one piece of the old sidebar's tab-bar chrome that is genuinely
 * per-panel: it acts on the tool the front tab is showing, so it registers as
 * that panel's control rather than sitting beside the container-level actions.
 * A server tool's view already is its details, so it has no switch.
 */
const RoomToolControls: FC<WorkbenchPanelProps> = observer(({ id }) => {
	const { config, setConfig } = useWorkbenchPanel<RoomToolParams>(id);
	const { t } = useTranslation("sidebar");
	const room = useRoom();
	const tool = config?.toolId ? room.getTool(config.toolId) : null;

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
							onClick={(e) => {
								e.stopPropagation();
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
		</>
	);
});

const RoomToolPanel = observer(({ id }: WorkbenchPanelProps) => {
	const { config } = useWorkbenchPanel<RoomToolParams>(id);

	const room = useRoom();

	useWorkbenchControl(id, RoomToolControls);

	// `app` is empty for server tools (provider-executed) -- ToolsView
	// handles the routing internally.
	if (!config?.message || !config?.toolId) {
		return <div>No Tool</div>;
	}

	const tool = room.getTool(config.toolId);
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
});

/** One tool, opened into the room sidebar. */
export const ROOM_TOOL_PANEL: WorkbenchPanelConfig<RoomToolParams> = {
	name: "Tool",
	icon: ({ className }) => <HammerIcon className={className} />,
	canRename: false,
	mount: "keepAlive",
	matches: (a, b) => a.toolId === b.toolId,
	content: RoomToolPanel,
};
