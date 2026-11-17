/** biome-ignore-all lint/nursery/useSortedClasses: using existing Tailwind order in this file */

import { FileIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { createEmbeddingsFromDocuments } from "@semoss/sdk";
import { useSessionInsight } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Spinner,
	toast,
} from "@semoss/ui/next";

/** Props for {@link EmbedDocumentsOverlay}. */
type EmbedDocumentsOverlayProps = {
	/** Whether the dialog is open. */
	open: boolean;
	/** Called when the dialog closes, with whether documents were embedded. */
	onClose: (success: boolean) => void;
	/** The knowledge source (vector database) to embed into. */
	knowledgeId: string;
};

/**
 * A dialog that uploads documents, picked or dropped, and embeds them into a
 * knowledge source.
 */
export const EmbedDocumentsOverlay = ({
	open,
	knowledgeId,
	onClose,
}: EmbedDocumentsOverlayProps) => {
	const { t } = useTranslation(["knowledge", "common"]);
	const { withInsight, upload } = useSessionInsight();
	const fileInputId = useId();
	const [files, setFiles] = useState<File[]>([]);
	const [isEmbedding, setIsEmbedding] = useState(false);

	/**
	 * Adds the picked files to the list.
	 *
	 * @param e - The file input's change event.
	 */
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files || []);
		setFiles((prev) => [...prev, ...selectedFiles]);
	};

	/**
	 * Removes a file from the list.
	 *
	 * @param index - The file's position in the list.
	 */
	const handleRemoveFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	/** Uploads the files, then embeds them into the knowledge source. */
	const handleEmbed = async () => {
		if (!knowledgeId) {
			toast.error(t("embedMessages.selectKnowledgeSource"));
			return;
		}

		if (files.length === 0) {
			toast.error(t("embedMessages.selectDocument"));
			return;
		}

		setIsEmbedding(true);
		try {
			const uploaded = await upload(files);
			await withInsight((insightId) =>
				createEmbeddingsFromDocuments(
					insightId,
					knowledgeId,
					uploaded.map(({ fileLocation }) => fileLocation),
				),
			);

			toast.success(t("embedMessages.embedSuccess"));
			setFiles([]);
			onClose(true);
		} catch (e) {
			toast.error(t("embedMessages.embedFailed"));
			console.error(e);
		} finally {
			setIsEmbedding(false);
		}
	};

	const [isDragging, setIsDragging] = useState(false);

	/**
	 * Marks the drop zone while files are dragged over it.
	 *
	 * @param e - The drag event.
	 */
	const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	/**
	 * Clears the drop zone's mark when the drag leaves it.
	 *
	 * @param e - The drag event.
	 */
	const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	/**
	 * Adds the dropped files to the list.
	 *
	 * @param e - The drop event.
	 */
	const handleDrop = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		const droppedFiles = Array.from(e.dataTransfer.files || []);
		setFiles((prev) => [...prev, ...droppedFiles]);
	};

	return (
		<Dialog open={open} onOpenChange={() => onClose(false)}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("embedDocuments.title")}</DialogTitle>
					<DialogDescription>
						{t("embedDocuments.description")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<label
							htmlFor={fileInputId}
							className="block mb-2 text-sm font-medium"
						>
							{t("embedDocuments.documents")}
						</label>
						<button
							type="button"
							className={`w-full rounded-md border-2 border-dashed p-4 transition-colors text-start ${
								isDragging
									? "border-primary bg-primary/5"
									: "border-border"
							}`}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={() => {
								document.getElementById(fileInputId)?.click();
							}}
						>
							<input
								type="file"
								multiple
								onChange={handleFileSelect}
								disabled={isEmbedding}
								className="hidden"
								id={fileInputId}
							/>
							<label
								htmlFor={fileInputId}
								className="text-sm hover:text-foreground cursor-pointer text-muted-foreground"
							>
								{t("embedDocuments.selectFiles")}
							</label>
						</button>

						{files.length > 0 && (
							<div className="mt-3 max-h-50 overflow-y-auto pe-2 w-full">
								<div className="space-y-2">
									{files.map((file, index) => (
										<div
											key={`${file.name}-${index}`}
											className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm overflow-hidden max-w-xs"
										>
											<div className="flex items-start gap-2 min-w-0 flex-1 overflow-hidden">
												<FileIcon className="h-4 w-4 shrink-0 mt-0.5" />
												<span className="truncate break-all">
													{file.name}
												</span>
											</div>
											<button
												type="button"
												onClick={() =>
													handleRemoveFile(index)
												}
												disabled={isEmbedding}
												className="rounded p-1 hover:bg-destructive/10 shrink-0"
												aria-label={t(
													"embedDocuments.removeFile",
												)}
											>
												<XIcon className="h-4 w-4" />
											</button>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => {
								onClose(false);
								setFiles([]);
							}}
							disabled={isEmbedding}
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							onClick={handleEmbed}
							disabled={files.length === 0 || isEmbedding}
						>
							{isEmbedding ? (
								<>
									<Spinner className="me-2 h-4 w-4" />
									{t("embedDocuments.embedding")}
								</>
							) : (
								t("embedDocuments.embedButton")
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
