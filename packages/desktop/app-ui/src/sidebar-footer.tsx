import { SettingsIcon } from "lucide-react";

export const SidebarFooter = ({
	onOpenSettings,
}: {
	onOpenSettings: () => void;
}) => (
	<div className="border-border border-t p-2">
		<button
			type="button"
			onClick={onOpenSettings}
			className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-foreground text-sm hover:bg-accent"
		>
			<SettingsIcon className="size-4 text-muted-foreground" />
			Settings
		</button>
	</div>
);
