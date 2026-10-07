import { type ReactNode, useEffect, useId } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@semoss/ui/next";

/** Radix handles viewport collisions; Lexical retains caret focus and option navigation. */
export function RoomComposerSlashMenu({
	anchor,
	children,
}: {
	anchor: HTMLElement;
	children: ReactNode;
}) {
	const id = useId();
	useEffect(() => {
		// Lexical's listbox is the aria-controls target; its options live in the collision-aware portal.
		anchor.setAttribute("aria-owns", id);
		return () => anchor.removeAttribute("aria-owns");
	}, [anchor, id]);
	return (
		<Popover open modal={false}>
			<PopoverAnchor virtualRef={{ current: anchor }} />
			<PopoverContent
				id={id}
				role="presentation"
				side="top"
				align="start"
				className="max-h-64 w-72 overflow-y-auto p-1"
				onOpenAutoFocus={(event) => event.preventDefault()}
				onCloseAutoFocus={(event) => event.preventDefault()}
				onInteractOutside={(event) => event.preventDefault()}
			>
				{children}
			</PopoverContent>
		</Popover>
	);
}
