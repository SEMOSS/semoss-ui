/** Props for {@link TeamsViewLabel}. */
interface TeamsViewLabelProps {
	/** What the view lists. */
	label: string;
}

/**
 * Names what a Teams view lists at the start of its toolbar row, so posts,
 * files, and chats read apart even though they share the Teams logo.
 */
export const TeamsViewLabel = ({ label }: TeamsViewLabelProps) => (
	<span className="shrink-0 font-medium text-sm">{label}</span>
);
