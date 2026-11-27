import { PaperclipIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";
import { useFileDrop } from "../../attachments/file-drop.context";
import { useComposer } from "../composer.context";

/**
 * The plus menu's Attach item, which opens the file picker of the enclosing
 * `FileDropProvider`. Locked while a turn is running.
 */
export const AttachFilesItem = () => {
	const { t } = useTranslation("room");
	const { openFilePicker } = useFileDrop();
	const { isBusy, closeMenu } = useComposer();

	return (
		<DropdownMenuItem
			disabled={isBusy}
			onSelect={() => {
				openFilePicker();
				closeMenu();
			}}
		>
			<PaperclipIcon aria-hidden="true" />
			<span className="flex-1">{t("menuUpload.attachDocument")}</span>
		</DropdownMenuItem>
	);
};
