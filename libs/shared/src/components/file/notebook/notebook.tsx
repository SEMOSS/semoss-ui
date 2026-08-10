import {
	ArrowDownIcon,
	ArrowUpIcon,
	DownloadIcon,
	EraserIcon,
	FileCode2Icon,
	GripVerticalIcon,
	PlayIcon,
	PlusIcon,
	RefreshCwIcon,
	SaveIcon,
	SquareIcon,
	Trash2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	download,
	getPixelAsyncResult,
	console as getPixelConsole,
	runPixel,
	runPixelAsync,
	useInsight,
	usePixel,
} from "@semoss/sdk/react";
import {
	Button,
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
	Muted,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { FileMode } from "../file.types";
import { getFileOperationErrorMessage } from "../file-explorer.utils";
import type {
	JupyterCell,
	JupyterCellType,
	JupyterNotebook,
	JupyterOutput,
} from "./notebook.types";
import {
	createCell,
	exportAsPythonScript,
	insertCell,
	nextExecutionCount,
	normalizeSource,
	toCellOutputs,
	unwrapPixelOutput,
	validateNotebook,
} from "./notebook.utility";
import { NotebookCell } from "./notebook-cell";
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
	const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);
	const [runAllProgress, setRunAllProgress] = useState<{
		current: number;
		total: number;
	} | null>(null);

	// Native drag-and-drop reorder state: the cell being dragged and the current
	// drop target.
	const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	// Per-cell DOM refs for scroll-to-cell.
	const cellRefs = useRef<Record<number, HTMLDivElement | null>>({});
	// Tracks the in-flight async job so the Stop button can cancel it.
	const currentJobIdRef = useRef<string | null>(null);
	const abortRequestedRef = useRef(false);

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

	// Validate the fetched file into notebook state on load / refresh; a file that
	// fails validation surfaces an error and a toast instead of rendering.
	const getFile = usePixel<string>(
		getFilePixel,
		{
			onSuccess: (raw) => {
				try {
					const validated = validateNotebook(raw ?? "");
					setNotebook(validated);
					setParseError(null);
				} catch (e) {
					const message =
						e instanceof Error ? e.message : "Invalid notebook";
					setNotebook(null);
					setParseError(message);
					toast.error(message);
				}
			},
			onError: () => {
				setNotebook(null);
			},
		},
		targetInsightId,
	);

	console.log(getFile.status, getFile.data, getFile.error);

	// Reload from disk when this exact file is written from outside this editor
	// (e.g. the chat "Add to Notebook" action), so an already-open tab doesn't
	// silently go stale.
	useNotebookFileRefresh(path, () => getFile.refresh());

	// A stable ref so the Ctrl+S listener always calls the latest saveNotebook.
	const saveNotebookRef = useRef<() => Promise<void>>();

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				void saveNotebookRef.current?.();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	// Scroll the running / newly-activated cell into view.
	useEffect(() => {
		const idx = runningCellIndex ?? activeCellIndex;
		if (idx === null) return;
		const el = cellRefs.current[idx];
		el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [runningCellIndex, activeCellIndex]);

	const isBusy =
		isSaving || isDownloading || isRunningAll || runningCellIndex !== null;

	/**
	 * Persist an edited notebook to state and flag the file as modified.
	 */
	const updateNotebook = (next: JupyterNotebook) => {
		setNotebook(next);
		onChange(JSON.stringify(next, null, 2), true);
	};

	/**
	 * Run a single code cell against `source` (the latest cells; defaults to
	 * current state): build its Pixel, execute it, map the streamed result into
	 * nbformat outputs, and commit them back onto the cell. Returns the updated
	 * notebook so sequential runners can thread the newest cells forward. A
	 * cell-level Python error (or a thrown network error) becomes an nbformat
	 * "error" output rather than propagating.
	 */
	const executeCell = async (
		index: number,
		source?: JupyterNotebook,
	): Promise<JupyterNotebook | null> => {
		const current = source ?? notebook;
		const cell = current?.cells[index];
		if (!current || !cell || cell.cell_type !== "code") {
			return current;
		}

		setRunningCellIndex(index);
		const executionCount = nextExecutionCount(current);

		let outputs: JupyterOutput[] = [];
		try {
			const cellSource = normalizeSource(cell.source);
			const pixel = cellSource.trim()
				? `Py("<encode>${cellSource}</encode>");`
				: "";

			let logs: string[] = [];
			let value: unknown;
			let isError = false;
			let wasInterrupted = false;

			if (pixel) {
				const { jobId } = await runPixelAsync(pixel, targetInsightId);
				currentJobIdRef.current = jobId;

				logs = [];
				let isPolling = true;
				while (isPolling) {
					if (abortRequestedRef.current) {
						wasInterrupted = true;
						isPolling = false;
						break;
					}
					const { message: messages, status } =
						await getPixelConsole(jobId);
					logs.push(...messages);

					if (
						status === "ProgressComplete" ||
						status === "Streaming" ||
						status === "Complete"
					) {
						isPolling = false;
					} else {
						await new Promise((resolve) =>
							setTimeout(resolve, 1000),
						);
					}
				}

				if (!wasInterrupted) {
					// Final flush — pull any logs written after the last poll.
					const { message: finalMessages } =
						await getPixelConsole(jobId);
					logs.push(...finalMessages);

					const { errors, results } =
						await getPixelAsyncResult<[unknown]>(jobId);
					const last = results[results.length - 1];
					isError =
						errors.length > 0 ||
						(last?.operationType ?? []).includes("ERROR");
					value = isError
						? errors.join("\n") ||
							String(unwrapPixelOutput(last) ?? "Execution error")
						: unwrapPixelOutput(last);
				}
			}

			outputs = wasInterrupted
				? toCellOutputs([], "Interrupted", true, executionCount)
				: toCellOutputs(logs, value, isError, executionCount);
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			outputs = toCellOutputs([], message, true, executionCount);
		} finally {
			currentJobIdRef.current = null;
		}

		const next: JupyterNotebook = {
			...current,
			cells: current.cells.map((c, i) =>
				i === index && c.cell_type === "code"
					? { ...c, outputs, execution_count: executionCount }
					: c,
			),
		};

		updateNotebook(next);
		setRunningCellIndex(null);

		return next;
	};

	const runAllCells = async () => {
		if (!notebook || isBusy) return;

		const codeCellCount = notebook.cells.filter(
			(c) => c.cell_type === "code",
		).length;
		abortRequestedRef.current = false;
		setRunAllProgress({ current: 0, total: codeCellCount });
		setIsRunningAll(true);
		try {
			let working: JupyterNotebook = notebook;
			const count = working.cells.length;
			let ran = 0;
			for (let index = 0; index < count; index += 1) {
				if (abortRequestedRef.current) break;
				if (working.cells[index]?.cell_type === "code") {
					working = (await executeCell(index, working)) ?? working;
					ran += 1;
					setRunAllProgress({ current: ran, total: codeCellCount });
				}
			}
		} finally {
			setIsRunningAll(false);
			setRunAllProgress(null);
		}
	};

	/** Run every code cell above `index`, leaving that cell untouched. */
	const runCellsAbove = async (index: number) => {
		if (!notebook || isBusy) {
			return;
		}

		const codeCellCount = notebook.cells
			.slice(0, index)
			.filter((c) => c.cell_type === "code").length;
		abortRequestedRef.current = false;
		setRunAllProgress({ current: 0, total: codeCellCount });
		setIsRunningAll(true);
		try {
			let working: JupyterNotebook = notebook;
			let ran = 0;
			for (let i = 0; i < index; i += 1) {
				if (abortRequestedRef.current) break;
				if (working.cells[i]?.cell_type === "code") {
					working = (await executeCell(i, working)) ?? working;
					ran += 1;
					setRunAllProgress({ current: ran, total: codeCellCount });
				}
			}
		} finally {
			setIsRunningAll(false);
			setRunAllProgress(null);
		}
	};

	/** Run every code cell below `index`, leaving that cell untouched. */
	const runCellsBelow = async (index: number) => {
		if (!notebook || isBusy) return;

		const codeCellCount = notebook.cells
			.slice(index + 1)
			.filter((c) => c.cell_type === "code").length;
		abortRequestedRef.current = false;
		setRunAllProgress({ current: 0, total: codeCellCount });
		setIsRunningAll(true);
		try {
			let working: JupyterNotebook = notebook;
			const count = working.cells.length;
			let ran = 0;
			for (let i = index + 1; i < count; i += 1) {
				if (abortRequestedRef.current) break;
				if (working.cells[i]?.cell_type === "code") {
					working = (await executeCell(i, working)) ?? working;
					ran += 1;
					setRunAllProgress({ current: ran, total: codeCellCount });
				}
			}
		} finally {
			setIsRunningAll(false);
			setRunAllProgress(null);
		}
	};

	/** Wrapper for single-cell runs that resets the abort flag first. */
	const runCell = (index: number) => {
		abortRequestedRef.current = false;
		void executeCell(index);
	};

	/** Run a cell then advance focus; inserts nothing — stays at last cell if already there. */
	const runAndAdvanceCell = async (index: number) => {
		if (!notebook) return;
		abortRequestedRef.current = false;
		await executeCell(index);
		if (index < notebook.cells.length - 1) {
			setActiveCellIndex(index + 1);
		}
	};

	/** Cancel the in-flight execution via StopPixelExecution. */
	const interruptExecution = async () => {
		abortRequestedRef.current = true;
		const jobId = currentJobIdRef.current;
		if (jobId) {
			try {
				await runPixel(
					`StopPixelExecution(id=["${jobId}"]);`,
					targetInsightId,
				);
			} catch {
				// ignore — abort flag already set
			}
		}
	};

	/** Clear outputs for a single code cell. */
	const clearCellOutputs = (index: number) => {
		if (!notebook) return;
		updateNotebook({
			...notebook,
			cells: notebook.cells.map((cell, i) =>
				i === index && cell.cell_type === "code"
					? { ...cell, outputs: [] }
					: cell,
			),
		});
	};

	/** Clear outputs on every code cell at once. */
	const clearAllOutputs = () => {
		if (!notebook) return;
		updateNotebook({
			...notebook,
			cells: notebook.cells.map((cell) =>
				cell.cell_type === "code" ? { ...cell, outputs: [] } : cell,
			),
		});
	};

	/** Deep-copy a cell with a new id and insert it immediately below. */
	const duplicateCell = (index: number) => {
		if (!notebook || isBusy) return;
		const cell = notebook.cells[index];
		if (!cell) return;
		const copy: JupyterCell = {
			...cell,
			id: crypto.randomUUID(),
			...(cell.cell_type === "code"
				? { outputs: [], execution_count: null }
				: {}),
		} as JupyterCell;
		updateNotebook(insertCell(notebook, copy, index + 1));
	};

	/** Trigger a browser download of the notebook as a .py script. */
	const exportAsPython = () => {
		if (!notebook) return;
		const content = exportAsPythonScript(notebook);
		const fileName = (path.split("/").pop() ?? "notebook").replace(
			/\.ipynb$/,
			".py",
		);
		const blob = new Blob([content], { type: "text/x-python" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
	};

	/** Persist an edited cell source (code or markdown) so it can be saved. */
	const updateCellSource = (index: number, source: string) => {
		if (!notebook || isBusy) {
			return;
		}

		updateNotebook({
			...notebook,
			cells: notebook.cells.map((cell, cellIndex) => {
				if (cellIndex !== index) {
					return cell;
				}
				if (cell.cell_type === "code") {
					return { ...cell, source };
				}
				if (cell.cell_type === "markdown") {
					return { ...cell, source };
				}
				return { ...cell, source };
			}),
		});
	};

	/** Move the cell at `from` to `to`, ignoring out-of-range / no-op moves. */
	const moveCell = (from: number, to: number) => {
		if (!notebook || isBusy) {
			return;
		}
		const { length } = notebook.cells;
		if (
			from === to ||
			from < 0 ||
			to < 0 ||
			from >= length ||
			to >= length
		) {
			return;
		}
		const cells = [...notebook.cells];
		const [moved] = cells.splice(from, 1);
		cells.splice(to, 0, moved);

		updateNotebook({
			...notebook,
			cells,
		});
	};

	/** Delete the cell at `index`. */
	const deleteCell = (index: number) => {
		if (!notebook || isBusy) {
			return;
		}
		updateNotebook({
			...notebook,
			cells: notebook.cells.filter((_, i) => i !== index),
		});
	};

	/** Drop the dragged cell onto the target position. */
	const handleDrop = (index: number) => {
		if (draggingIndex !== null) {
			moveCell(draggingIndex, index);
		}
		setDraggingIndex(null);
		setDragOverIndex(null);
	};

	/** Insert a new empty cell of `type` at `at`, appending when omitted. */
	const addCell = (type: JupyterCellType, index?: number) => {
		if (!notebook || isBusy) {
			return;
		}

		const cell = createCell(type);
		const cells = [...notebook.cells];
		const at =
			index === undefined || index < 0 || index > cells.length
				? cells.length
				: index;

		cells.splice(at, 0, cell);

		updateNotebook({
			...notebook,
			cells,
		});
	};

	/** Switch a cell to a different type, preserving its source. */
	const changeType = (index: number, type: JupyterCellType) => {
		if (!notebook || isBusy) {
			return;
		}
		updateNotebook({
			...notebook,
			cells: notebook.cells.map((cell, cellIndex) => {
				if (cellIndex !== index || cell.cell_type === type) {
					return cell;
				}
				const base = {
					id: cell.id,
					metadata: cell.metadata,
					source: cell.source,
				};

				if (type === "markdown") {
					return {
						...base,
						cell_type: "markdown" as const,
					};
				}
				if (type === "raw") {
					return {
						...base,
						cell_type: "raw" as const,
					};
				}
				return {
					...base,
					cell_type: "code" as const,
					execution_count: null,
					outputs: [],
				};
			}),
		});
	};

	/** Serialize the in-memory notebook and write it back to the asset store. */
	const saveNotebook = async () => {
		if (!notebook || isBusy) {
			return;
		}

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
	// Update on every render so the Ctrl+S listener always calls the latest version.
	saveNotebookRef.current = saveNotebook;

	/** Download the raw .ipynb file through the asset store's download flow. */
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
	const hasCellOutputs = Boolean(
		notebook?.cells.some(
			(cell) => cell.cell_type === "code" && cell.outputs.length > 0,
		),
	);

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
					{/* Toolbar */}
					<div className="flex w-full shrink-0 items-center gap-1.5 border-border border-b px-2 py-1">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									disabled={
										getFile.status === "LOADING" || isBusy
									}
									onClick={() => getFile.refresh()}
									aria-label="Refresh"
								>
									<RefreshCwIcon className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Refresh</TooltipContent>
						</Tooltip>
						<div className="flex-1" />
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									disabled={!notebook || isBusy}
									onClick={() => void saveNotebook()}
									aria-label="Save"
								>
									<SaveIcon className="size-3" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Save</TooltipContent>
						</Tooltip>
						{isRunningAll || runningCellIndex !== null ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										className="text-destructive hover:text-destructive"
										onClick={() =>
											void interruptExecution()
										}
										aria-label={
											runAllProgress
												? `Stop (${runAllProgress.current} / ${runAllProgress.total})`
												: "Stop"
										}
									>
										Stop <SquareIcon className="size-3" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{runAllProgress
										? `Stop (${runAllProgress.current} / ${runAllProgress.total})`
										: "Stop"}
								</TooltipContent>
							</Tooltip>
						) : (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										disabled={!hasCodeCells || isBusy}
										onClick={() => runAllCells()}
										aria-label="Run all"
									>
										Run <PlayIcon className="size-3" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Run all</TooltipContent>
							</Tooltip>
						)}
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
								<Muted className="text-destructive">
									{parseError}
								</Muted>
							</div>
						)}
						{getFile.status === "SUCCESS" &&
							!parseError &&
							notebook && (
								<div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 py-4">
									{notebook.cells.map((cell, index) => (
										<div
											key={cell.id}
											ref={(el) => {
												cellRefs.current[index] = el;
											}}
											className={`relative flex gap-1.5 ${
												draggingIndex === index
													? "opacity-50"
													: ""
											}`}
										>
											{/* Reorder / delete gutter */}
											<div className="flex w-6 shrink-0 flex-col items-center gap-0.5 pt-1">
												<Button
													variant="ghost"
													size="icon-sm"
													className="size-6 text-muted-foreground/60 hover:text-foreground"
													disabled={
														isBusy || index === 0
													}
													onClick={() =>
														moveCell(
															index,
															index - 1,
														)
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
														index ===
															notebook.cells
																.length -
																1
													}
													onClick={() =>
														moveCell(
															index,
															index + 1,
														)
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
													onClick={() =>
														deleteCell(index)
													}
													title="Delete cell"
													aria-label="Delete cell"
												>
													<Trash2Icon className="size-4" />
												</Button>
											</div>

											<NotebookCell
												cell={cell}
												index={index}
												isRunning={
													runningCellIndex === index
												}
												disabled={isBusy}
												isActive={
													activeCellIndex === index
												}
												canRunAbove={notebook.cells
													.slice(0, index)
													.some(
														(above) =>
															above.cell_type ===
															"code",
													)}
												canRunBelow={notebook.cells
													.slice(index + 1)
													.some(
														(below) =>
															below.cell_type ===
															"code",
													)}
												onRun={runCell}
												onRunAndAdvance={
													runAndAdvanceCell
												}
												onInterrupt={interruptExecution}
												onRunAbove={runCellsAbove}
												onRunBelow={runCellsBelow}
												onDuplicate={duplicateCell}
												onClearOutput={clearCellOutputs}
												onActivate={setActiveCellIndex}
												onSourceChange={
													updateCellSource
												}
												onChangeType={changeType}
												onInsertAbove={(i, type) =>
													addCell(type, i)
												}
												onInsertBelow={(i, type) =>
													addCell(type, i + 1)
												}
											/>

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
															setDragOverIndex(
																index,
															);
														}}
														onDrop={(e) => {
															e.preventDefault();
															handleDrop(index);
														}}
													>
														{dragOverIndex ===
															index && (
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
											onClick={() => addCell("code")}
										>
											<PlusIcon className="size-4" />
											Code
										</Button>
										<Button
											variant="outline"
											size="sm"
											disabled={isBusy}
											onClick={() => addCell("markdown")}
										>
											<PlusIcon className="size-4" />
											Markdown
										</Button>
									</div>
								</div>
							)}
					</div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					disabled={getFile.status === "LOADING" || isBusy}
					onClick={() => getFile.refresh()}
				>
					<RefreshCwIcon className="size-4" />
					Refresh
				</ContextMenuItem>
				<ContextMenuItem
					disabled={!notebook || isBusy}
					onClick={() => void saveNotebook()}
				>
					<SaveIcon className="size-4" />
					Save
				</ContextMenuItem>

				<ContextMenuSeparator />
				<ContextMenuItem
					disabled={getFile.status !== "SUCCESS" || isBusy}
					onClick={() => void downloadNotebook()}
				>
					<DownloadIcon className="size-4" />
					Export
				</ContextMenuItem>
				<ContextMenuItem
					disabled={!notebook || isBusy}
					onClick={() => exportAsPython()}
				>
					<FileCode2Icon className="size-4" />
					Export as .py
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem
					disabled={!hasCodeCells || isBusy}
					onClick={() => runAllCells()}
				>
					<PlayIcon className="size-4" />
					Run All
				</ContextMenuItem>
				{hasCellOutputs && (
					<ContextMenuItem
						disabled={isBusy}
						onClick={() => clearAllOutputs()}
					>
						<EraserIcon className="size-4" />
						Clear All
					</ContextMenuItem>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
};
