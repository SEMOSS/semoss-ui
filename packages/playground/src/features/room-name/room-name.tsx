import { cn } from "@semoss/ui/next";
import { RoomNameField } from "./room-name-field";

interface RoomNameProps {
	/** The room's saved name, shown and edited. */
	name: string;
	/** Shown in place of a blank name. */
	placeholder?: string;
	/** Whether the name is being edited in place. */
	isRenaming: boolean;
	/** Starts editing the name; a double-click on it asks. */
	onStartRename: () => void;
	/**
	 * Saves a new name.
	 *
	 * @return Whether it was saved.
	 */
	onRename: (name: string) => Promise<boolean>;
	/**
	 * Ends the edit.
	 *
	 * @param shouldRefocus - Whether focus goes back to the name, as it does
	 * after Enter or Escape but not after a click elsewhere.
	 */
	onStopRename: (shouldRefocus: boolean) => void;
	/** Classes for the name, or for the field while editing. */
	className?: string;
}

/**
 * A room's name, the same in the sidebar and the room header. A double-click
 * edits it in place with {@link RoomNameField}; the owner keeps whether it is
 * being edited, so it can also start the edit another way.
 */
export function RoomName({
	name,
	placeholder,
	isRenaming,
	onStartRename,
	onRename,
	onStopRename,
	className,
}: RoomNameProps) {
	if (isRenaming) {
		return (
			<RoomNameField
				savedName={name}
				onRename={onRename}
				onClose={onStopRename}
				className={className}
			/>
		);
	}

	const shownName = name || placeholder || "";
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: a pointer shortcut — F2 in the sidebar and /rename in the room are the keyboard paths
		<span
			dir="auto"
			title={shownName}
			className={cn("block min-w-0 truncate", className)}
			onDoubleClick={(event) => {
				// a double-click would otherwise select the word under it
				event.preventDefault();
				onStartRename();
			}}
		>
			{shownName}
		</span>
	);
}
