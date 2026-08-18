import { AgentEditor } from "@/components/agent-workspace/agent-editor";

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
