import { type FC, useMemo } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks";

/**
 * The shared context menu: one controlled DropdownMenu anchored to an
 * invisible trigger at the pointer coordinates stored by `openMenu`. Serves
 * every trigger surface (tabs, rail icons, border headers).
 */
export const WorkbenchContextMenu: FC = () => {
	const menu = useWorkbench((s) => s.layout.menu);
	const actions = useWorkbench((s) => s.layout.actions);

	const entries = useMemo(
		() => (menu ? actions.buildMenuEntries(menu.pid) : []),
		[menu, actions],
	);

	if (!menu || !entries.length) {
		return null;
	}

	return (
		<DropdownMenu
			open
			onOpenChange={(open) => {
				if (!open) {
					actions.closeMenu();
				}
			}}
		>
			<DropdownMenuTrigger asChild>
				<span
					aria-hidden
					style={{ left: menu.x, top: menu.y }}
					className="fixed size-px"
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-52"
				data-testid="workbench-context-menu"
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				{entries.map((entry) =>
					entry.separator ? (
						<DropdownMenuSeparator key={entry.key} />
					) : (
						<DropdownMenuItem
							key={entry.key}
							onSelect={() => entry.run()}
						>
							{entry.label}
						</DropdownMenuItem>
					),
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
