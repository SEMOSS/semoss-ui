import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Input } from "@semoss/ui/next";

interface RoomNameFieldProps {
	/** The room's saved name, which the field starts from. */
	savedName: string;
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
	onClose: (shouldRefocus: boolean) => void;
}

/**
 * Edits a room's name in place: Enter or leaving the field saves it, and
 * Escape keeps the old name. A failed save keeps the field open. It takes
 * focus as it mounts.
 */
export function RoomNameField({
	savedName,
	onRename,
	onClose,
}: RoomNameFieldProps) {
	const { t } = useTranslation("room");
	const [draftName, setDraftName] = useState(savedName);
	// Enter saves, and the field's blur that follows must not save again
	const isSaving = useRef(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSave = async (shouldRefocus: boolean) => {
		if (isSaving.current) return;
		const name = draftName.trim();
		if (name === savedName) {
			onClose(shouldRefocus);
			return;
		}
		isSaving.current = true;
		const isRenamed = await onRename(name);
		isSaving.current = false;
		if (isRenamed) onClose(shouldRefocus);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
			void handleSave(true);
		} else if (event.key === "Escape") {
			event.preventDefault();
			onClose(true);
		}
	};

	return (
		<Input
			ref={inputRef}
			aria-label={t("header.renameLabel")}
			value={draftName}
			onChange={(event) => setDraftName(event.target.value)}
			onKeyDown={handleKeyDown}
			onBlur={() => void handleSave(false)}
			className="h-8 w-full max-w-sm"
		/>
	);
}
