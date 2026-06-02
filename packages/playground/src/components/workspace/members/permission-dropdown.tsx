import { Trash2 } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
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
	const { t } = useTranslation("workspace");

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
			<SelectContent className="[&_span:first-child]:start-2 [&_span:first-child]:end-auto">
				{/* Only owners can promote users to owner */}
				{!hideOwnerOption && (
					<SelectItem value="OWNER" className="ps-8 pe-2">
						{t("members.owner")}
					</SelectItem>
				)}
				<SelectItem value="EDIT" className="ps-8 pe-2">
					{t("members.editor")}
				</SelectItem>
				<SelectItem value="READ_ONLY" className="ps-8 pe-2">
					{t("members.readOnly")}
				</SelectItem>
				{!hideDeleteOption && (
					<>
						<SelectSeparator />
						<SelectItem
							value="delete"
							className="pe-2 text-destructive focus:text-destructive"
						>
							<Trash2 className="size-4 text-destructive" />
							{t("members.removeAccess")}
						</SelectItem>
					</>
				)}
			</SelectContent>
		</Select>
	);
};
