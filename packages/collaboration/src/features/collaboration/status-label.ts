/** Map topic status value to display label */
export function statusLabel(status: string): string {
	const labels: Record<string, string> = {
		active: "Active",
		dormant: "Hibernate",
		archived: "Archived",
		suggested: "Suggested",
	};
	return labels[status] || status;
}
