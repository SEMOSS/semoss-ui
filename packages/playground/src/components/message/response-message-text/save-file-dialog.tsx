import { useEffect, useState } from "react";
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
import type { RoomStore } from "@/stores";

interface SaveFileDialogProps {
	open: boolean;
	content: string;
	onClose: (success?: boolean) => void;
	room?: RoomStore;
	extension: string;
}

const createCodeFilePathFromName = (name: string, extension: string) => {
	const baseName = name.trim().replace(/\.[^./\\]+$/, "");
	const safeName = baseName
		.replace(/[\\/:*?"<>|]/g, "-")
		.replace(/\s+/g, "-");
	const resolvedName = safeName || `save-code-response-${Date.now()}`;

	return `${resolvedName}.${extension}`;
};

export const SaveFileDialog = ({
	open,
	content,
	onClose,
	room,
	extension,
}: SaveFileDialogProps) => {
	const [fileName, setFileName] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!open) {
			setFileName("");
			setIsSaving(false);
		}
	}, [open]);

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
			room.openFileEditorSidebarNode(filePath, {
				forceRefresh: true,
			});
			toast.success(`Saved in room as ${filePath}`);
			onClose(true);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save file",
			);
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
					<DialogTitle>Save code file</DialogTitle>
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
						Cancel
					</Button>
					<Button
						onClick={() => void handleSave()}
						disabled={isSaving || !fileName.trim()}
					>
						{isSaving ? "Saving…" : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
