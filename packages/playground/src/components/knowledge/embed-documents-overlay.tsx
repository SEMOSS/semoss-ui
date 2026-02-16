/* eslint-disable */
/** biome-ignore-all lint/nursery/useSortedClasses: using existing Tailwind order in this file */

import { FileIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
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

type EmbedDocumentsOverlayProps = {
	open: boolean;
	onClose: (success: boolean) => void;
	knowledgeId: string;
};

export const EmbedDocumentsOverlay = ({
	open,
	knowledgeId,
	onClose,
}: EmbedDocumentsOverlayProps) => {
	const { actions } = useInsight();
	const fileInputId = useId();
	const [files, setFiles] = useState<File[]>([]);
	const [isEmbedding, setIsEmbedding] = useState(false);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files || []);
		setFiles((prev) => [...prev, ...selectedFiles]);
	};

	const handleRemoveFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleEmbed = async () => {
		if (!knowledgeId) {
			toast.error("Please select a knowledge source");
			return;
		}

		if (files.length === 0) {
			toast.error("Please select at least one document");
			return;
		}

		setIsEmbedding(true);
		try {
			// Upload the files
			const uploaded = await actions.upload(files, "");

			// Create the embeddings
			const filePaths = uploaded
				.map(({ fileLocation }) => `"${fileLocation}"`)
				.join(", ");

			await actions.run<
				[
					{
						database_id: string;
					},
				]
			>(`CreateEmbeddingsFromDocuments(
				engine=["${knowledgeId}"],
				filePaths=[${filePaths}]
			);`);

			toast.success("Documents embedded successfully");
			setFiles([]);
			onClose(true);
		} catch (e) {
			toast.error("Failed to embed documents");
			console.error(e);
		} finally {
			setIsEmbedding(false);
		}
	};

	const [isDragging, setIsDragging] = useState(false);

	const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

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
					<DialogTitle>
						Embed Documents into Existing Source
					</DialogTitle>
					<DialogDescription>
						Upload documents to embed into this knowledge source.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<label
							htmlFor={fileInputId}
							className="block mb-2 text-sm font-medium"
						>
							Documents
						</label>
						<button
							type="button"
							className={`w-full rounded-md border-2 border-dashed p-4 transition-colors text-left ${
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
								Click to select files or drag and drop
							</label>
						</button>

						{files.length > 0 && (
							<div className="mt-3 max-h-[200px] overflow-y-auto pr-2 w-full">
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
												aria-label="Remove file"
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
							Cancel
						</Button>
						<Button
							onClick={handleEmbed}
							disabled={files.length === 0 || isEmbedding}
						>
							{isEmbedding ? (
								<>
									<Spinner className="mr-2 h-4 w-4" />
									Embedding...
								</>
							) : (
								"Embed Documents"
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
