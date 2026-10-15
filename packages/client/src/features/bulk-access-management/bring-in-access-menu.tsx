import { ChevronDown, type LucideIcon } from "lucide-react";
import { Fragment } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@semoss/ui/next";

/** One way to bring access into a permission batch */
export interface BringInAccessItem {
	/** What the item says, such as "Copy From an App or Engine" */
	label: string;
	/** Its icon */
	icon: LucideIcon;
	/** Called when it is picked */
	onSelect: () => void;
	/** Whether it cannot be picked now */
	disabled?: boolean;
	/** Whether it starts a new group, below a line */
	isNewGroup?: boolean;
}

export interface BringInAccessMenuProps {
	/** The ways to bring access in, in order */
	items: BringInAccessItem[];
	/** Disables the whole menu */
	disabled?: boolean;
}

/**
 * The Bring In Access button: a menu of the ways to copy people into a batch or
 * give a whole team access, so they stay one click away without taking room
 * from the people search and the list.
 */
export const BringInAccessMenu = ({
	items,
	disabled = false,
}: BringInAccessMenuProps) => (
	// the items open dialogs; a menu that is not modal leaves locking the page
	// to the dialog, so the page is not left unclickable when it closes
	<DropdownMenu modal={false}>
		<DropdownMenuTrigger asChild>
			<Button
				type="button"
				size="sm"
				variant="outline"
				disabled={disabled || items.length === 0}
			>
				Bring In Access
				<ChevronDown className="size-4" aria-hidden />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			{items.map((item, index) => {
				const Icon = item.icon;
				return (
					<Fragment key={item.label}>
						{item.isNewGroup && index > 0 ? (
							<DropdownMenuSeparator />
						) : null}
						<DropdownMenuItem
							disabled={item.disabled}
							onSelect={item.onSelect}
						>
							<Icon className="size-4" aria-hidden />
							{item.label}
						</DropdownMenuItem>
					</Fragment>
				);
			})}
		</DropdownMenuContent>
	</DropdownMenu>
);
