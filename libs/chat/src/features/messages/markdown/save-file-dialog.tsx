import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { RoomStore } from "../../room/room.store";

/** Props for {@link SaveFileDialog}. */
interface SaveFileDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** The text to save. */
	content: string;
	/** Called when the dialog closes, with whether the file was saved. */
	onClose: (success?: boolean) => void;
	/** The room whose files the file is saved to; without it Save does nothing. */
	room?: RoomStore;
	/** The extension the saved file gets, whatever the user typed. */
	extension: string;
}

/**
 * The path a file is saved at, from the name the user typed.
 *
 * @param name - The typed name; its own extension is dropped.
 * @param extension - The extension to give the file.
 * @returns A name safe for a path, with the extension; a timestamped name
 * when nothing usable was typed.
 */
const createCodeFilePathFromName = (name: string, extension: string) => {
	const baseName = name.trim().replace(/\.[^./\\]+$/, "");
	const safeName = baseName
		.replace(/[\\/:*?"<>|]/g, "-")
		.replace(/\s+/g, "-");
	const resolvedName = safeName || `save-code-response-${Date.now()}`;

	return `${resolvedName}.${extension}`;
};

/** Asks for a file name and saves a block's text to the room's files, then opens it. */
export const SaveFileDialog = ({
	open,
	content,
	onClose,
	room,
	extension,
}: SaveFileDialogProps) => {
	const { t } = useTranslation("chat");
	const [fileName, setFileName] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	// start empty each time the dialog opens
	useEffect(() => {
		if (!open) {
			setFileName("");
			setIsSaving(false);
		}
	}, [open]);

	/** Save the file to the room and open it in the sidebar. */
	const handleSave = async () => {
		if (!room || !content || !fileName.trim()) return;

		const filePath = createCodeFilePathFromName(fileName, extension);

		try {
			setIsSaving(true);
			await room.runRoomPixel(
				`SaveInsightAssets(filePath=[${JSON.stringify(filePath)}], content=["<encode>${content}</encode>"]);`,
				false,
				false,
			);
			room.openFileSidebarPanel(filePath, undefined, { refresh: true });
			toast.success(t("notifications.savedInRoom", { filePath }));
			onClose(true);
		} catch (error) {
			toast.error(getErrorMessage(error, t("blocks.saveFileFailed")));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose(false);
				}
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("blocks.saveFile")}</DialogTitle>
				</DialogHeader>
				<Input
					value={fileName}
					onChange={(event) => setFileName(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							void handleSave();
						}
					}}
				/>
				<DialogFooter>
					<Button variant="outline" onClick={() => onClose(false)}>
						{t("common:buttons.cancel")}
					</Button>
					<Button
						onClick={() => void handleSave()}
						disabled={isSaving || !fileName.trim()}
					>
						{isSaving
							? t("response.savingToRoom")
							: t("common:buttons.save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
