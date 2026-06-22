import { FilePlus2, PaperclipIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
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
				<DialogContent
					// Marks this element so the drag context can detect via
					// closest() whether the cursor is inside the dialog.
					{...{ [FILE_DRAG_ATTR]: "" }}
					// Suppresses Radix's missing-description warning when there
					// is no fileDragDisclaimer theme value to render.
					{...(!root.theme.fileDragDisclaimer && {
						"aria-describedby": undefined,
					})}
				>
					<DialogHeader>
						<DialogTitle>{t("fileDrag.modalTitle")}</DialogTitle>
						{root.theme.fileDragDisclaimer && (
							<DialogDescription>
								{root.theme.fileDragDisclaimer}
							</DialogDescription>
						)}
					</DialogHeader>

					<div className="-mt-2 flex min-w-0 flex-col gap-4">
						{/* Fixed-height area: file strip collapses/expands; drop zone fills the rest */}
						<div className="flex h-64 flex-col gap-2">
							<div className="overflow-hidden transition-all duration-200">
								<div className={cn(files.length && "pt-2")}>
									<FilePreviewGrid
										files={files}
										onRemoveFile={removeFile}
									/>
								</div>
							</div>

							{/* Drop zone — always shown; highlights when dragging.
							    Drop handling lives on window in the context so files
							    dropped anywhere on the page (including the backdrop)
							    are captured. onDragOver here only drives the highlight
							    and re-triggers isDragging when the dialog is already open. */}
							<button
								type="button"
								className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
									isDragging
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary hover:bg-primary/5"
								}`}
								onClick={() => fileInputRef.current?.click()}
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
							</button>
						</div>

						<div className="flex justify-between pt-1">
							<Button
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
							>
								<PaperclipIcon />
								{t("fileDrag.browse")}
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
