import { Trash2 } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

export interface PermissionDropdownProps {
	permission: string;
	handlePermissionChange: (newPermission: string) => void;
	activeUserPermission: string;
	hideDeleteOption?: boolean;
}

export const PermissionDropdown = ({
	permission,
	handlePermissionChange,
	activeUserPermission,
	hideDeleteOption = false,
}: PermissionDropdownProps) => {
	const disabled =
		activeUserPermission === "READ_ONLY" ||
		(permission === "OWNER" && activeUserPermission !== "OWNER");
	const hideOwnerOption = !disabled && activeUserPermission !== "OWNER";

	return (
		<Select
			value={permission}
			onValueChange={(newPermission) =>
				handlePermissionChange(newPermission)
			}
			// Disable if current user is read-only or trying to modify an owner without being an owner
			disabled={disabled}
		>
			<SelectTrigger size="sm">
				<SelectValue />
			</SelectTrigger>
			{/* Position checkmark on left side of menu items */}
			<SelectContent className="[&_span:first-child]:right-auto [&_span:first-child]:left-2">
				{/* Only owners can promote users to owner */}
				{!hideOwnerOption && (
					<SelectItem value="OWNER" className="pr-2 pl-8">
						Owner
					</SelectItem>
				)}
				<SelectItem value="EDIT" className="pr-2 pl-8">
					Editor
				</SelectItem>
				<SelectItem value="READ_ONLY" className="pr-2 pl-8">
					Read-only
				</SelectItem>
				{!hideDeleteOption && (
					<>
						<SelectSeparator />
						<SelectItem
							value="delete"
							className="pr-2 text-destructive focus:text-destructive"
						>
							<Trash2 className="size-4 text-destructive" />
							Remove access
						</SelectItem>
					</>
				)}
			</SelectContent>
		</Select>
	);
};
