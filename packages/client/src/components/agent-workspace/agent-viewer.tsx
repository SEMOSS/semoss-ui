import { usePixel } from "@semoss/sdk/react";
import { AgentDefinition, type AgentWorkspace } from "@semoss/shared";
import { Markdown, Spinner } from "@semoss/ui/next";
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
 * Read-only view of the current WORKSPACE project: its About markdown, when it
 * has one, above its agent configuration, rendered inside the agent Overview
 * tab (which owns scrolling).
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

	const markdown = String(project.markdown || "");

	return (
		<div className="flex flex-col gap-6 px-2 py-2">
			{markdown.trim() ? (
				<Markdown
					className="w-full text-sm leading-relaxed"
					variant="document"
					data-testid="agentViewer-markdown"
				>
					{markdown}
				</Markdown>
			) : null}
			<AgentDefinitionView workspace={data} />
		</div>
	);
};
