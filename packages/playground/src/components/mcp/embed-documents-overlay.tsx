import { FileIcon, XIcon } from "lucide-react";
import { useId, useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	ScrollArea,
	Spinner,
	toast,
} from "@semoss/ui/next";

type KnowledgeEngine = {
	app_id: string;
	app_name: string;
};

type EmbedDocumentsOverlayProps = {
	open: boolean;
	onClose: (success: boolean) => void;
};

export const EmbedDocumentsOverlay = ({
	open,
	onClose,
}: EmbedDocumentsOverlayProps) => {
	const { actions } = useInsight();
	const fileInputId = useId();
	const [selectedKnowledge, setSelectedKnowledge] = useState<string | null>(
		null,
	);
	const [files, setFiles] = useState<File[]>([]);
	const [isEmbedding, setIsEmbedding] = useState(false);

	const getKnowledgeSources = usePixel<KnowledgeEngine[]>(
		open
			? `MyEngines(engineTypes=['VECTOR'], userT=[true], limit=[100], offset=[0]);`
			: "",
		{ data: [] },
	);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = Array.from(e.target.files || []);
		setFiles((prev) => [...prev, ...selectedFiles]);
	};

	const handleRemoveFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleEmbed = async () => {
		if (!selectedKnowledge) {
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
				engine=["${selectedKnowledge}"],
				filePaths=[${filePaths}]
			);`);

			toast.success("Documents embedded successfully");
			setFiles([]);
			setSelectedKnowledge(null);
			onClose(true);
		} catch (e) {
			toast.error("Failed to embed documents");
			console.error(e);
		} finally {
			setIsEmbedding(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={() => onClose(false)}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						Embed Documents into Existing Source
					</DialogTitle>
					<DialogDescription>
						Select a knowledge source and upload documents to embed.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<label
							htmlFor={fileInputId}
							className="mb-2 block font-medium text-sm"
						>
							Knowledge Source
						</label>
						{getKnowledgeSources.status === "LOADING" ? (
							<div className="flex justify-center py-8">
								<Spinner />
							</div>
						) : getKnowledgeSources.status === "ERROR" ? (
							<div className="text-destructive text-sm">
								Failed to load knowledge sources.
							</div>
						) : getKnowledgeSources.data.length === 0 ? (
							<div className="text-muted-foreground text-sm">
								No knowledge sources found.
							</div>
						) : (
							<ScrollArea className="h-[200px] rounded-md border">
								<div className="space-y-2 p-4">
									{getKnowledgeSources.data.map((source) => (
										<button
											type="button"
											key={source.app_id}
											onClick={() =>
												setSelectedKnowledge(
													source.app_id,
												)
											}
											className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
												selectedKnowledge ===
												source.app_id
													? "border-primary bg-primary/10"
													: "border-border hover:bg-accent"
											}`}
										>
											{source.app_name}
										</button>
									))}
								</div>
							</ScrollArea>
						)}
					</div>

					<div>
						<label
							htmlFor={fileInputId}
							className="mb-2 block font-medium text-sm"
						>
							Documents
						</label>
						<div className="rounded-md border-2 border-dashed p-4">
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
								className="cursor-pointer text-muted-foreground text-sm hover:text-foreground"
							>
								Click to select files or drag and drop
							</label>
						</div>

						{files.length > 0 && (
							<div className="mt-3 space-y-2">
								{files.map((file, index) => (
									<div
										key={`${file.name}-${index}`}
										className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
									>
										<div className="flex min-w-0 items-center gap-2">
											<FileIcon className="h-4 w-4 shrink-0" />
											<span className="truncate">
												{file.name}
											</span>
										</div>
										<button
											type="button"
											onClick={() =>
												handleRemoveFile(index)
											}
											disabled={isEmbedding}
											className="rounded p-1 hover:bg-destructive/10"
											aria-label="Remove file"
										>
											<XIcon className="h-4 w-4" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => {
								onClose(false);
								setFiles([]);
								setSelectedKnowledge(null);
							}}
							disabled={isEmbedding}
						>
							Cancel
						</Button>
						<Button
							onClick={handleEmbed}
							disabled={
								!selectedKnowledge ||
								files.length === 0 ||
								isEmbedding ||
								getKnowledgeSources.status !== "SUCCESS"
							}
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
