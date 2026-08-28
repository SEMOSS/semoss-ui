import {
	ChevronLeftIcon,
	FilePlus2Icon,
	FolderPlusIcon,
	UploadIcon,
} from "lucide-react";
import type React from "react";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "@semoss/i18n";
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
	FieldSet,
	Input,
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
	Muted,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getFileExplorerAdapter } from "./file-explorer.adapters";
import type {
	FileExplorerNewFileOverlayProps,
	NewFileAction,
} from "./file-explorer.types";
import { ensureDirectoryPath } from "./file-explorer.utils";

type NewFileData =
	| { action: "upload"; files: File[] }
	| { action: "add_file"; name: string }
	| { action: "add_directory"; name: string };

/**
 * The empty form state for an action.
 *
 * @param action - The action the form is for.
 * @return Its initial data.
 */
const getInitialData = (action: NewFileAction): NewFileData => {
	if (action === "add_file") {
		return { action: "add_file", name: "" };
	}
	if (action === "add_directory") {
		return { action: "add_directory", name: "" };
	}
	return { action: "upload", files: [] };
};

/** Icon per action, shared by the picker rows. */
const ACTION_ICONS: Record<NewFileAction, React.ComponentType> = {
	upload: UploadIcon,
	add_file: FilePlus2Icon,
	add_directory: FolderPlusIcon,
};

/** i18n key suffix per action, under `fileExplorer.overlay`. */
const ACTION_LABEL_KEYS: Record<NewFileAction, string> = {
	upload: "upload",
	add_file: "newFile",
	add_directory: "newDirectory",
};

/**
 * The default new-file overlay: upload files (optionally unzipping them),
 * create an empty file, or create a directory.
 *
 * `FileExplorer` takes this as its `newFileOverlay` prop rather than owning it,
 * so a host can substitute a different creation flow. When no `action` is
 * given the overlay opens on an action picker; when one is given (the context
 * menu's "New file" / "New folder") it goes straight to that form.
 */
export const NewFileOverlay: React.FC<FileExplorerNewFileOverlayProps> = ({
	mode,
	path,
	open,
	action,
	onClose,
}) => {
	const insight = useInsight();
	const { t } = useTranslation("common");
	const fileInputId = useId();
	const destinationInputId = useId();
	const adapter = useMemo(() => getFileExplorerAdapter(mode), [mode]);

	const availableActions = useMemo(() => {
		const actions: NewFileAction[] = [];
		if (adapter.capabilities.upload) {
			actions.push("upload");
		}
		if (adapter.capabilities.mutate) {
			actions.push("add_file", "add_directory");
		}
		return actions;
	}, [adapter]);

	// null means "show the picker" — either because no action was requested,
	// or because the user stepped back to it
	const [data, setData] = useState<NewFileData | null>(() =>
		action ? getInitialData(action) : null,
	);
	// the destination is a starting point, not a fixed one: the explorer opens
	// us at the folder that was right-clicked, and the user can retarget from
	// here without closing and navigating first
	const [destination, setDestination] = useState(path);
	const [isLoading, setIsLoading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [filesToUnzip, setFilesToUnzip] = useState<Map<string, boolean>>(
		new Map(),
	);

	/**
	 * Whether a file is a zip we can offer to extract after upload. Both the
	 * extension and the MIME type must agree, so a `.zip` that is not one does
	 * not get an extract checkbox.
	 *
	 * @param file - The selected file.
	 * @return True when it is a zip.
	 */
	const isZipFile = (file: File): boolean => {
		const hasZipExtension = file.name.toLowerCase().endsWith(".zip");
		const hasZipMimeType =
			file.type === "application/zip" ||
			file.type === "application/x-zip-compressed";
		return hasZipExtension && hasZipMimeType;
	};

	/**
	 * Toggle whether one selected zip should be extracted after upload.
	 *
	 * @param fileKey - The `name-size` key identifying the selected file.
	 */
	const toggleUnzip = (fileKey: string) => {
		setFilesToUnzip((previous) => {
			const next = new Map(previous);
			next.set(fileKey, !next.get(fileKey));
			return next;
		});
	};

	const isDisabled =
		isLoading ||
		!data ||
		destination.trim().length === 0 ||
		(data.action === "upload" && data.files.length === 0) ||
		(data.action !== "upload" && data.name.trim().length === 0);

	/**
	 * Take the files chosen from the picker or a drop.
	 *
	 * @param files - The chosen files, or null when the picker was dismissed.
	 */
	const handleFiles = (files: FileList | null) => {
		if (!files) return;
		const fileArray = Array.from(files);
		setData((previous) =>
			previous?.action === "upload"
				? { action: "upload", files: fileArray }
				: previous,
		);
	};

	/**
	 * Highlight the dropzone while files hover it.
	 *
	 * @param e - The dragover event.
	 */
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	/**
	 * Un-highlight the dropzone.
	 *
	 * @param e - The dragleave event.
	 */
	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	/**
	 * Take files dropped on the dropzone.
	 *
	 * @param e - The drop event.
	 */
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		handleFiles(e.dataTransfer.files);
	};

	/** Close without creating anything. The host remounts us to reset. */
	const cancel = () => {
		setIsDragging(false);
		onClose(false);
	};

	/** Step back to the picker. Only offered when nothing was preselected. */
	const back = () => {
		setData(null);
		setIsDragging(false);
		setFilesToUnzip(new Map());
	};

	/**
	 * Upload the selected files, then extract the ones marked for it.
	 *
	 * Extraction failures are collected and reported rather than thrown: the
	 * upload itself already succeeded, and the user should hear both facts.
	 *
	 * @param files - The files to upload.
	 * @param targetPath - The directory to upload into.
	 */
	const uploadFiles = async (files: File[], targetPath: string) => {
		const uploadResponse = await adapter.upload(
			insight.actions,
			targetPath,
			files,
		);
		const uploadedFiles = uploadResponse?.data || [];

		let extractedCount = 0;
		const extractionErrors: string[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const fileKey = `${file.name}-${file.size}`;
			const shouldExtract =
				isZipFile(file) && (filesToUnzip.get(fileKey) || false);

			if (!shouldExtract || !uploadedFiles[i]) {
				continue;
			}

			try {
				// normalize to forward slashes — the upload response reports
				// the server's own path separators
				const uploadedPath = uploadedFiles[i].fileLocation.replace(
					/\\/g,
					"/",
				);
				await insight.actions.run(adapter.unzip(uploadedPath));
				extractedCount++;
			} catch (error) {
				extractionErrors.push(
					`${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}

		if (extractedCount > 0) {
			toast.success(
				t("fileExplorer.overlay.toasts.uploadWithExtractSuccess", {
					count: files.length,
					extractedCount: extractedCount,
				}),
			);
		} else if (extractionErrors.length === 0) {
			toast.success(t("fileExplorer.overlay.toasts.uploadSuccess"));
		}

		if (extractionErrors.length > 0) {
			toast.error(
				t("fileExplorer.overlay.toasts.extractionsFailed", {
					count: extractionErrors.length,
					errors: extractionErrors.join("; "),
				}),
			);
		}
	};

	/** Run the selected action, then close the dialog on success. */
	const submitForm = async () => {
		if (!data) return;

		// the create reactors take a full path, so the destination has to be
		// directory-shaped however the user typed it
		const targetPath = ensureDirectoryPath(destination.trim());

		try {
			setIsLoading(true);

			if (data.action === "upload") {
				if (data.files.length === 0) {
					toast.error(
						t("fileExplorer.overlay.toasts.selectAtLeastOne"),
					);
					return;
				}

				await uploadFiles(data.files, targetPath);
			} else if (data.action === "add_file") {
				if (!data.name.trim()) {
					toast.error(t("fileExplorer.overlay.toasts.enterFileName"));
					return;
				}

				await insight.actions.run(
					adapter.createFile(`${targetPath}${data.name}`),
				);
				toast.success(t("fileExplorer.overlay.toasts.fileCreated"));
			} else {
				if (!data.name.trim()) {
					toast.error(
						t("fileExplorer.overlay.toasts.enterDirectoryName"),
					);
					return;
				}

				await insight.actions.run(
					adapter.createDirectory(`${targetPath}${data.name}`),
				);
				toast.success(
					t("fileExplorer.overlay.toasts.directoryCreated"),
				);
			}

			onClose(true, targetPath);
		} catch (e) {
			toast.error(
				e instanceof Error
					? e.message
					: t("fileExplorer.overlay.toasts.anError"),
			);
			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};

	// nothing this mode can create — never reached from an explorer, which
	// hides the affordance, but a direct host could still mount us
	if (availableActions.length === 0) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={() => cancel()}>
			<DialogContent
				aria-describedby="Upload or create a new file or directory in the current path"
				className="sm:max-w-2xl"
			>
				<DialogHeader>
					<DialogTitle>{t("fileExplorer.overlay.title")}</DialogTitle>
					<DialogDescription>
						{t("fileExplorer.overlay.description", {
							path: destination,
						})}
					</DialogDescription>
				</DialogHeader>

				{!data ? (
					<ItemGroup
						data-testid="new-file-overlay-action-picker"
						className="gap-2"
					>
						{availableActions.map((availableAction) => {
							const Icon = ACTION_ICONS[availableAction];
							const labelKey = ACTION_LABEL_KEYS[availableAction];

							return (
								<Item
									key={availableAction}
									asChild
									variant="outline"
									size="sm"
								>
									<button
										data-testid={`new-file-overlay-action-${availableAction}`}
										type="button"
										className="w-full cursor-pointer text-start hover:bg-accent/50"
										onClick={() =>
											setData(
												getInitialData(availableAction),
											)
										}
									>
										<ItemMedia variant="icon">
											<Icon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>
												{t(
													`fileExplorer.overlay.actions.${labelKey}`,
												)}
											</ItemTitle>
											<ItemDescription>
												{t(
													`fileExplorer.overlay.actionDescriptions.${labelKey}`,
												)}
											</ItemDescription>
										</ItemContent>
									</button>
								</Item>
							);
						})}
					</ItemGroup>
				) : (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							submitForm();
						}}
					>
						<FieldSet>
							<FieldGroup>
								{data.action === "upload" && (
									<Field>
										<FieldLabel>
											{t(
												"fileExplorer.overlay.fields.uploadFileZip",
											)}
										</FieldLabel>
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
														.getElementById(
															fileInputId,
														)
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
												<UploadIcon
													aria-hidden
													className="size-10 text-muted-foreground"
												/>
												<div>
													<p className="font-medium">
														{t(
															"fileExplorer.overlay.dropzone.dragAndDrop",
														)}
													</p>
													<p className="text-muted-foreground text-sm">
														{t(
															"fileExplorer.overlay.dropzone.orClickToBrowse",
														)}
													</p>
												</div>
											</div>
										</div>
										{data.files.length > 0 && (
											<div className="mt-2 space-y-1">
												<Muted className="font-medium text-xs">
													{t(
														"fileExplorer.overlay.files.selectedCount",
														{
															count: data.files
																.length,
														},
													)}
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
																		{
																			file.name
																		}
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
																			title={t(
																				"fileExplorer.overlay.files.unzipTitle",
																			)}
																			className="cursor-pointer"
																		/>
																		<span className="text-muted-foreground text-xs hover:text-foreground">
																			{t(
																				"fileExplorer.overlay.files.unzip",
																			)}
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
								{data.action !== "upload" && (
									<Field>
										<FieldLabel>
											{data.action === "add_file"
												? t(
														"fileExplorer.overlay.fields.fileName",
													)
												: t(
														"fileExplorer.overlay.fields.directoryName",
													)}
										</FieldLabel>
										<Input
											data-testid="new-file-overlay-name-input"
											placeholder={
												data.action === "add_file"
													? t(
															"fileExplorer.overlay.placeholders.fileName",
														)
													: t(
															"fileExplorer.overlay.placeholders.directoryName",
														)
											}
											value={data.name}
											onChange={(e) =>
												setData((previous) =>
													previous &&
													previous.action !== "upload"
														? {
																action: previous.action,
																name: e.target
																	.value,
															}
														: previous,
												)
											}
											autoFocus
										/>
									</Field>
								)}
								<Field>
									<FieldLabel htmlFor={destinationInputId}>
										{t(
											"fileExplorer.overlay.fields.location",
										)}
									</FieldLabel>
									<Input
										id={destinationInputId}
										data-testid="new-file-overlay-location-input"
										placeholder={t(
											"fileExplorer.overlay.placeholders.location",
										)}
										value={destination}
										onChange={(e) =>
											setDestination(e.target.value)
										}
									/>
								</Field>
							</FieldGroup>
						</FieldSet>
					</form>
				)}

				<DialogFooter>
					{data && !action && (
						<Button
							variant="ghost"
							disabled={isLoading}
							className="me-auto"
							onClick={() => back()}
						>
							<ChevronLeftIcon />
							{t("fileExplorer.overlay.buttons.back")}
						</Button>
					)}
					<Button
						variant="ghost"
						disabled={isLoading}
						onClick={() => cancel()}
					>
						{t("fileExplorer.overlay.buttons.cancel")}
					</Button>
					{data && (
						<Button
							variant="default"
							disabled={isDisabled}
							onClick={() => submitForm()}
						>
							{isLoading ? (
								<Spinner />
							) : data.action === "upload" ? (
								t("fileExplorer.overlay.buttons.upload")
							) : (
								t("fileExplorer.overlay.buttons.create")
							)}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
