import { FilePlus2, PaperclipIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { FILE_DRAG_ATTR, useFileDrag } from "@/contexts";
import { useRoot } from "@/hooks";
import { FilePreviewGrid } from "./file-preview-grid";

export const FileDragOverlay = () => {
	const { t } = useTranslation("common");
	const { root } = useRoot();
	const {
		isDragging,
		setIsDragging,
		shouldStayOpen,
		setShouldStayOpen,
		files,
		addFiles,
		removeFile,
		fileInputRef,
	} = useFileDrag();

	const isOpen = isDragging || shouldStayOpen;

	const close = () => {
		setShouldStayOpen(false);
		setIsDragging(false);
	};

	return (
		<>
			{/* Hidden file input shared across the drag context */}
			<input
				ref={fileInputRef}
				type="file"
				multiple
				hidden
				onChange={(e) => {
					if (e.target.files) {
						addFiles(Array.from(e.target.files));
						setShouldStayOpen(true);
						e.target.value = "";
					}
				}}
			/>

			<Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
				<DialogContent {...{ [FILE_DRAG_ATTR]: "" }}>
					<DialogHeader>
						<DialogTitle>{t("fileDrag.modalTitle")}</DialogTitle>
					</DialogHeader>

					<div className="-mt-2 flex flex-col gap-4">
						{/* Fixed-height area: file strip collapses/expands; drop zone fills the rest */}
						<div className="flex h-64 flex-col gap-2">
							<div
								className={`overflow-hidden transition-all duration-200 ${
									files.length > 0 ? "h-20" : "h-0"
								}`}
							>
								<FilePreviewGrid
									files={files}
									onRemoveFile={removeFile}
								/>
							</div>

							{/* Drop zone — always shown; highlights when dragging.
							    Drop handling lives on window in the context so files
							    dropped anywhere on the page (including the backdrop)
							    are captured. onDragOver here only drives the highlight
							    and re-triggers isDragging when the dialog is already open. */}
							<div
								role="none"
								className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
									isDragging
										? "border-primary bg-primary/5"
										: "border-border"
								}`}
								onDragOver={(e) => {
									if (!e.dataTransfer.types.includes("Files"))
										return;
									e.preventDefault();
									setIsDragging(true);
								}}
							>
								<FilePlus2
									className={`size-10 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`}
								/>
								<p className="text-center text-muted-foreground text-sm">
									{t("fileDrag.title")}
								</p>
							</div>
						</div>

						{root.theme.fileDragDisclaimer && (
							<p className="text-muted-foreground text-sm">
								{root.theme.fileDragDisclaimer}
							</p>
						)}

						<div className="flex justify-between">
							<Button
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
							>
								<PaperclipIcon />
								{t("fileDrag.addMore")}
							</Button>
							<Button
								size="sm"
								disabled={files.length === 0}
								onClick={close}
							>
								{t("fileDrag.done")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
