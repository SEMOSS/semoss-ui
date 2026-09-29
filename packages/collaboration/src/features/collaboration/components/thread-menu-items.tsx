import { Fragment } from "react";
import {
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@semoss/ui/next";
import type {
	ThreadMenuAction,
	ThreadMenuGroup,
} from "./use-thread-menu-actions";

/** Both entry points render the same ordered actions using their own menu primitives. */
export function ThreadMenuItems({
	groups,
	presentation,
	onSelect,
}: {
	groups: ThreadMenuGroup[];
	presentation: "context" | "dropdown";
	onSelect: (action: ThreadMenuAction) => void;
}) {
	const Item =
		presentation === "context" ? ContextMenuItem : DropdownMenuItem;
	const Label =
		presentation === "context" ? ContextMenuLabel : DropdownMenuLabel;
	const Separator =
		presentation === "context"
			? ContextMenuSeparator
			: DropdownMenuSeparator;
	return groups.map((group, index) => (
		<Fragment key={group.id}>
			{index > 0 && <Separator />}
			{group.label && <Label>{group.label}</Label>}
			{group.actions.map((action) => (
				<Item
					key={action.id}
					className="min-h-8 pointer-coarse:min-h-11"
					onSelect={() => onSelect(action)}
				>
					<action.icon aria-hidden="true" />
					{action.label}
				</Item>
			))}
		</Fragment>
	));
}
