import { usePixel } from "@semoss/sdk/react";
import { AgentDefinition, type AgentWorkspace } from "@semoss/shared";
import { Spinner } from "@semoss/ui/next";
import { useProject } from "@/hooks";
import { CLIENT_AGENT_LINKS } from "@/utility";

export interface AgentDefinitionViewProps {
	/** The agent's `GetWorkspace` response. */
	workspace: AgentWorkspace;
	/** Extra classes for the root. */
	className?: string;
}

/** The shared read-only agent definition, with the client's catalog links. */
export const AgentDefinitionView = ({
	workspace,
	className,
}: AgentDefinitionViewProps) => (
	<AgentDefinition
		workspace={workspace}
		{...CLIENT_AGENT_LINKS}
		className={className}
	/>
);

/**
 * Read-only view of the current WORKSPACE project's agent configuration,
 * rendered inside the agent Overview tab (which owns scrolling).
 */
export const AgentViewer = () => {
	const { project } = useProject();
	const { data, status } = usePixel<AgentWorkspace>(
		`GetWorkspace(workspaceId=["${project.project_id}"]);`,
	);

	if (status !== "SUCCESS") {
		return (
			<div className="flex w-full items-center justify-center py-12">
				<Spinner />
			</div>
		);
	}

	return <AgentDefinitionView workspace={data} className="px-2 py-2" />;
};
