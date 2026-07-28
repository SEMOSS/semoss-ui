import {
	ArrowDownIcon,
	ArrowDownToLineIcon,
	ArrowUpIcon,
	ArrowUpToLineIcon,
	ChevronsUpIcon,
	DownloadIcon,
	GripVerticalIcon,
	PlayIcon,
	PlusIcon,
	RefreshCwIcon,
	SaveIcon,
	Trash2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { download, runPixel, useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
	Muted,
	Spinner,
	toast,
} from "@semoss/ui/next";
import type { FileMode } from "../file.types";
import { getFileOperationErrorMessage } from "../file-explorer.utils";
import type {
	CellType,
	JupyterCodeCell,
	JupyterNotebook,
	RunCellResult,
} from "./notebook.utility";
import {
	applyRunResult,
	changeCellType,
	createCell,
	deleteCell,
	insertCell,
	moveCell,
	nextExecutionCount,
	normalizeSource,
	parseNotebook,
	setCellSource,
	toErrorOutput,
	toRuntimeOutputs,
	unwrapPixelOutput,
} from "./notebook.utility";
import { NotebookCellView } from "./notebook-cell-view";
import { useNotebookFileRefresh } from "./notebook-events";

interface NotebookProps {
	/** Mode of file editor */
	mode: FileMode;

	/** Path to the file */
	path: string;

	/** Callback when the file is changed */
	onChange?: (content: string, isModified: boolean) => void;
}

/**
 * Interactive `.ipynb` viewer/editor — the notebook counterpart to
 * `FileCodeEditor`. Loads the file through Pixel, parses it into an in-memory
 * notebook, and renders each cell (markdown / raw / code). Code and markdown
 * sources are editable; code cells run server-side (Python via the `Py()`
 * reactor) with their outputs mapped back to nbformat. The toolbar refreshes
 * from disk, runs all cells, saves, and downloads.
 */
export const Notebook: React.FC<NotebookProps> = ({
	mode,
	path,
	onChange = () => null,
}) => {
	const insight = useInsight();
	const { t } = useTranslation("common");

	const [notebook, setNotebook] = useState<JupyterNotebook | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [runningCellIndex, setRunningCellIndex] = useState<number | null>(
		null,
	);
	const [isRunningAll, setIsRunningAll] = useState(false);

	// Native drag-and-drop reorder state: the cell being dragged and the current
	// drop target.
	const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	// Tracks the last raw content we seeded state from, so a re-render (or a
	// refresh returning identical bytes) doesn't clobber in-progress run outputs.
	const seededRawRef = useRef<string | null>(null);

	const targetInsightId =
		mode.type === "INSIGHT"
			? mode.insightId || insight.insightId
			: insight.insightId;

	// Build the mode-scoped Pixel that reads this file's contents from the
	// matching asset store (app / engine / insight / user).
	let getFilePixel = "";
	if (mode.type === "APP") {
		getFilePixel = `GetAppAssets(filePath=["${path}"], project=["${mode.app}"]);`;
	} else if (mode.type === "ENGINE") {
		getFilePixel = `GetEngineAssets(filePath=["${path}"], engine=["${mode.engine}"]);`;
	} else if (mode.type === "INSIGHT" && targetInsightId) {
		getFilePixel = `GetInsightAssets(filePath=["${path}"]);`;
	} else if (mode.type === "USER") {
		getFilePixel = `GetUserAssets(filePath=["${path}"]);`;
	}

	const getFile = usePixel<string>(getFilePixel, {}, targetInsightId);

	// Seed the editable notebook state from the fetched file content, but only
	// when the underlying content actually changes (initial load / refresh).
	useEffect(() => {
		if (getFile.status !== "SUCCESS") return;
		const raw = getFile.data ?? "";
		if (seededRawRef.current === raw) return;
		seededRawRef.current = raw;
		const parsed = parseNotebook(raw);
		setNotebook(parsed.notebook);
		setParseError(parsed.error);
	}, [getFile.status, getFile.data]);

	// Reload from disk when this exact file is written from outside this editor
	// (e.g. the chat "Add to Notebook" action), so an already-open tab doesn't
	// silently go stale.
	useNotebookFileRefresh(path, () => {
		seededRawRef.current = null;
		getFile.refresh();
	});

	const isBusy =
		isSaving || isDownloading || isRunningAll || runningCellIndex !== null;

	// Execute a code cell server-side via the Py() reactor and map the Pixel
	// response into nbformat outputs. Only Python is wired up here; a cell-level
	// Python error comes back as an nbformat "error" output rather than throwing.
	const executeCell = async (
		cell: JupyterCodeCell,
		executionCount: number,
	): Promise<RunCellResult> => {
		const source = normalizeSource(cell.source);
		if (!source.trim()) {
			return { executionCount, outputs: [] };
		}

		const pixel = `Py("<encode>${source}</encode>");`;

		try {
			let pixelReturn: Array<{
				operationType?: string[];
				output?: unknown;
			}> = [];
			let errorMessages: string[] = [];

			if (mode.type === "INSIGHT" && targetInsightId) {
				const response = await runPixel<[unknown]>(
					pixel,
					targetInsightId,
				);
				pixelReturn = response.pixelReturn;
				errorMessages = response.errors;
			} else {
				const response = await insight.actions.run<[unknown]>(pixel);
				pixelReturn = response.pixelReturn;
			}

			const last = pixelReturn[pixelReturn.length - 1];
			const operationType = last?.operationType ?? [];

			if (errorMessages.length > 0 || operationType.includes("ERROR")) {
				const message =
					errorMessages.join("\n") ||
					String(unwrapPixelOutput(last) ?? "Execution error");
				return { executionCount, outputs: [toErrorOutput(message)] };
			}

			return {
				executionCount,
				outputs: toRuntimeOutputs(
					unwrapPixelOutput(last),
					executionCount,
				),
			};
		} catch (e) {
			return {
				executionCount,
				outputs: [
					toErrorOutput(e instanceof Error ? e.message : String(e)),
				],
			};
		}
	};

	// Run a single code cell and store its outputs back on the notebook.
	const runCell = async (index: number) => {
		if (!notebook || isBusy) return;
		const cell = notebook.cells[index];
		if (!cell || cell.cell_type !== "code") return;

		setRunningCellIndex(index);
		try {
			const result = await executeCell(
				cell,
				nextExecutionCount(notebook),
			);
			const next = applyRunResult(notebook, index, result);
			setNotebook(next);
			onChange(JSON.stringify(next, null, 2), true);
		} finally {
			setRunningCellIndex(null);
		}
	};

	// Run every code cell top-to-bottom, threading a working copy so each cell's
	// outputs appear as it finishes (and later cells see earlier updates).
	const runAllCells = async () => {
		if (!notebook || isBusy) return;

		setIsRunningAll(true);
		try {
			let working = notebook;
			for (let index = 0; index < working.cells.length; index += 1) {
				const cell = working.cells[index];
				if (cell.cell_type !== "code") continue;

				setRunningCellIndex(index);
				const result = await executeCell(
					cell,
					nextExecutionCount(working),
				);
				working = applyRunResult(working, index, result);
				setNotebook(working);
			}
			onChange(JSON.stringify(working, null, 2), true);
		} finally {
			setRunningCellIndex(null);
			setIsRunningAll(false);
		}
	};

	// Run every code cell above `index` top-to-bottom, leaving the current cell
	// untouched. Threads a working copy so each cell's outputs appear as it runs.
	const runCellsAbove = async (index: number) => {
		if (!notebook || isBusy) return;

		setIsRunningAll(true);
		try {
			let working = notebook;
			for (let i = 0; i < index && i < working.cells.length; i += 1) {
				const cell = working.cells[i];
				if (cell.cell_type !== "code") continue;

				setRunningCellIndex(i);
				const result = await executeCell(
					cell,
					nextExecutionCount(working),
				);
				working = applyRunResult(working, i, result);
				setNotebook(working);
			}
			onChange(JSON.stringify(working, null, 2), true);
		} finally {
			setRunningCellIndex(null);
			setIsRunningAll(false);
		}
	};

	// Persist an edited cell source (code or markdown) back into notebook state
	// and flag the file as modified so it can be saved.
	const updateCellSource = (index: number, source: string) => {
		if (!notebook) return;
		const next = setCellSource(notebook, index, source);
		setNotebook(next);
		onChange(JSON.stringify(next, null, 2), true);
	};

	// Reorder: move the dragged cell to the drop target's position.
	const handleMoveCell = (from: number, to: number) => {
		if (!notebook) return;
		const next = moveCell(notebook, from, to);
		if (next === notebook) return;
		setNotebook(next);
		onChange(JSON.stringify(next, null, 2), true);
	};

	// Delete a cell from the notebook.
	const handleDeleteCell = (index: number) => {
		if (!notebook) return;
		const next = deleteCell(notebook, index);
		setNotebook(next);
		onChange(JSON.stringify(next, null, 2), true);
	};

	const handleDrop = (index: number) => {
		if (draggingIndex !== null) {
			handleMoveCell(draggingIndex, index);
		}
		setDraggingIndex(null);
		setDragOverIndex(null);
	};

	// Insert a new empty cell of the given type directly above `index`.
	const handleInsertCellAbove = (index: number, type: CellType) => {
		if (!notebook) return;
		const next = insertCell(notebook, createCell(type), index);
		setNotebook(next);
		onChange(JSON.stringify(next, null, 2), true);
	};

	// Insert a new empty cell of the given type directly below `index`.
	const handleInsertCellBelow = (index: number, type: CellType) => {
		if (!notebook) return;
		const next = insertCell(notebook, createCell(type), index + 1);
		setNotebook(next);
		onChange(JSON.stringify(next, null, 2), true);
	};

	// Add a new empty cell of the given type to the end of the notebook.
	const handleAddCell = (type: CellType) => {
		if (!notebook) return;
		const next = insertCell(notebook, createCell(type));
		setNotebook(next);
		onChange(JSON.stringify(next, null, 2), true);
	};

	// Switch a cell to a different type, preserving its source.
	const handleChangeCellType = (index: number, type: CellType) => {
		if (!notebook) return;
		const next = changeCellType(notebook, index, type);
		setNotebook(next);
		onChange(JSON.stringify(next, null, 2), true);
	};

	// Serialize the in-memory notebook and write it back to the asset store.
	const saveNotebook = async () => {
		if (!notebook) return;

		setIsSaving(true);
		try {
			const content = JSON.stringify(notebook, null, 2);

			let pixel = "";
			if (mode.type === "APP") {
				pixel = `SaveAppAssets(project=["${mode.app}"], filePath=["${path}"], content=["<encode>${content}</encode>"]);`;
			} else if (mode.type === "ENGINE") {
				pixel = `SaveEngineAssets(engine=["${mode.engine}"], filePath=["${path}"], content=["<encode>${content}</encode>"]);`;
			} else if (mode.type === "INSIGHT") {
				pixel = `SaveInsightAssets(filePath=["${path}"], content=["<encode>${content}</encode>"]);`;
			} else if (mode.type === "USER") {
				pixel = `SaveUserAssets(filePath=["${path}"], content=["<encode>${content}</encode>"]);`;
			}

			if (!pixel) {
				throw new Error("Error missing pixel to save file");
			}

			if (mode.type === "INSIGHT" && targetInsightId) {
				await runPixel(pixel, targetInsightId);
			} else {
				await insight.actions.run(pixel);
			}

			onChange(content, false);
			toast.success(t("fileExplorer.toasts.saveSuccess"));
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.saveFailed"),
					e,
				),
			);
			console.error(e);
		} finally {
			setIsSaving(false);
		}
	};

	// Download the raw .ipynb file through the asset store's download flow.
	const downloadNotebook = async () => {
		setIsDownloading(true);
		try {
			let pixel = "";
			if (mode.type === "APP") {
				pixel = `DownloadAppAsset(project=["${mode.app}"], filePath=["${path}"]);`;
			} else if (mode.type === "ENGINE") {
				pixel = `DownloadEngineAsset(engine=["${mode.engine}"], filePath=["${path}"]);`;
			} else if (mode.type === "INSIGHT") {
				pixel = `DownloadInsightAsset(filePath=["${path}"]);`;
			} else if (mode.type === "USER") {
				pixel = `DownloadUserAsset(filePath=["${path}"]);`;
			}

			if (!pixel) {
				throw new Error("Error missing pixel to download file");
			}

			let pixelReturn: { output: string }[] = [];
			if (mode.type === "INSIGHT" && targetInsightId) {
				const response = await runPixel<[string]>(
					pixel,
					targetInsightId,
				);
				pixelReturn = response.pixelReturn;
			} else {
				const response = await insight.actions.run<[string]>(pixel);
				pixelReturn = response.pixelReturn;
			}

			const fileKey = pixelReturn[0].output;
			await download(targetInsightId, fileKey);
			toast.success(t("fileExplorer.toasts.downloadFileSuccess"));
		} catch (e) {
			toast.error(
				getFileOperationErrorMessage(
					t("fileExplorer.toasts.downloadFileFailed"),
					e,
				),
			);
			console.error(e);
		} finally {
			setIsDownloading(false);
		}
	};

	const hasCodeCells = Boolean(
		notebook?.cells.some((cell) => cell.cell_type === "code"),
	);

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			{/* Toolbar */}
			<div className="flex w-full shrink-0 items-center justify-between gap-2 border-border border-b px-3 pt-[4px] pb-[7px]">
				<span className="truncate font-medium text-muted-foreground text-xs">
					{path.split("/").pop()}
				</span>
				<div className="flex items-center gap-1.5">
					<Button
						variant="outline"
						size="sm"
						disabled={getFile.status === "LOADING" || isBusy}
						onClick={() => {
							// Force a reseed so Refresh reloads from disk and
							// discards local edits / run outputs.
							seededRawRef.current = null;
							getFile.refresh();
						}}
					>
						<RefreshCwIcon className="size-4" />
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!hasCodeCells || isBusy}
						onClick={() => runAllCells()}
					>
						<PlayIcon className="size-4" />
						{isRunningAll ? "Running…" : "Run All"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!notebook || isBusy}
						onClick={() => saveNotebook()}
					>
						<SaveIcon className="size-4" />
						Save
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={getFile.status !== "SUCCESS" || isBusy}
						onClick={() => downloadNotebook()}
					>
						<DownloadIcon className="size-4" />
						Download
					</Button>
				</div>
			</div>

			{/* Notebook body */}
			<div className="flex-1 overflow-y-auto">
				{getFile.status === "LOADING" && (
					<div className="flex h-full w-full items-center justify-center">
						<Spinner />
					</div>
				)}
				{getFile.status === "ERROR" && (
					<div className="flex h-full w-full items-center justify-center">
						<Muted className="text-destructive">
							{getFile.error?.message ||
								t("fileExplorer.failedToLoadFiles")}
						</Muted>
					</div>
				)}
				{getFile.status === "SUCCESS" && parseError && (
					<div className="flex h-full w-full items-center justify-center">
						<Muted className="text-destructive">{parseError}</Muted>
					</div>
				)}
				{getFile.status === "SUCCESS" && !parseError && notebook && (
					<div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 py-4">
						{notebook.cells.map((cell, index) => (
							<div
								key={cell.id}
								className={`relative flex gap-1.5 ${
									draggingIndex === index ? "opacity-50" : ""
								}`}
							>
								{/* Reorder / delete gutter */}
								<div className="flex w-6 shrink-0 flex-col items-center gap-0.5 pt-1">
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-6 text-muted-foreground/60 hover:text-foreground"
										disabled={isBusy || index === 0}
										onClick={() =>
											handleMoveCell(index, index - 1)
										}
										title="Move cell up"
										aria-label="Move cell up"
									>
										<ArrowUpIcon className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-6 cursor-grab text-muted-foreground/60 hover:text-foreground"
										draggable={!isBusy}
										onDragStart={(e) => {
											setDraggingIndex(index);
											e.dataTransfer.effectAllowed =
												"move";
											e.dataTransfer.setData(
												"text/plain",
												String(index),
											);
										}}
										onDragEnd={() => {
											setDraggingIndex(null);
											setDragOverIndex(null);
										}}
										title="Drag to reorder"
										aria-label="Drag to reorder cell"
									>
										<GripVerticalIcon className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-6 text-muted-foreground/60 hover:text-foreground"
										disabled={
											isBusy ||
											index === notebook.cells.length - 1
										}
										onClick={() =>
											handleMoveCell(index, index + 1)
										}
										title="Move cell down"
										aria-label="Move cell down"
									>
										<ArrowDownIcon className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										className="size-6 text-muted-foreground/60 hover:text-destructive"
										disabled={isBusy}
										onClick={() => handleDeleteCell(index)}
										title="Delete cell"
										aria-label="Delete cell"
									>
										<Trash2Icon className="size-4" />
									</Button>
								</div>

								{/* Cell body */}
								<ContextMenu>
									<ContextMenuTrigger asChild>
										<div className="min-w-0 flex-1">
											<NotebookCellView
												cell={cell}
												index={index}
												isRunning={
													runningCellIndex === index
												}
												disabled={isBusy}
												onRun={runCell}
												onSourceChange={
													updateCellSource
												}
												onChangeType={
													handleChangeCellType
												}
											/>
										</div>
									</ContextMenuTrigger>
									<ContextMenuContent className="w-52">
										<ContextMenuItem
											disabled={isBusy}
											onSelect={() =>
												handleInsertCellAbove(
													index,
													"code",
												)
											}
										>
											<ArrowUpToLineIcon className="size-4" />
											Insert Cell Above
										</ContextMenuItem>
										<ContextMenuItem
											disabled={isBusy}
											onSelect={() =>
												handleInsertCellBelow(
													index,
													"code",
												)
											}
										>
											<ArrowDownToLineIcon className="size-4" />
											Insert Cell Below
										</ContextMenuItem>
										<ContextMenuSeparator />
										<ContextMenuSub>
											<ContextMenuSubTrigger
												disabled={isBusy}
											>
												Change Cell Type
											</ContextMenuSubTrigger>
											<ContextMenuSubContent>
												<ContextMenuRadioGroup
													value={cell.cell_type}
													onValueChange={(value) =>
														handleChangeCellType(
															index,
															value as CellType,
														)
													}
												>
													<ContextMenuRadioItem value="code">
														Code
													</ContextMenuRadioItem>
													<ContextMenuRadioItem value="markdown">
														Markdown
													</ContextMenuRadioItem>
													<ContextMenuRadioItem value="raw">
														Raw
													</ContextMenuRadioItem>
												</ContextMenuRadioGroup>
											</ContextMenuSubContent>
										</ContextMenuSub>
										<ContextMenuSeparator />
										<ContextMenuItem
											disabled={
												isBusy ||
												!notebook.cells
													.slice(0, index)
													.some(
														(above) =>
															above.cell_type ===
															"code",
													)
											}
											onSelect={() =>
												runCellsAbove(index)
											}
										>
											<ChevronsUpIcon className="size-4" />
											Execute Cells Above
										</ContextMenuItem>
										<ContextMenuItem
											disabled={
												isBusy ||
												cell.cell_type !== "code"
											}
											onSelect={() => runCell(index)}
										>
											<PlayIcon className="size-4" />
											Run Cell
										</ContextMenuItem>
									</ContextMenuContent>
								</ContextMenu>

								{/* Drop zone — mounted only while dragging so it
									    never blocks editing, and layered above the
									    editor so the drop lands here instead of inside
									    Monaco. */}
								{draggingIndex !== null &&
									draggingIndex !== index && (
										// biome-ignore lint/a11y/noStaticElementInteractions: native drag-and-drop drop target
										<div
											className="absolute inset-0 z-10"
											onDragOver={(e) => {
												e.preventDefault();
												setDragOverIndex(index);
											}}
											onDrop={(e) => {
												e.preventDefault();
												handleDrop(index);
											}}
										>
											{dragOverIndex === index && (
												<div className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-primary" />
											)}
										</div>
									)}
							</div>
						))}

						{/* Add cell */}
						<div className="flex items-center justify-center gap-2 pt-1">
							<Button
								variant="outline"
								size="sm"
								disabled={isBusy}
								onClick={() => handleAddCell("code")}
							>
								<PlusIcon className="size-4" />
								Code
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={isBusy}
								onClick={() => handleAddCell("markdown")}
							>
								<PlusIcon className="size-4" />
								Markdown
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
