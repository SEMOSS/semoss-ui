import { useRef, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";

export interface EntityNameInputProps {
	/** Current name. The input starts with it, and saving it unchanged is skipped. */
	name: string;
	/** Accessible name for the input. */
	label: string;
	/** Text classes that match the input to the name it replaces. */
	className?: string;
	/** Saves the trimmed name; reject to report a failure. */
	onRename: (name: string) => Promise<void>;
	/** Ends the edit. `restoreFocus` is true when it ended from the keyboard. */
	onDone: (restoreFocus: boolean) => void;
}

/**
 * Inline input that renames an entity from its header. It is mounted only
 * while the name is being edited, so its value starts from the current name.
 * Enter or leaving the field saves, Escape cancels, and a blank or unchanged
 * name ends the edit without saving. A spinner shows while the save runs, and
 * a toast reports the result.
 */
export const EntityNameInput = ({
	name,
	label,
	className,
	onRename,
	onDone,
}: EntityNameInputProps) => {
	const [value, setValue] = useState(name);
	const [isSaving, setIsSaving] = useState(false);
	// Enter and blur can both end the edit; only the first one counts
	const isFinishedRef = useRef(false);

	const finish = async (save: boolean, restoreFocus: boolean) => {
		if (isFinishedRef.current) {
			return;
		}
		isFinishedRef.current = true;

		const nextName = value.trim();
		if (save && nextName && nextName !== name) {
			setIsSaving(true);
			try {
				await onRename(nextName);
				toast.success(`Renamed to "${nextName}"`);
			} catch (error) {
				toast.error(`Couldn't rename to "${nextName}"`, {
					description: getErrorMessage(
						error,
						"Something went wrong. Try again.",
					),
				});
			}
		}

		onDone(restoreFocus);
	};

	return (
		<InputGroup className="h-auto">
			<InputGroupInput
				autoFocus
				value={value}
				aria-label={label}
				aria-busy={isSaving}
				readOnly={isSaving}
				onChange={(e) => setValue(e.target.value)}
				onFocus={(e) => e.target.select()}
				onBlur={() => void finish(true, false)}
				onKeyDown={(e) => {
					if (e.nativeEvent.isComposing) {
						return;
					}
					if (e.key === "Enter") {
						e.preventDefault();
						void finish(true, true);
					} else if (e.key === "Escape") {
						e.preventDefault();
						e.stopPropagation();
						void finish(false, true);
					}
				}}
				className={className}
			/>
			{isSaving && (
				<InputGroupAddon align="inline-end">
					<Spinner aria-label="Saving name" />
				</InputGroupAddon>
			)}
		</InputGroup>
	);
};
