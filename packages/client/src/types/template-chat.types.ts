/** Agent selected for a template chat handoff. */
export interface TemplateChatAgent {
	/** Workspace project ID used by the assistant harness. */
	workspace_id: string;
	/** Agent display name. */
	name: string;
}

/** Router state passed from the template catalog to a cloned CODE project. */
export interface TemplateChatHandoffState {
	/** Prompt to submit once the cloned workbench is ready. */
	prompt: string;
	/** Agent that should run the prompt. */
	agent: TemplateChatAgent;
}

/**
 * Narrow unknown router state to a valid template-chat handoff.
 * @param value - Router state supplied by React Router.
 * @return Whether the value contains a complete handoff payload.
 */
export const isTemplateChatHandoffState = (
	value: unknown,
): value is TemplateChatHandoffState => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Partial<TemplateChatHandoffState>;
	return (
		typeof candidate.prompt === "string" &&
		candidate.prompt.trim().length > 0 &&
		Boolean(candidate.agent) &&
		typeof candidate.agent?.workspace_id === "string" &&
		candidate.agent.workspace_id.length > 0 &&
		typeof candidate.agent.name === "string" &&
		candidate.agent.name.length > 0
	);
};
