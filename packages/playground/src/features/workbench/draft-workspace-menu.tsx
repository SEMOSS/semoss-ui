import { useTranslation } from "@semoss/i18n";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import {
	WorkspaceMenuItems,
	type WorkspaceMenuItemsProps,
} from "./workspace-menu-items";

/** File actions before a new chat needs a full dock. */
export function DraftWorkspaceMenu(props: WorkspaceMenuItemsProps) {
	const { t } = useTranslation("sidebar");
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="text-xs max-md:min-h-11 max-md:min-w-11"
				>
					{t("workbench.file")}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<WorkspaceMenuItems {...props} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
