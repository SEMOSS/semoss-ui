export interface WorkspaceMembersListProps {
	/**
	 * WorkspaceId
	 */
	workspaceId: string;

	/**
	 * Search the members by name
	 */
	search: string;
}

export const WorkspaceMembersList = ({
	workspaceId,
}: WorkspaceMembersListProps) => {
	return <div>Workspace Members List for workspace {workspaceId}</div>;
};
