import { Fragment } from "react";
import {
	Button,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	Small,
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
	presentation: "context" | "dropdown" | "popover";
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
	if (presentation === "popover")
		return groups.map((group, index) => (
			<div key={group.id} className="space-y-1">
				{index > 0 && <div className="my-2 border-t" />}
				{group.label && (
					<Small className="px-2 text-muted-foreground">
						{group.label}
					</Small>
				)}
				{group.actions.map((action) => (
					<Button
						key={action.id}
						type="button"
						variant="ghost"
						size="sm"
						className="h-auto min-h-8 pointer-coarse:min-h-11 w-full justify-start whitespace-normal text-left"
						disabled={action.disabled}
						onClick={() => onSelect(action)}
					>
						<action.icon aria-hidden="true" />
						{action.label}
					</Button>
				))}
			</div>
		));
	return groups.map((group, index) => (
		<Fragment key={group.id}>
			{index > 0 && <Separator />}
			{group.label && <Label>{group.label}</Label>}
			{group.actions.map((action) => (
				<Item
					key={action.id}
					disabled={action.disabled}
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
