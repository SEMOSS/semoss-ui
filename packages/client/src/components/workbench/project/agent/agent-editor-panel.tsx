import { BotIcon } from "lucide-react";
import { AgentEditor } from "@/components/agent-workspace/agent-editor";
import type { WorkbenchPanelConfig } from "@/stores/workbench";

/**
 * The agent configuration form for a WORKSPACE project. `AgentEditor` owns its
 * own data loading and Save toolbar, so this is just the panel shell.
 */
export const AgentEditorPanel: React.FC = () => {
	return (
		<div className="h-full w-full overflow-auto">
			<AgentEditor />
		</div>
	);
};

/**
 * Blueprint for the agent editor. keepAlive: unsaved form edits survive tab
 * switches.
 */
export const PROJECT_AGENT_EDITOR_PANEL: WorkbenchPanelConfig = {
	name: "Agent",
	helpText: "Agent Editor",
	icon: ({ className }) => <BotIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: AgentEditorPanel,
};
