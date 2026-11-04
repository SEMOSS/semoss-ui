import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Input } from "@semoss/ui/next";
import { useRoomTitle } from "./room-title.context";

/**
 * The room's name at the start of its header. Rename, from the header's Other
 * menu, edits it in place: Enter or leaving the field saves it, and Escape
 * keeps the old name. Renders inside a `RoomTitleProvider`.
 */
export const RoomTitle = observer(() => {
	const { t } = useTranslation("room");
	const title = useRoomTitle();
	const [draftName, setDraftName] = useState("");
	// Enter saves, and the field's blur that follows must not save again.
	const isSaving = useRef(false);
	// Enter and Escape hand focus back to the name; a click elsewhere keeps it.
	const shouldRefocus = useRef(false);
	const headingRef = useRef<HTMLHeadingElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const isRenaming = title?.isRenaming ?? false;
	const savedName = title?.room.metadata.name ?? "";

	// the field starts from the saved name and takes focus as it shows
	useEffect(() => {
		if (isRenaming) {
			setDraftName(savedName);
			inputRef.current?.focus();
			return;
		}
		if (!shouldRefocus.current) return;
		shouldRefocus.current = false;
		headingRef.current?.focus();
	}, [isRenaming, savedName]);

	if (!title) return null;
	const { actions, stopRenaming } = title;
	const name = savedName || t("header.untitled");

	const handleSave = async () => {
		if (isSaving.current) return;
		if (draftName.trim() === savedName) {
			stopRenaming();
			return;
		}
		isSaving.current = true;
		const isRenamed = await actions.rename(draftName);
		isSaving.current = false;
		if (isRenamed) stopRenaming();
	};

	if (isRenaming) {
		return (
			<Input
				ref={inputRef}
				aria-label={t("header.renameLabel")}
				value={draftName}
				onChange={(event) => setDraftName(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						shouldRefocus.current = true;
						void handleSave();
					} else if (event.key === "Escape") {
						event.preventDefault();
						shouldRefocus.current = true;
						stopRenaming();
					}
				}}
				onBlur={() => void handleSave()}
				className="h-8 w-full max-w-sm"
			/>
		);
	}

	return (
		<h1
			ref={headingRef}
			dir="auto"
			title={name}
			tabIndex={-1}
			className="min-w-0 truncate px-2 font-medium text-sm focus-visible:outline-none"
		>
			{name}
		</h1>
	);
});
