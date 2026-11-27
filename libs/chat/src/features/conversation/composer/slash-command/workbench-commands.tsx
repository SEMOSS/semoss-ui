import { PanelRightCloseIcon } from "lucide-react";
import { useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import { useRoomSelector } from "../../../room/store/use-room-selector";
import { useWorkbenchPanels } from "../../../workbench/rail/use-workbench-panels";
import { WorkbenchPanelIcon } from "../../../workbench/rail/workbench-panel-icon";
import { ComposerWorkbenchContext } from "../composer.context";
import { SlashCommand } from "./slash-command";

/** Other words a Workspace panel's command is found by, such as old names. */
const PANEL_KEYWORDS: Readonly<Record<string, string[]>> = {
	settings: [
		"room-options",
		"options",
		"model",
		"instructions",
		"tools",
		"default tools",
	],
};

/**
 * The "/" menu's Workspace group: each panel the rail opens that can open
 * now, then Close Workspace while it is open. A panel shares its name with
 * the rail, so its command is found by the name it has there.
 */
export const WorkbenchCommands = () => {
	const { t } = useTranslation("room");
	const workbench = useContext(ComposerWorkbenchContext);
	if (!workbench) {
		throw new Error("WorkbenchCommands must be used inside the composer");
	}
	const panels = useWorkbenchPanels(workbench.room, workbench.draftPanels);
	const isOpen = useRoomSelector(
		workbench.room,
		(current) => current.workbenchPane.isOpen,
	);

	return (
		<>
			{panels.map((panel) =>
				// a panel waiting on a new chat's preparation cannot open yet
				panel.isDisabled ? null : (
					<SlashCommand
						key={panel.id}
						name={panel.id}
						group="workbench"
						label={panel.label}
						description={
							panel.kind === "connector"
								? t("slash.openPlace", { name: panel.label })
								: panel.description
						}
						keywords={PANEL_KEYWORDS[panel.id]}
						icon={<WorkbenchPanelIcon panel={panel} />}
						onSelect={panel.onOpen}
					/>
				),
			)}
			{isOpen && (
				<SlashCommand
					name="close-workspace"
					group="workbench"
					label={t("workbench.closeWorkspace")}
					description={t(
						"slash.commands.close-workspace.description",
					)}
					icon={<PanelRightCloseIcon className="rtl:-scale-x-100" />}
					onSelect={() => workbench.room.closeWorkbench()}
				/>
			)}
		</>
	);
};
