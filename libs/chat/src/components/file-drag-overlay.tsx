import { FilePlus2Icon, PaperclipIcon, XIcon } from "lucide-react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { FILE_DRAG_ATTR, useFileDrag } from "../contexts/file-drag-context";
import { cn } from "../lib/utils";

export function FileDragOverlay() {
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
			<input
				ref={fileInputRef}
				type="file"
				multiple
				hidden
				onChange={(event) => {
					if (event.target.files) {
						addFiles(Array.from(event.target.files));
						setShouldStayOpen(true);
						event.target.value = "";
					}
				}}
			/>

			<Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
				<DialogContent
					{...{ [FILE_DRAG_ATTR]: "" }}
					aria-describedby={undefined}
					className="p-6 sm:max-w-xl"
				>
					<DialogHeader>
						<DialogTitle>Attach documents</DialogTitle>
						<DialogDescription>
							Drag files here or browse from your device.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-1 flex min-w-0 flex-col gap-6">
						<div className="flex h-72 flex-col gap-4">
							<div className="overflow-hidden transition-all duration-200">
								<div className={cn(files.length > 0 && "pt-3")}>
									{files.length > 0 && (
										<div className="flex flex-wrap gap-3">
											{files.map((file, index) => (
												<div
													key={`${file.name}-${file.size}-${index}`}
													className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-xs"
												>
													<span className="max-w-48 truncate">
														{file.name}
													</span>
													<button
														type="button"
														onClick={() =>
															removeFile(index)
														}
														aria-label={`Remove ${file.name}`}
														className="text-muted-foreground hover:text-foreground"
													>
														<XIcon className="size-3" />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							</div>

							<button
								type="button"
								className={cn(
									"flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
									isDragging
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary hover:bg-primary/5",
								)}
								onClick={() => fileInputRef.current?.click()}
								onDragOver={(event) => {
									if (
										!event.dataTransfer.types.includes(
											"Files",
										)
									) {
										return;
									}
									event.preventDefault();
									setIsDragging(true);
								}}
							>
								<FilePlus2Icon
									className={cn(
										"size-10 transition-colors",
										isDragging
											? "text-primary"
											: "text-muted-foreground",
									)}
								/>
								<p className="text-center text-muted-foreground text-sm">
									Drop files here or click to browse
								</p>
							</button>
						</div>

						<div className="flex justify-between pt-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => fileInputRef.current?.click()}
							>
								<PaperclipIcon />
								Browse
							</Button>
							<Button
								size="sm"
								disabled={files.length === 0}
								onClick={close}
							>
								Done
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
