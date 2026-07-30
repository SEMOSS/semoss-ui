export interface AutomationToolContext {
	/** MCP tool call id */
	id: string;
	/** Tool name (e.g. TriggerAutomation) */
	name: string;
	/** Chat message id the tool call is attached to */
	message: string;
	/** Playground room id, when opened from a chat room */
	roomId: string;
	/** App/project id the tool operates on, resolved from _meta or arguments */
	projectId: string;
	/** Arguments the tool call was invoked with */
	parameters: Record<string, unknown>;
	/** Tool result output, once the MCP execution has completed */
	toolResponse?: unknown;
}
