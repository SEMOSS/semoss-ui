/** Stable room control for focus return after the workbench opens automatically. */
export function roomWorkbenchTriggerId(conversationId: string): string {
	return `collaboration-room-${encodeURIComponent(conversationId)}-workbench-trigger`;
}
