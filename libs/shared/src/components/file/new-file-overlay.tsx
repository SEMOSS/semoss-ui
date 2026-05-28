import type React from "react";
import { useId, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	FieldSet,
	Input,
	Muted,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import type { FileMode } from "./file.types";

export type NewFileAction = "upload" | "add_file" | "add_directory";
type NewFileData =
	| {
			action: "upload";
			files: File[];
	  }
	| {
			action: "add_file";
			name: string;
	  }
	| {
			action: "add_directory";
			name: string;
	  };

const getInitialData = (action: NewFileAction): NewFileData => {
	if (action === "add_file") {
		return {
			action: "add_file",
			name: "",
		};
	}
	if (action === "add_directory") {
		return {
			action: "add_directory",
			name: "",
		};
	}
	return {
		action: "upload",
		files: [],
	};
};

interface NewFileOverlayProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to upload or create at */
	path: string;

	/** Track if the overlay is open */
	open: boolean;

	/** Initial action selected when the overlay opens */
	initialAction?: NewFileAction;

	/** Callback triggered when the dialog is closed */
	onClose: (success: boolean) => void;
}

export const NewFileOverlay: React.FC<NewFileOverlayProps> = ({
	mode,
	path,
	open,
	initialAction = "upload",
	onClose = () => null,
}) => {
	const insight = useInsight();
	const fileInputId = useId();
	const [data, setData] = useState<NewFileData>(() =>
		getInitialData(initialAction),
	);

	const [isLoading, setIsLoading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [filesToUnzip, setFilesToUnzip] = useState<Map<string, boolean>>(
		new Map(),
	);

	/**
	 * Check if a file is a ZIP file based on extension and MIME type
	 */
	const isZipFile = (file: File): boolean => {
		const hasZipExtension = file.name.toLowerCase().endsWith(".zip");
		const hasZipMimeType =
			file.type === "application/zip" ||
			file.type === "application/x-zip-compressed";
		return hasZipExtension && hasZipMimeType;
	};

	/**
	 * Toggle unzip selection for a specific file
	 */
	const toggleUnzip = (fileKey: string) => {
		setFilesToUnzip((prev) => {
			const newMap = new Map(prev);
			if (newMap.has(fileKey)) {
				newMap.set(fileKey, !newMap.get(fileKey));
			} else {
				newMap.set(fileKey, true);
			}
			return newMap;
		});
	};

	const isDisabled =
		isLoading ||
		(data.action === "add_file" && data.name.trim().length === 0) ||
		(data.action === "add_directory" && data.name.trim().length === 0) ||
		(data.action === "upload" && data.files.length === 0);

	/**
	 * Handle file selection
	 */
	const handleFiles = (files: FileList | null) => {
		if (files) {
			const fileArray = Array.from(files);
			setData((prev) => ({
				...prev,
				files: fileArray,
			}));
		}
	};

	/**
	 * Handle drag events
	 */
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const files = e.dataTransfer.files;
		handleFiles(files);
	};

	/**
	 * Reset the form
	 */
	const resetForm = () => {
		setData({
			action: "upload",
			files: [],
		});
		setIsDragging(false);
		setFilesToUnzip(new Map());
		onClose(false);
	};

	/**
	 * Submit the form
	 */
	const submitForm = async () => {
		try {
			setIsLoading(true);

			let pixel = "";
			if (data.action === "upload") {
				if (data.files.length === 0) {
					toast.error("Please select at least one file to upload");
					return;
				}

				// upload the files
				let uploadResponse: {
					response: Response;
					data: {
						fileName: string;
						fileLocation: string;
					}[];
				} | null = null;

				if (mode.type === "APP") {
					uploadResponse = await insight.actions.uploadApp(
						mode.app,
						path,
						data.files,
					);
				} else if (mode.type === "ENGINE") {
					uploadResponse = await insight.actions.uploadEngine(
						mode.engine,
						path,
						data.files,
					);
				} else if (mode.type === "INSIGHT") {
					uploadResponse = await insight.actions.uploadInsight(
						path,
						data.files,
					);
				} else if (mode.type === "USER") {
					// no dedicated User upload helper — use the generic
					// insight upload route; backend resolves the scope from
					// the session.
					uploadResponse = await insight.actions.uploadInsight(
						path,
						data.files,
					);
				} else {
					throw new Error("Unknown mode type");
				}

				const uploadedFiles = uploadResponse?.data || [];

				// Handle unzip for selected files
				let extractedCount = 0;
				const extractionErrors: string[] = [];

				for (let i = 0; i < data.files.length; i++) {
					const file = data.files[i];
					const fileKey = `${file.name}-${file.size}`;
					const shouldExtract =
						isZipFile(file) && (filesToUnzip.get(fileKey) || false);

					if (shouldExtract && uploadedFiles[i]) {
						try {
							const uploadedFile = uploadedFiles[i];
							// Normalize path to use forward slashes
							const uploadedPath =
								uploadedFile.fileLocation.replace(/\\/g, "/");

							let unzipPixel = "";
							if (mode.type === "APP") {
								unzipPixel = `UnzipFile(filePath=["${uploadedPath}"], space=["${mode.app}"])`;
							} else if (mode.type === "ENGINE") {
								unzipPixel = `UnzipFile(filePath=["${uploadedPath}"], space=["${mode.engine}"])`;
							} else if (mode.type === "INSIGHT") {
								unzipPixel = `UnzipFile(filePath=["${uploadedPath}"])`;
							} else if (mode.type === "USER") {
								unzipPixel = `UnzipFile(filePath=["${uploadedPath}"], space=["user"])`;
							}

							await insight.actions.run(unzipPixel);
							extractedCount++;
						} catch (error) {
							extractionErrors.push(
								`${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
							);
						}
					}
				}

				// Show success message with extraction summary
				if (extractedCount > 0 || extractionErrors.length === 0) {
					if (extractedCount > 0) {
						toast.success(
							`Successfully uploaded ${data.files.length} file(s)${extractedCount > 0 ? `, extracted ${extractedCount} ZIP(s)` : ""}`,
						);
					} else {
						toast.success("Successfully uploaded file(s)");
					}
				}

				// Show errors if any extractions failed
				if (extractionErrors.length > 0) {
					toast.error(
						`${extractionErrors.length} extraction(s) failed: ${extractionErrors.join("; ")}`,
					);
				}
			} else if (data.action === "add_file") {
				if (!data.name.trim()) {
					toast.error("Please enter a name for the file");
					return;
				}

				if (mode.type === "APP") {
					pixel = `NewAppAssetsFile(project=["${mode.app}"], filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "ENGINE") {
					pixel = `NewEngineAssetsFile(engine=["${mode.engine}"], filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "INSIGHT") {
					pixel = `NewInsightAssetsFile(filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "USER") {
					pixel = `NewUserAssetsFile(filePath=["${path}${data.name}"]);`;
				}

				// run it
				await insight.actions.run(pixel);

				toast.success("Successfully created file");
			} else if (data.action === "add_directory") {
				if (!data.name.trim()) {
					toast.error("Please enter a name for the directory");
					return;
				}

				if (mode.type === "APP") {
					pixel = `NewAppAssetsDirectory(project=["${mode.app}"], filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "ENGINE") {
					pixel = `NewEngineAssetsDirectory(engine=["${mode.engine}"], filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "INSIGHT") {
					pixel = `NewInsightAssetsDirectory(filePath=["${path}${data.name}"]);`;
				} else if (mode.type === "USER") {
					pixel = `NewUserAssetsDirectory(filePath=["${path}${data.name}"]);`;
				}

				// run it
				await insight.actions.run(pixel);

				toast.success("Successfully created directory");
			} else {
				throw new Error("Unknown action");
			}

			// reset the data
			resetForm();

			onClose(true);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "An error occurred");
			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={() => resetForm()}>
			<DialogContent
				aria-describedby="Upload or create a new file or directory in the current path"
				className="sm:max-w-2xl"
			>
				<DialogHeader>
					<DialogTitle>Create File or Directory</DialogTitle>
					<DialogDescription>
						Upload or create a new file or directory at path: {path}
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						submitForm();
					}}
				>
					<FieldSet>
						<FieldGroup>
							<Field>
								<FieldLabel>Action</FieldLabel>
								<Select
									value={data.action}
									onValueChange={(value) => {
										if (value === "upload") {
											setData({
												action: "upload",
												files: [],
											});
										} else if (value === "add_file") {
											setData({
												action: "add_file",
												name: "",
											});
										} else if (value === "add_directory") {
											setData({
												action: "add_directory",
												name: "",
											});
										}
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select action" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectLabel>Action</SelectLabel>
											<SelectItem value="upload">
												Upload Files
											</SelectItem>
											<SelectItem value="add_file">
												New File
											</SelectItem>
											<SelectItem value="add_directory">
												New Directory
											</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
							</Field>
						</FieldGroup>
						<FieldSeparator />
						<FieldGroup>
							{data.action === "upload" && (
								<Field>
									<FieldLabel>Upload File/Zip</FieldLabel>
									{/* biome-ignore lint/a11y/useSemanticElements: div required for drag-and-drop functionality */}
									<div
										role="button"
										tabIndex={0}
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop}
										className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors ${
											isDragging
												? "border-primary bg-primary/5"
												: "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
										}`}
										onClick={() => {
											document
												.getElementById(fileInputId)
												?.click();
										}}
										onKeyDown={(e) => {
											if (
												e.key === "Enter" ||
												e.key === " "
											) {
												e.preventDefault();
												document
													.getElementById(fileInputId)
													?.click();
											}
										}}
									>
										<input
											id={fileInputId}
											type="file"
											multiple
											className="hidden"
											onChange={(e) =>
												handleFiles(e.target.files)
											}
										/>
										<div className="flex flex-col items-center gap-2 text-center">
											<svg
												className="size-10 text-muted-foreground"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												role="img"
												aria-label="Upload icon"
											>
												<title>Upload icon</title>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
												/>
											</svg>
											<div>
												<p className="font-medium">
													Drag and drop files here
												</p>
												<p className="text-muted-foreground text-sm">
													or click to browse
												</p>
											</div>
										</div>
									</div>
									{data.files.length > 0 && (
										<div className="mt-2 space-y-1">
											<Muted className="font-medium text-xs">
												{data.files.length} file(s)
												selected:
											</Muted>
											<div className="max-h-24 space-y-1 overflow-y-auto">
												{data.files.map((file) => {
													const fileKey = `${file.name}-${file.size}`;
													const fileIsZip =
														isZipFile(file);
													const shouldUnzip =
														fileIsZip &&
														(filesToUnzip.get(
															fileKey,
														) ||
															false);

													return (
														<div
															key={fileKey}
															className="flex items-center justify-between rounded bg-muted px-2 py-1 text-xs"
														>
															<div className="flex flex-1 items-center gap-2 truncate">
																<span className="truncate">
																	{file.name}
																</span>
																<span className="whitespace-nowrap text-muted-foreground">
																	(
																	{(
																		file.size /
																		1024
																	).toFixed(
																		1,
																	)}{" "}
																	KB)
																</span>
															</div>
															{fileIsZip && (
																<label className="ms-auto flex items-center gap-2 whitespace-nowrap ps-2">
																	<input
																		type="checkbox"
																		checked={
																			shouldUnzip
																		}
																		onChange={() =>
																			toggleUnzip(
																				fileKey,
																			)
																		}
																		title="Extract this ZIP after upload"
																		className="cursor-pointer"
																	/>
																	<span className="text-muted-foreground text-xs hover:text-foreground">
																		Unzip
																	</span>
																</label>
															)}
														</div>
													);
												})}
											</div>
										</div>
									)}
								</Field>
							)}

							{data.action === "add_file" && (
								<Field>
									<FieldLabel>File Name</FieldLabel>
									<Input
										placeholder={"Enter File Name"}
										value={data.name}
										onChange={(e) =>
											setData((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
									/>
								</Field>
							)}

							{data.action === "add_directory" && (
								<Field>
									<FieldLabel>Directory Name</FieldLabel>
									<Input
										placeholder={"Enter Directory Name"}
										value={data.name}
										onChange={(e) =>
											setData((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
									/>
								</Field>
							)}
						</FieldGroup>
					</FieldSet>
				</form>
				<DialogFooter>
					<Button
						variant="ghost"
						disabled={isLoading}
						onClick={() => {
							resetForm();
						}}
					>
						Cancel
					</Button>
					<Button
						variant="default"
						disabled={isDisabled}
						onClick={() => submitForm()}
					>
						{isLoading ? (
							<Spinner />
						) : (
							<>
								{data.action === "upload" && "Upload"}
								{data.action === "add_file" && "Create"}
								{data.action === "add_directory" && "Create"}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
