/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { FileUploadOutlined } from "@mui/icons-material";
import { Download, Plus, Search, Trash2 } from "lucide-react";
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

export const FileTable = (props: FileTableProps) => {
	const NUM_RESULTS_PER_PAGE = 5;
	// embed modal
	const [open, setOpen] = useState<boolean>(false);

	//delete one file
	const [deleteFileModal, setDeleteFileModal] = useState<boolean>(false);
	const [fileToDelete, setFileToDelete] = useState<FileExplorerProps | null>(
		null,
	);
	//deleting multiple files modal
	const [deleteFilesModal, setDeleteFilesModal] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selectedFiles, setSelectedFiles] = useState<FileExplorerProps[]>([]);
	const [filePage, setFilePage] = useState<number>(1);
	const [fileCount, setFileCount] = useState<number>(0);
	const [filteredFileCount, setFilteredFileCount] = useState<number>(0);
	const fileSearchRef = useRef<HTMLInputElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const didMount = useRef<boolean>(false);
	const { monolithStore, configStore } = useRootStore();

	//download multiple files modal
	const [exportLoading, setExportLoading] = useState(false);

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

	//grabbing ID out of props
	const { id } = props;

	//for the pagination of the files page
	const paginationOptions = {
		filePageCounts: [NUM_RESULTS_PER_PAGE],
	};

	//adjusting for instance where there are more than 10 files
	fileCount > 9 && paginationOptions.filePageCounts.push(10);

	//For filtering files
	const { control, watch, setValue, handleSubmit } = useForm<{
		FILES: FileExplorerProps[];
		PROJECT_UPLOAD: File[];
		SEARCH_FILTER: string;
	}>({
		defaultValues: {
			// Files Table
			FILES: [],
			// Filters for Files table
			SEARCH_FILTER: "",
			PROJECT_UPLOAD: [],
		},
	});

	const searchFilter = watch("SEARCH_FILTER");
	const verifiedFiles = watch("FILES");

	//Grabbing list of files in a Vector Database
	const getFileDetails = usePixel<FileExplorerProps[]>(`
        ListDocumentsInVectorDatabase(engine="${id}")
    `);
	//updating the file details list
	/**
	 * @name useEffect
	 * @desc - sets files in react hook form
	 */
	useEffect(() => {
		if (getFileDetails.status !== "SUCCESS" || !getFileDetails.data) {
			return;
		}

		const files = [];
		// push files into file array
		getFileDetails.data.forEach((file) => {
			files.push(file);
		});

		//filter using search term
		const filteredFiles = files.filter((file) =>
			file.fileName.toLowerCase().includes(searchFilter.toLowerCase()),
		);

		filteredFiles.sort(
			(a, b) =>
				new Date(a.lastModified).getTime() -
				new Date(b.lastModified).getTime(),
		);

		setValue("FILES", filteredFiles);

		if (!didMount.current) {
			// set total members
			setFileCount(getFileDetails.data.length);
			didMount.current = true;
		}
		// Needed for total pages on pagination
		setFilteredFileCount(filteredFiles.length);

		fileSearchRef.current?.focus();
		return () => {
			console.log("Cleaning files table");
			setValue("FILES", []);
			setSelectedFiles([]);
		};
	}, [getFileDetails.status, getFileDetails.data, searchFilter]);

	// File upload handlers
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
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
			].includes(extension);
		});
		setValue("PROJECT_UPLOAD", validFiles);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setValue("PROJECT_UPLOAD", Array.from(e.target.files));
		}
	};

	//Method that is called for embedding a file
	const embedFile = handleSubmit(async (data: FileUploadForm) => {
		setIsLoading(true);

		//string that will become the filePaths
		let fileLocations = "";

		try {
			//upload the file
			const upload = await uploadFile(
				data.PROJECT_UPLOAD,
				configStore.store.insightID,
			);

			upload.forEach((file, index) => {
				const { fileLocation } = file;
				if (index + 1 === upload.length) {
					//last member
					fileLocations = fileLocations += `"${fileLocation}"`;
				} else {
					//all other members
					fileLocations = fileLocations += `"${fileLocation}", `;
				}
			});

			// Embedding the File
			const response = await monolithStore.runQuery(`
                CreateEmbeddingsFromDocuments( engine= "${id}", filePaths= [${fileLocations}])
            `);

			const { output, operationType } = response.pixelReturn[0];

			if (operationType.indexOf("ERROR") === -1) {
				toast.success("Successfully added document");
			} else {
				toast.error(String(output));
			}
		} catch (e) {
			toast.error(String(e));
		} finally {
			//turn off loading
			getFileDetails.refresh();
			setIsLoading(false);
			setValue("PROJECT_UPLOAD", []);
			setOpen(false);
		}
	});

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

	const deleteSelectedFiles = async (files: FileExplorerProps[]) => {
		// construct the string of files
		setIsLoading(true);
		let fileArray = "";
		files.forEach((file, index) => {
			const { fileName } = file;
			if (index + 1 === files.length) {
				//structuring the last element
				fileArray = `${fileArray}"${fileName}"`;
			} else {
				// all but the last element
				fileArray = `${fileArray}"${fileName}", `;
			}
		});

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
			//refresh files list, null the file to Delete, and close modal
			getFileDetails.refresh();
			setIsLoading(false);
			setFileToDelete(null);
			setDeleteFilesModal(false);
		}
	};

	const downloadSelectedFiles = async (files: FileExplorerProps[]) => {
		// construct the string of files
		setExportLoading(true);
		let fileArray = "";
		files.forEach((file, index) => {
			const { fileName } = file;
			if (index + 1 === files.length) {
				//structuring the last element
				fileArray = `${fileArray}"${fileName}"`;
			} else {
				// all but the last element
				fileArray = `${fileArray}"${fileName}", `;
			}
		});

		const pixel = `META | VectorFileDownload(engine = "${id}", fileNames=[${fileArray}]);`;

		monolithStore.runQuery(pixel).then((response) => {
			const output = response.pixelReturn[0].output,
				insightId = response.insightId;

			monolithStore.download(insightId, String(output));
		});
		setExportLoading(false);
	};

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

	return (
		<div className="flex w-full shrink-0 flex-col items-start justify-between gap-[25px]">
			<div className="w-full rounded-xl shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
				<div className="flex items-center justify-between self-stretch bg-background shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.12)_inset]">
					<div className="flex items-center gap-2.5 px-4 py-3">
						<H4>Files</H4>
					</div>

					<div className="flex items-center gap-2 px-4">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
							<Input
								ref={fileSearchRef}
								placeholder="Search Files"
								className="h-9 w-[200px] pl-9"
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
							Embed New Document
						</Button>
					</div>
				</div>

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
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									onClick={createSortHandler(headCell[0].id)}
									className="h-8 gap-1"
								>
									Name
									{orderBy === headCell[0].id &&
										(order === "asc" ? " ↑" : " ↓")}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									onClick={createSortHandler(headCell[1].id)}
									className="h-8 gap-1"
								>
									Date Uploaded
									{orderBy === headCell[1].id &&
										(order === "asc" ? " ↑" : " ↓")}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									onClick={createSortHandler(headCell[2].id)}
									className="h-8 gap-1"
								>
									Size
									{orderBy === headCell[2].id &&
										(order === "asc" ? " ↑" : " ↓")}
								</Button>
							</TableHead>
							<TableHead>Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{verifiedFiles.map((_x, i) => {
							if (
								i >=
									filePage * NUM_RESULTS_PER_PAGE -
										NUM_RESULTS_PER_PAGE &&
								i < filePage * NUM_RESULTS_PER_PAGE
							) {
								const file = verifiedFiles[i];

								let isSelected = false;

								if (file) {
									isSelected = selectedFiles.some((value) => {
										return value.fileName === file.fileName;
									});
								}
								if (file) {
									return (
										<TableRow key={`${file.fileName}-${i}`}>
											<TableCell>
												<Checkbox
													checked={isSelected}
													onCheckedChange={() => {
														if (isSelected) {
															const selFiles = [];
															selectedFiles.forEach(
																(u) => {
																	if (
																		u.fileName !==
																		file.fileName
																	) {
																		selFiles.push(
																			u,
																		);
																	}
																},
															);
															setSelectedFiles(
																selFiles,
															);
														} else {
															setSelectedFiles([
																...selectedFiles,
																file,
															]);
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
												{Math.round(
													file.fileSize * 10,
												) / 10}{" "}
												KB
											</TableCell>
											<TableCell>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => {
														setDeleteFileModal(
															true,
														);
														setFileToDelete(file);
													}}
												>
													<Trash2 className="size-4" />
												</Button>
											</TableCell>
										</TableRow>
									);
								}
							}

							return null;
						})}
					</TableBody>
					<TableFooter>
						<TableRow>
							<TableCell colSpan={5}>
								<div className="flex items-center justify-end gap-4 px-2">
									<div className="text-sm">
										{(filePage - 1) * NUM_RESULTS_PER_PAGE +
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
										>
											{"<<"}
										</Button>
										<Button
											variant="outline"
											size="icon-sm"
											onClick={() =>
												setFilePage(
													Math.max(1, filePage - 1),
												)
											}
											disabled={filePage === 1}
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

			{/* Upload Files Modal */}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					className="w-[600px]"
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
									<div
										className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-input border-dashed bg-secondary p-6 transition-colors hover:border-primary hover:bg-accent"
										onClick={() =>
											fileInputRef.current?.click()
										}
										onDragOver={handleDragOver}
										onDrop={handleDrop}
									>
										<input
											ref={fileInputRef}
											type="file"
											accept=".pdf,.csv,.txt,.doc,.ppt,.docx,.pptx"
											className="hidden"
											onChange={handleFileChange}
											multiple={true}
										/>
										{field.value &&
										field.value.length > 0 ? (
											<div className="text-center">
												<P className="font-medium text-foreground">
													{field.value.length} file
													{field.value.length > 1
														? "s"
														: ""}{" "}
													selected
												</P>
												<P className="text-muted-foreground text-sm">
													{field.value
														.map((f) => f.name)
														.join(", ")}
												</P>
												<P className="mt-2 text-muted-foreground text-sm">
													Click or drag to replace
												</P>
											</div>
										) : (
											<div className="text-center">
												<FileUploadOutlined className="mb-2 h-12 w-12 text-muted-foreground" />
												<P className="font-medium text-foreground">
													Drop your files here or
													click to browse
												</P>
												<P className="text-muted-foreground text-sm">
													Supports PDF, CSV, TXT, DOC,
													PPT, DOCX, PPTX
												</P>
											</div>
										)}
									</div>
								);
							}}
						/>
						<div className="flex flex-row justify-end gap-2">
							<Button
								size="sm"
								variant="ghost"
								disabled={isLoading}
								onClick={() => setOpen(false)}
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
							>
								{isLoading && <Spinner className="size-4" />}
								Embed
							</Button>
						</div>
						{isLoading && (
							<div className="mt-2">
								<Progress />
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Single File Modal */}
			<Dialog open={deleteFileModal} onOpenChange={setDeleteFileModal}>
				<DialogContent className="max-w-md">
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
				<DialogContent className="max-w-md">
					<div className="flex flex-col gap-4">
						<H4>Are you sure?</H4>
						<P>Would you like to delete all selected files?</P>
						<div className="flex justify-end gap-2">
							<Button
								variant="ghost"
								onClick={() => setDeleteFilesModal(false)}
							>
								Close
							</Button>
							<Button
								variant="destructive"
								disabled={isLoading}
								onClick={() => {
									deleteSelectedFiles(selectedFiles);
								}}
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
