import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Download,
	Plus,
	Search,
	Trash2,
	Upload,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	H4,
	Input,
	P,
	Progress,
	Skeleton,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { uploadFile } from "@/api";
import { usePixel, useRootStore } from "@/hooks";

interface FileTableProps {
	/**
	 * Id of the vector engine
	 */
	id: string;
}

type FileUploadForm = {
	PROJECT_UPLOAD: File[];
};

interface FileExplorerProps {
	fileName: string;
	fileSize: number;
	lastModified: string;
}

interface EmbeddingFileResult {
	fileName: string;
	status: "SUCCESS" | "FAILED";
	insertedRecords: number;
	failedRecords: number;
	totalRecords: number;
	error?: {
		errorMessage: string;
		techErrorMessage: string;
	};
}

type PixelReturnLike = {
	output?: string | unknown;
	operationType?: string[];
	additionalOutput?: Array<{
		output?: EmbeddingFileResult[] | string | unknown;
		operationType?: string[];
	}>;
};

/**
 * FileTable component manages files within a Vector Database.
 * Supports file upload, embedding, deletion, download, search, and pagination.
 * Files are embedded into the vector database for semantic search capabilities.
 */
export const FileTable = (props: FileTableProps) => {
	const NUM_RESULTS_PER_PAGE = 5;

	const [open, setOpen] = useState<boolean>(false);
	const [deleteFileModal, setDeleteFileModal] = useState<boolean>(false);
	const [fileToDelete, setFileToDelete] = useState<FileExplorerProps | null>(
		null,
	);
	const [deleteFilesModal, setDeleteFilesModal] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selectedFiles, setSelectedFiles] = useState<FileExplorerProps[]>([]);
	const [filePage, setFilePage] = useState<number>(1);
	const [filteredFileCount, setFilteredFileCount] = useState<number>(0);
	const fileSearchRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const didMount = useRef<boolean>(false);
	const { monolithStore, configStore } = useRootStore();
	const [exportLoading, setExportLoading] = useState(false);

	// newly added state
	const [embeddingResults, setEmbeddingResults] = useState<
		EmbeddingFileResult[]
	>([]);
	const [showEmbeddingResults, setShowEmbeddingResults] =
		useState<boolean>(false);
	const [isEmbeddingResultsCollapsed, setIsEmbeddingResultsCollapsed] =
		useState<boolean>(false);
	const [expandedErrors, setExpandedErrors] = useState<Set<string>>(
		new Set(),
	);
	const [uploadedFileSizes, setUploadedFileSizes] = useState<
		Record<string, number>
	>({});
	const [uploadProgress, setUploadProgress] = useState<number>(0);

	const [order, setOrder] = useState<"asc" | "desc">("asc");
	const [orderBy, setOrderBy] = useState<string>("name");
	const headCell = [
		{
			id: "name",
			numeric: false,
			disablePadding: true,
			label: "Name",
		},
		{
			id: "date",
			numeric: true,
			disablePadding: false,
			label: "Date Uploaded",
		},
		{
			id: "size",
			numeric: true,
			disablePadding: false,
			label: "Size",
		},
	];

	const { id } = props;

	/**
	 * Helper function to format file names for Pixel query syntax.
	 * Converts array of files into comma-separated quoted strings.
	 * Example: ['file1.pdf', 'file2.txt'] -> '"file1.pdf", "file2.txt"'
	 */
	const buildFileArrayString = (files: FileExplorerProps[]): string => {
		return files
			.map((file, index) =>
				index + 1 === files.length
					? `"${file.fileName}"`
					: `"${file.fileName}", `,
			)
			.join("");
	};

	/**
	 * Format raw byte count into a human-readable size string.
	 * Supports B, KB, MB, GB, TB.
	 */
	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		if (bytes < 1024 * 1024 * 1024)
			return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		if (bytes < 1024 * 1024 * 1024 * 1024)
			return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
		return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`;
	};

	const { control, watch, setValue, handleSubmit } = useForm<{
		FILES: FileExplorerProps[];
		PROJECT_UPLOAD: File[];
		SEARCH_FILTER: string;
	}>({
		defaultValues: {
			FILES: [],
			SEARCH_FILTER: "",
			PROJECT_UPLOAD: [],
		},
	});

	const searchFilter = watch("SEARCH_FILTER");
	const verifiedFiles = watch("FILES");

	// Fetch all files from the vector database
	const getFileDetails = usePixel<FileExplorerProps[]>(`
        ListDocumentsInVectorDatabase(engine="${id}")
    `);

	/**
	 * Effect to filter and sort files based on search term.
	 * Runs whenever files are fetched or search filter changes.
	 * Focuses search input after rendering for better UX.
	 */
	useEffect(() => {
		if (getFileDetails.status !== "SUCCESS" || !getFileDetails.data) {
			return;
		}

		const filteredFiles = getFileDetails.data.filter((file) =>
			file.fileName.toLowerCase().includes(searchFilter.toLowerCase()),
		);

		filteredFiles.sort(
			(a, b) =>
				new Date(a.lastModified).getTime() -
				new Date(b.lastModified).getTime(),
		);

		setValue("FILES", filteredFiles);

		// Track initial mount to prevent unnecessary state updates
		if (!didMount.current) {
			didMount.current = true;
		}

		// Update pagination based on filtered results
		setFilteredFileCount(filteredFiles.length);
		fileSearchRef.current?.focus();
	}, [getFileDetails.status, getFileDetails.data, searchFilter, setValue]);

	/**
	 * Simulates incremental progress on the upload progress bar while isLoading
	 * is active. Advances in random steps up to 90%, then resets when done.
	 */
	useEffect(() => {
		if (!isLoading) {
			setUploadProgress(0);
			return;
		}
		setUploadProgress(10);
		const interval = setInterval(() => {
			setUploadProgress((prev) => {
				if (prev >= 90) {
					clearInterval(interval);
					return 90;
				}
				return Math.min(90, prev + Math.random() * 12);
			});
		}, 500);
		return () => clearInterval(interval);
	}, [isLoading]);

	const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	/**
	 * Handle drag and drop file upload.
	 * Validates file types to ensure only supported formats are accepted.
	 * Supported formats: PDF, CSV, TXT, DOC/X, PPT/X, JSON, XML, EML, MSG
	 */
	const handleDrop = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (isLoading) return;
		const droppedFiles = Array.from(e.dataTransfer.files);
		const validFiles = droppedFiles.filter((file) => {
			const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
			return [
				".pdf",
				".csv",
				".txt",
				".doc",
				".ppt",
				".docx",
				".pptx",
				".json",
				".xml",
				".eml",
				".msg",
			].includes(extension);
		});
		setValue("PROJECT_UPLOAD", validFiles);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (isLoading) return;
		if (e.target.files) {
			setValue("PROJECT_UPLOAD", Array.from(e.target.files));
		}
	};

	// newly added helpers
	const normalizePixelReturn = async (
		query: string,
	): Promise<PixelReturnLike> => {
		try {
			const response = await monolithStore.runQuery(query);
			return response?.pixelReturn?.[0] ?? {};
		} catch (queryError: unknown) {
			const error = queryError as Record<string, unknown>;
			const pixelReturn = error?.pixelReturn;

			if (
				Array.isArray(pixelReturn) &&
				pixelReturn.length > 0 &&
				pixelReturn[0]
			) {
				return pixelReturn[0] as PixelReturnLike;
			}

			if (
				error?.additionalOutput !== undefined ||
				error?.output !== undefined ||
				error?.operationType !== undefined
			) {
				return error as PixelReturnLike;
			}

			throw queryError;
		}
	};

	const refreshFilesSafely = () => {
		setTimeout(() => {
			getFileDetails.refresh();
		}, 50);
	};

	const runEmbeddingQuery = async (filePaths: string[]) => {
		return normalizePixelReturn(`
      CreateEmbeddingsFromDocuments(
        engine="${id}",
        filePaths=[${filePaths.map((path) => `"${path}"`).join(", ")}]
      )
    `);
	};

	const getEmbeddingResults = (pixelReturn: PixelReturnLike) => {
		const results = pixelReturn.additionalOutput?.[0]?.output;
		return Array.isArray(results)
			? (results as EmbeddingFileResult[])
			: null;
	};

	const showEmbeddingToast = (results: EmbeddingFileResult[]) => {
		const successCount = results.filter(
			(r) => r.status === "SUCCESS",
		).length;
		const failCount = results.length - successCount;

		if (failCount === 0) {
			toast.success(`Successfully embedded ${successCount} document(s)`);
		} else if (successCount === 0) {
			toast.error(
				`All ${failCount} document(s) failed to embed — see details below`,
			);
		} else {
			toast.warning(
				`${successCount} embedded successfully, ${failCount} failed — see details below`,
			);
		}
	};

	const applyEmbeddingResults = (results: EmbeddingFileResult[]) => {
		setEmbeddingResults((prev) => [...prev, ...results]);
		setShowEmbeddingResults(true);
		setIsEmbeddingResultsCollapsed(false);
		setExpandedErrors(new Set());
		showEmbeddingToast(results);
	};

	const handleEmbeddingResponse = (
		pixelReturn: PixelReturnLike,
		fallbackSuccessMessage: string,
	) => {
		const results = getEmbeddingResults(pixelReturn);

		if (results) {
			applyEmbeddingResults(results);
			return;
		}

		const { output, operationType } = pixelReturn;
		if (operationType?.indexOf("ERROR") === -1) {
			toast.success(fallbackSuccessMessage);
		} else {
			toast.error(String(output));
		}
	};

	const toggleErrorExpand = (fileName: string) => {
		setExpandedErrors((prev) => {
			const next = new Set(prev);
			next.has(fileName) ? next.delete(fileName) : next.add(fileName);
			return next;
		});
	};

	/**
	 * Upload and embed files into the vector database.
	 * Steps: 1) Upload files to server, 2) Create embeddings from uploaded documents
	 * This enables semantic search across the file contents.
	 */
	const embedFile = handleSubmit(async (data: FileUploadForm) => {
		setIsLoading(true);

		// Capture file sizes from the File objects before they are cleared
		const sizeMap: Record<string, number> = {};
		data.PROJECT_UPLOAD.forEach((file) => {
			sizeMap[file.name] = file.size;
		});
		setUploadedFileSizes((prev) => ({ ...prev, ...sizeMap }));

		try {
			// Upload files to the server first
			const upload = await uploadFile(
				data.PROJECT_UPLOAD,
				configStore.store.insightID,
			);

			const pixelReturn = await runEmbeddingQuery(
				upload.map((file) => file.fileLocation),
			);

			handleEmbeddingResponse(pixelReturn, "Successfully added document");
			setValue("PROJECT_UPLOAD", []);
			setOpen(false);
			setIsLoading(false);
			refreshFilesSafely();
		} catch (e) {
			toast.error(String(e));
			setIsLoading(false);
		}
	});

	/**
	 * Delete a single file from the vector database.
	 * This removes both the file metadata and its embeddings.
	 */
	const deleteFile = async (file: FileExplorerProps) => {
		const { fileName } = file;
		setIsLoading(true);
		try {
			const response = await monolithStore.runQuery(`
            RemoveDocumentFromVectorDatabase(engine = "${id}", fileNames=["${fileName}"])
            `);

			const { output, operationType } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") === -1) {
				toast.success("Successfully removed document");
			} else {
				toast.error(String(output));
			}
		} catch (e) {
			toast.warning(String(e));
		} finally {
			getFileDetails.refresh();
			setIsLoading(false);
			setDeleteFileModal(false);
		}
	};

	/**
	 * Delete multiple selected files from the vector database.
	 * Batch operation for efficiency when removing multiple files.
	 */
	const deleteSelectedFiles = async (files: FileExplorerProps[]) => {
		setIsLoading(true);
		const fileArray = buildFileArrayString(files);

		try {
			const response = await monolithStore.runQuery(`
                RemoveDocumentFromVectorDatabase(engine = "${id}", fileNames=[${fileArray}])
            `);

			const { output, operationType } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") === -1) {
				toast.success("Successfully removed document");
			} else {
				toast.error(String(output));
			}
		} catch (e) {
			toast.warning(String(e));
		} finally {
			getFileDetails.refresh();
			setIsLoading(false);
			setFileToDelete(null);
			setDeleteFilesModal(false);
		}
	};

	/**
	 * Download selected files from the vector database.
	 * Initiates a download of the original files (not embeddings).
	 */
	const downloadSelectedFiles = async (files: FileExplorerProps[]) => {
		setExportLoading(true);
		const fileArray = buildFileArrayString(files);
		const pixel = `META | VectorFileDownload(engine = "${id}", fileNames=[${fileArray}]);`;

		try {
			const response = await monolithStore.runQuery(pixel);
			const { output } = response.pixelReturn[0];
			const { insightId } = response;
			monolithStore.download(insightId, String(output));
		} finally {
			setExportLoading(false);
		}
	};

	/**
	 * Create sort handler for table columns.
	 * Toggles between ascending and descending order.
	 * Supports sorting by name, size, and date.
	 */
	const createSortHandler = (property: string) => () => {
		const isAsc = order === "asc";
		const newOrder = isAsc ? "desc" : "asc";
		setOrder(newOrder);
		setOrderBy(property);

		const sortedFiles = [...verifiedFiles].sort((a, b) => {
			if (property === "name") {
				return newOrder === "asc"
					? a.fileName.localeCompare(b.fileName)
					: b.fileName.localeCompare(a.fileName);
			}
			if (property === "size") {
				return newOrder === "asc"
					? a.fileSize - b.fileSize
					: b.fileSize - a.fileSize;
			}
			if (property === "date") {
				return newOrder === "asc"
					? new Date(a.lastModified).getTime() -
							new Date(b.lastModified).getTime()
					: new Date(b.lastModified).getTime() -
							new Date(a.lastModified).getTime();
			}
			return 0;
		});
		setValue("FILES", sortedFiles);
	};

	const renderLoadingRows = () => {
		return Array.from({ length: NUM_RESULTS_PER_PAGE }, () => (
			<TableRow key={`skeleton-${crypto.randomUUID()}`}>
				<TableCell>
					<Skeleton className="h-4 w-4" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[200px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-[120px]" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-4 w-20" />
				</TableCell>
				<TableCell>
					<Skeleton className="h-8 w-8" />
				</TableCell>
			</TableRow>
		));
	};

	/**
	 * Render empty state when no files match the current filter.
	 */
	const renderEmptyState = () => {
		const isFiltered = searchFilter.length > 0;
		return (
			<TableRow>
				<TableCell colSpan={5} className="h-[200px]">
					<div className="flex flex-col items-center justify-center gap-2 text-center">
						<Upload className="h-12 w-12 text-muted-foreground" />
						<P className="font-medium text-foreground">
							{isFiltered
								? "No files match your search"
								: "No files uploaded yet"}
						</P>
						<P className="text-muted-foreground text-sm">
							{isFiltered
								? "Try adjusting your search terms"
								: "Upload your first document to get started"}
						</P>
						{!isFiltered && (
							<Button
								onClick={() => setOpen(true)}
								size="sm"
								className="mt-2"
							>
								<Plus className="size-4" />
								Embed New Document
							</Button>
						)}
					</div>
				</TableCell>
			</TableRow>
		);
	};

	const successResults = embeddingResults.filter(
		(r) => r.status === "SUCCESS",
	);
	const failedResults = embeddingResults.filter((r) => r.status === "FAILED");

	return (
		<div className="flex w-full shrink-0 flex-col items-start justify-between gap-6">
			{showEmbeddingResults && embeddingResults.length > 0 && (
				<div
					className="w-full rounded-xl border border-border bg-background shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]"
					data-testid="embedding-results-panel"
				>
					<div className="flex items-center justify-between border-border border-b px-4 py-3">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setIsEmbeddingResultsCollapsed(
										(prev) => !prev,
									)
								}
								className="h-8 gap-2 px-2 text-foreground"
								data-testid="embedding-results-toggle"
							>
								{isEmbeddingResultsCollapsed ? (
									<ChevronDown className="size-4" />
								) : (
									<ChevronUp className="size-4" />
								)}
								<H4>Embedding Results</H4>
							</Button>

							{successResults.length > 0 && (
								<span
									className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 font-medium text-foreground text-xs"
									data-testid="embedding-results-success-badge"
								>
									<CheckCircle2 className="size-3 text-success" />
									{successResults.length} Succeeded
								</span>
							)}

							{failedResults.length > 0 && (
								<span
									className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 font-medium text-foreground text-xs"
									data-testid="embedding-results-failed-badge"
								>
									<AlertCircle className="size-3 text-destructive" />
									{failedResults.length} Failed
								</span>
							)}
						</div>

						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setShowEmbeddingResults(false)}
								className="size-8 shrink-0"
								aria-label="Dismiss embedding results"
								data-testid="embedding-results-close"
							>
								<X className="size-4" />
							</Button>
						</div>
					</div>

					{!isEmbeddingResultsCollapsed && (
						<div className="max-h-60 divide-y divide-border overflow-y-auto">
							{embeddingResults.map((result) => {
								const isFailed = result.status === "FAILED";
								const isExpanded = expandedErrors.has(
									result.fileName,
								);
								return (
									<div
										key={result.fileName}
										className="px-4 py-3"
										data-testid={`embedding-result-row-${result.fileName}`}
									>
										<div className="flex items-center justify-between gap-3">
											<div className="flex min-w-0 flex-1 items-center gap-2.5">
												{isFailed ? (
													<AlertCircle className="size-4 shrink-0 text-destructive" />
												) : (
													<CheckCircle2 className="size-4 shrink-0 text-success" />
												)}
												<span
													className="truncate font-medium text-foreground text-sm"
													title={result.fileName}
												>
													{result.fileName}
												</span>
											</div>

											<div className="flex shrink-0 items-center gap-2">
												{uploadedFileSizes[
													result.fileName
												] !== undefined && (
													<span className="text-muted-foreground text-xs">
														{formatFileSize(
															uploadedFileSizes[
																result.fileName
															],
														)}
													</span>
												)}
												{!isFailed ? (
													<span className="text-muted-foreground text-xs">
														{result.insertedRecords}{" "}
														{result.insertedRecords ===
														1
															? "record"
															: "records"}{" "}
														inserted
													</span>
												) : (
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															toggleErrorExpand(
																result.fileName,
															)
														}
														className="h-7 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
														data-testid={`embedding-result-details-${result.fileName}`}
													>
														Details
														{isExpanded ? (
															<ChevronUp className="size-3" />
														) : (
															<ChevronDown className="size-3" />
														)}
													</Button>
												)}
											</div>
										</div>

										{isFailed &&
											isExpanded &&
											result.error && (
												<div
													className="mt-2.5 ml-[26px] rounded-md border border-border bg-secondary p-3"
													data-testid={`embedding-result-error-${result.fileName}`}
												>
													<P className="mb-1.5 font-semibold text-destructive text-xs">
														{
															result.error
																.errorMessage
														}
													</P>
													<P className="break-all font-mono text-muted-foreground text-xs leading-relaxed">
														{
															result.error
																.techErrorMessage
														}
													</P>
												</div>
											)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			<div className="w-full rounded-xl bg-background shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
				<div className="flex flex-wrap items-center justify-between gap-y-2 self-stretch bg-background shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.12)_inset]">
					<div className="flex items-center gap-2.5 px-4 py-3">
						<H4>Files</H4>
					</div>

					<div className="flex flex-wrap items-center gap-2 px-4 pb-2 sm:pb-0">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
							<Input
								ref={fileSearchRef}
								placeholder="Search Files"
								className="h-9 w-[140px] pl-9 sm:w-[200px]"
								value={searchFilter}
								onChange={(e) => {
									setValue("SEARCH_FILTER", e.target.value);
								}}
								data-testid="file-search"
							/>
						</div>
						{selectedFiles.length > 0 && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setDeleteFilesModal(true)}
								data-testid="delete-files-btn"
								className="text-destructive hover:text-destructive"
							>
								Delete Selected
							</Button>
						)}
						{selectedFiles.length > 0 && (
							<Button
								disabled={exportLoading}
								variant="outline"
								size="sm"
								onClick={() =>
									downloadSelectedFiles(selectedFiles)
								}
								data-testid="download-files-btn"
							>
								{exportLoading ? (
									<Spinner className="size-4" />
								) : (
									<Download className="size-4" />
								)}
								Download
							</Button>
						)}
						<Button
							onClick={() => setOpen(true)}
							size="sm"
							data-testid="embed-new-document-btn"
						>
							<Plus className="size-4" />
							<span className="hidden sm:inline">
								Embed New Document
							</span>
							<span className="sm:hidden">Embed</span>
						</Button>
					</div>
				</div>

				<div className="overflow-x-auto">
					<Table className="bg-background">
						<TableHeader>
							<TableRow>
								<TableHead className="w-12">
									<Checkbox
										checked={
											selectedFiles.length ===
												verifiedFiles.length &&
											verifiedFiles.length > 0
										}
										onCheckedChange={() => {
											if (
												selectedFiles.length !==
												verifiedFiles.length
											) {
												setSelectedFiles(verifiedFiles);
											} else {
												setSelectedFiles([]);
											}
										}}
										data-testid="files-checkbox"
									/>
								</TableHead>

								{headCell.map((cell) => (
									<TableHead key={cell.id}>
										<Button
											variant="ghost"
											size="sm"
											onClick={createSortHandler(cell.id)}
											className="h-8 gap-1"
											data-testid={`sort-${cell.id}`}
										>
											{cell.label}
											{orderBy === cell.id &&
												(order === "asc" ? " ↑" : " ↓")}
										</Button>
									</TableHead>
								))}

								<TableHead>Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{getFileDetails.status === "LOADING"
								? renderLoadingRows()
								: verifiedFiles.length === 0
									? renderEmptyState()
									: verifiedFiles.map((_x, i) => {
											if (
												i >=
													filePage *
														NUM_RESULTS_PER_PAGE -
														NUM_RESULTS_PER_PAGE &&
												i <
													filePage *
														NUM_RESULTS_PER_PAGE
											) {
												const file = verifiedFiles[i];
												if (!file) return null;

												const isSelected =
													selectedFiles.some(
														(v) =>
															v.fileName ===
															file.fileName,
													);

												return (
													<TableRow
														key={`${file.fileName}-${i}`}
													>
														<TableCell>
															<Checkbox
																checked={
																	isSelected
																}
																onCheckedChange={() => {
																	if (
																		isSelected
																	) {
																		setSelectedFiles(
																			selectedFiles.filter(
																				(
																					u,
																				) =>
																					u.fileName !==
																					file.fileName,
																			),
																		);
																	} else {
																		setSelectedFiles(
																			[
																				...selectedFiles,
																				file,
																			],
																		);
																	}
																}}
																data-testid={`file-checkbox-${file.fileName}`}
															/>
														</TableCell>
														<TableCell>
															{file.fileName}
														</TableCell>
														<TableCell>
															{file.lastModified}
														</TableCell>
														<TableCell>
															{formatFileSize(
																file.fileSize *
																	1024,
															)}
														</TableCell>
														<TableCell>
															<Button
																variant="ghost"
																size="icon"
																onClick={() => {
																	setDeleteFileModal(
																		true,
																	);
																	setFileToDelete(
																		file,
																	);
																}}
																data-testid={`delete-file-${file.fileName}`}
															>
																<Trash2 className="size-4" />
															</Button>
														</TableCell>
													</TableRow>
												);
											}
											return null;
										})}
						</TableBody>
						<TableFooter>
							<TableRow>
								<TableCell colSpan={5}>
									<div className="flex items-center justify-end gap-4 px-2">
										<div
											className="text-muted-foreground text-sm"
											data-testid="pagination-summary"
										>
											{(filePage - 1) *
												NUM_RESULTS_PER_PAGE +
												1}
											-
											{Math.min(
												filePage * NUM_RESULTS_PER_PAGE,
												filteredFileCount,
											)}{" "}
											of {filteredFileCount}
										</div>
										<div className="flex gap-1">
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() => setFilePage(1)}
												disabled={filePage === 1}
												data-testid="pagination-first"
											>
												{"<<"}
											</Button>
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() =>
													setFilePage(
														Math.max(
															1,
															filePage - 1,
														),
													)
												}
												disabled={filePage === 1}
												data-testid="pagination-prev"
											>
												{"<"}
											</Button>
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() =>
													setFilePage(
														Math.min(
															Math.ceil(
																filteredFileCount /
																	NUM_RESULTS_PER_PAGE,
															),
															filePage + 1,
														),
													)
												}
												disabled={
													filePage >=
													Math.ceil(
														filteredFileCount /
															NUM_RESULTS_PER_PAGE,
													)
												}
												data-testid="pagination-next"
											>
												{">"}
											</Button>
											<Button
												variant="outline"
												size="icon-sm"
												onClick={() =>
													setFilePage(
														Math.ceil(
															filteredFileCount /
																NUM_RESULTS_PER_PAGE,
														),
													)
												}
												disabled={
													filePage >=
													Math.ceil(
														filteredFileCount /
															NUM_RESULTS_PER_PAGE,
													)
												}
												data-testid="pagination-last"
											>
												{">>"}
											</Button>
										</div>
									</div>
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</div>
			</div>

			<Dialog
				open={open}
				onOpenChange={(value) => {
					if (!isLoading) setOpen(value);
				}}
			>
				<DialogContent
					className="w-full max-w-[600px] border-border bg-background"
					data-testid="file-upload-modal"
				>
					<div className="flex h-full w-full flex-col gap-4">
						<H4>Upload Files</H4>
						<Controller
							name="PROJECT_UPLOAD"
							control={control}
							rules={{}}
							render={({ field }) => {
								return (
									<button
										type="button"
										disabled={isLoading}
										className="flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input border-dashed bg-secondary px-6 py-8 text-center transition-colors hover:border-primary hover:bg-accent"
										onClick={() =>
											fileInputRef.current?.click()
										}
										onDragOver={handleDragOver}
										onDrop={handleDrop}
										data-testid="upload-dropzone"
									>
										<input
											ref={fileInputRef}
											type="file"
											accept=".pdf,.csv,.txt,.doc,.ppt,.docx,.pptx,.json,.xml,.eml,.msg"
											className="hidden"
											onChange={handleFileChange}
											multiple={true}
										/>
										{field.value &&
										field.value.length > 0 ? (
											<div className="flex w-full max-w-[420px] flex-col items-center justify-center gap-2">
												<Upload className="h-12 w-12 text-muted-foreground" />
												<P className="font-medium text-foreground">
													{field.value.length} file
													{field.value.length > 1
														? "s"
														: ""}{" "}
													selected
												</P>
												<P className="break-words text-center text-muted-foreground text-sm">
													{field.value
														.map((f) => f.name)
														.join(", ")}
												</P>
												<P className="mt-1 text-muted-foreground text-sm">
													Click or drag to replace
												</P>
											</div>
										) : (
											<div className="flex w-full max-w-[420px] flex-col items-center justify-center gap-3">
												<div className="flex h-14 w-14 items-center justify-center rounded-full bg-background">
													<Upload className="h-8 w-8 text-muted-foreground" />
												</div>
												<div className="flex flex-col items-center gap-1 text-center">
													<P className="font-medium text-foreground">
														Drop your files here or
														click to browse
													</P>
													<P className="text-muted-foreground text-sm">
														Supports PDF, CSV, TXT,
														DOC, PPT, DOCX, PPTX,
														JSON, XML, EML, MSG
													</P>
												</div>
											</div>
										)}
									</button>
								);
							}}
						/>
						<div className="flex flex-row justify-end gap-2">
							<Button
								size="sm"
								variant="ghost"
								disabled={isLoading}
								onClick={() => setOpen(false)}
								data-testid="upload-modal-close-btn"
							>
								Close
							</Button>
							<Button
								size="sm"
								variant="default"
								disabled={
									isLoading ||
									watch("PROJECT_UPLOAD").length === 0
								}
								onClick={embedFile}
								data-testid="upload-modal-embed-btn"
							>
								{isLoading && <Spinner className="size-4" />}
								Embed
							</Button>
						</div>
						{isLoading && (
							<div className="mt-2" data-testid="upload-progress">
								<Progress value={uploadProgress} />
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Single File Modal */}
			<Dialog open={deleteFileModal} onOpenChange={setDeleteFileModal}>
				<DialogContent className="max-w-md border-border bg-background">
					<div className="flex flex-col gap-4">
						<H4>Are you sure?</H4>
						{fileToDelete && (
							<P>
								This will remove <b>{fileToDelete.fileName}</b>
							</P>
						)}
						<div className="flex justify-end gap-2">
							<Button
								variant="ghost"
								onClick={() => setDeleteFileModal(false)}
								data-testid="delete-file-close-btn"
							>
								Close
							</Button>
							<Button
								variant="destructive"
								onClick={() => {
									if (!fileToDelete) {
										console.error("No file to delete");
										return;
									}
									deleteFile(fileToDelete);
								}}
								disabled={isLoading}
								data-testid="delete-file-confirm-btn"
							>
								{isLoading && <Spinner className="size-4" />}
								Confirm
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Multiple Files Modal */}
			<Dialog open={deleteFilesModal} onOpenChange={setDeleteFilesModal}>
				<DialogContent className="max-w-md border-border bg-background">
					<div className="flex flex-col gap-4">
						<H4>Are you sure?</H4>
						<P>Would you like to delete all selected files?</P>
						<div className="flex justify-end gap-2">
							<Button
								variant="ghost"
								onClick={() => setDeleteFilesModal(false)}
								data-testid="delete-files-close-btn"
							>
								Close
							</Button>
							<Button
								variant="destructive"
								disabled={isLoading}
								onClick={() =>
									deleteSelectedFiles(selectedFiles)
								}
								data-testid="delete-files-confirm-btn"
							>
								{isLoading && <Spinner className="size-4" />}
								Confirm
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};
