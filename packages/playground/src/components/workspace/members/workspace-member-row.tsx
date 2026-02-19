import { Avatar, AvatarFallback } from "@semoss/ui/next";
import type { User } from "@/types";
import { toInitials } from "@/utility";
import { PermissionDropdown } from "./permission-dropdown";

export interface WorkspaceMemberRowProps {
	/**
	 * The member to display
	 */
	member: User;

	/**
	 * The ID of the current logged-in user (to show "You" label)
	 */
	currentUserId: string;

	/**
	 * The current user's permission level for the workspace
	 */
	activeUserPermission: string | null;

	/**
	 * Callback when the permission is changed
	 */
	onPermissionChange: (newPermission: string) => void;
}

/**
 * Displays a single workspace member row with their avatar, name, email, and permission controls.
 */
export const WorkspaceMemberRow = ({
	member,
	currentUserId,
	activeUserPermission,
	onPermissionChange,
}: WorkspaceMemberRowProps) => {
	return (
		<div className="flex items-center gap-3 rounded px-4 py-2 hover:bg-accent">
			<Avatar className="h-12 w-12 rounded-md">
				<AvatarFallback className="rounded-md bg-primary/10">
					{toInitials(member.name)}
				</AvatarFallback>
			</Avatar>
			<div className="flex flex-1 flex-col">
				<span className="font-medium text-sm">
					{member.name}{" "}
					{member.id === currentUserId && (
						<span className="ml-1 text-muted-foreground">
							(You)
						</span>
					)}
				</span>
				<span className="text-muted-foreground text-xs">
					{member.email}
				</span>
			</div>
			<PermissionDropdown
				permission={member.permission}
				handlePermissionChange={(newPermission) =>
					onPermissionChange(newPermission)
				}
				activeUserPermission={activeUserPermission}
			/>
		</div>
	);
};
