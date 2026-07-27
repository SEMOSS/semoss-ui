import {
	DownloadIcon,
	RefreshCwIcon,
	SaveIcon,
	TriangleAlertIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import { Button, Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import {
	NOTEBOOK_FILE_REFRESH_EVENT,
	NOTEBOOK_ROW_CLEAR_SELECTION_EVENT,
} from "../events";
import type {
	JupyterCodeCell,
	JupyterNotebook,
	NotebookRowSelection,
	RunNotebookCellRequest,
	RunNotebookCellResult,
} from "../types";
import { parseNotebookJson, updateNotebookCellExecution } from "../utils";
import { NotebookCell } from "./notebook-cell";

interface NotebookViewerProps {
	insightId: string;
	path: string;
	initialTab?: "edit" | "preview";
	onRowSelectionChange?: (selection: NotebookRowSelection | null) => void;
	onRunCell?: (
		request: RunNotebookCellRequest,
	) => Promise<RunNotebookCellResult | null>;
}

export const NotebookViewer: React.FC<NotebookViewerProps> = ({
	insightId,
	path,
	initialTab = "edit",
	onRowSelectionChange,
	onRunCell,
}) => {
	const [tab, setTab] = useState<"edit" | "preview">(initialTab);
	const [rawContent, setRawContent] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isModified, setIsModified] = useState(false);
	const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(
		null,
	);
	const [runningCellIndex, setRunningCellIndex] = useState<number | null>(
		null,
	);
	const [isRunningAllCells, setIsRunningAllCells] = useState(false);
	const [ioError, setIoError] = useState<string | null>(null);

	const parsed = useMemo(() => parseNotebookJson(rawContent), [rawContent]);

	const refresh = useCallback(async () => {
		if (!insightId || !path) return;

		setIsLoading(true);
		setIoError(null);
		try {
			const response = await runPixel<[string]>(
				`GetInsightAssets(filePath=[${JSON.stringify(path)}]);`,
				insightId,
			);

			if (response.errors.length > 0) {
				throw new Error(response.errors.join(", "));
			}

			const content = String(response.pixelReturn[0]?.output ?? "");
			setRawContent(content);
			setIsModified(false);
		} catch (error) {
			// Surface load failures inline instead of throwing, so a bad/missing
			// file leaves the toolbar (Refresh/Download) usable rather than
			// crashing the whole viewer.
			setIoError(
				error instanceof Error
					? error.message
					: "Failed to load notebook file",
			);
		} finally {
			setIsLoading(false);
		}
	}, [insightId, path]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	// A refresh can be triggered by an unrelated save to this same file (e.g.
	// another code block appending a cell elsewhere), which must NOT blow away
	// an in-progress row selection - the select row -> prompt -> "Add to
	// Notebook" workflow depends on it surviving intermediate reloads. Only
	// clear it if the row it pointed at no longer exists after the reload.
	useEffect(() => {
		if (selectedRowNumber === null) return;
		const cellCount = parsed.notebook?.cells.length ?? 0;
		if (selectedRowNumber > cellCount) {
			setSelectedRowNumber(null);
			onRowSelectionChange?.(null);
		}
	}, [parsed.notebook, selectedRowNumber, onRowSelectionChange]);

	useEffect(() => {
		const onRefresh = (event: Event) => {
			const detail = (event as CustomEvent<{ path?: string }>).detail;
			if (detail?.path !== path) return;
			void refresh();
		};

		const onClearSelection = (event: Event) => {
			const detail = (event as CustomEvent<{ path?: string }>).detail;
			if (detail?.path !== path) return;
			setSelectedRowNumber(null);
			onRowSelectionChange?.(null);
		};

		window.addEventListener(NOTEBOOK_FILE_REFRESH_EVENT, onRefresh);
		window.addEventListener(
			NOTEBOOK_ROW_CLEAR_SELECTION_EVENT,
			onClearSelection,
		);

		return () => {
			window.removeEventListener(NOTEBOOK_FILE_REFRESH_EVENT, onRefresh);
			window.removeEventListener(
				NOTEBOOK_ROW_CLEAR_SELECTION_EVENT,
				onClearSelection,
			);
		};
	}, [onRowSelectionChange, path, refresh]);

	const save = useCallback(async () => {
		if (!path) return;
		setIsSaving(true);
		setIoError(null);
		try {
			const response = await runPixel(
				`SaveInsightAssets(filePath=[${JSON.stringify(path)}], content=["<encode>${rawContent}</encode>"]);`,
				insightId,
			);

			if (response.errors.length > 0) {
				throw new Error(response.errors.join(", "));
			}

			setIsModified(false);
		} catch (error) {
			// Same rationale as refresh(): keep the editor content and toolbar
			// intact on failure so the user doesn't lose in-progress edits.
			setIoError(
				error instanceof Error
					? error.message
					: "Failed to save notebook file",
			);
		} finally {
			setIsSaving(false);
		}
	}, [insightId, path, rawContent]);

	const download = () => {
		const blob = new Blob([rawContent], {
			type: "application/x-ipynb+json",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		const fileName = path.split("/").pop() || "notebook.ipynb";
		link.href = url;
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(url);
	};

	const selectRow = (rowNumber: number, code: string, cellType: string) => {
		setSelectedRowNumber(rowNumber);
		onRowSelectionChange?.({
			insightId,
			path,
			queryId: "",
			cellId: "",
			rowNumber,
			code,
			cellType,
		});
	};

	const runCell = async (
		notebook: JupyterNotebook,
		cell: JupyterCodeCell,
		cellIndex: number,
	) => {
		if (!onRunCell) return;
		setRunningCellIndex(cellIndex);
		try {
			const result = await onRunCell({
				notebook,
				path,
				cellIndex,
				cell,
			});

			if (!result) return;

			const nextNotebook = updateNotebookCellExecution(
				notebook,
				cellIndex,
				result.outputs,
				result.executionCount,
			);

			setRawContent(JSON.stringify(nextNotebook, null, 2));
			setIsModified(true);
		} catch (error) {
			// A single cell's execution error (e.g. a network/pixel failure, not a
			// cell-level Python error - those come back as a normal error output)
			// is reported via the banner rather than left as a stuck spinner.
			setIoError(
				error instanceof Error
					? error.message
					: "Failed to run notebook cell",
			);
		} finally {
			setRunningCellIndex(null);
		}
	};

	const runAllCells = async () => {
		if (!onRunCell || !parsed.notebook) {
			return;
		}

		setIsRunningAllCells(true);
		setIoError(null);
		let workingNotebook = parsed.notebook;

		try {
			for (
				let cellIndex = 0;
				cellIndex < workingNotebook.cells.length;
				cellIndex += 1
			) {
				const cell = workingNotebook.cells[cellIndex];
				if (cell.cell_type !== "code") {
					continue;
				}

				setRunningCellIndex(cellIndex);
				const result = await onRunCell({
					notebook: workingNotebook,
					path,
					cellIndex,
					cell,
				});

				if (!result) {
					continue;
				}

				workingNotebook = updateNotebookCellExecution(
					workingNotebook,
					cellIndex,
					result.outputs,
					result.executionCount,
				);
			}

			setRawContent(JSON.stringify(workingNotebook, null, 2));
			setIsModified(true);
		} catch (error) {
			// Persist whatever cells finished executing before the failure -
			// workingNotebook already reflects those completed runs, so a mid-run
			// error only stops the remaining cells instead of discarding progress.
			setRawContent(JSON.stringify(workingNotebook, null, 2));
			setIsModified(true);
			setIoError(
				error instanceof Error
					? error.message
					: "Failed to run all notebook cells",
			);
		} finally {
			setRunningCellIndex(null);
			setIsRunningAllCells(false);
		}
	};

	const getCellKey = (
		cell: JupyterNotebook["cells"][number],
		index: number,
	) => {
		const metadataId =
			typeof cell.metadata?.id === "string" ? cell.metadata.id : null;
		if (metadataId) {
			return `id-${metadataId}`;
		}

		const source = Array.isArray(cell.source)
			? cell.source.join("")
			: cell.source;
		return `${cell.cell_type}-${source.slice(0, 80)}-${index}`;
	};

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden bg-background">
			<div className="flex w-full shrink-0 items-center justify-between gap-2 border-border border-b px-3 pt-[4px] pb-[7px]">
				<Tabs
					value={tab}
					onValueChange={(value) =>
						setTab(value as "edit" | "preview")
					}
				>
					<TabsList>
						<TabsTrigger value="edit">Edit</TabsTrigger>
						<TabsTrigger value="preview">Preview</TabsTrigger>
					</TabsList>
				</Tabs>
				<div className="flex items-center gap-1.5">
					{tab === "preview" && onRunCell && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => void runAllCells()}
							disabled={
								isRunningAllCells ||
								runningCellIndex !== null ||
								!parsed.notebook?.cells.some(
									(cell) => cell.cell_type === "code",
								)
							}
						>
							{isRunningAllCells
								? "Running All..."
								: "Run All Cells"}
						</Button>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => void refresh()}
						disabled={isLoading}
					>
						<RefreshCwIcon className="size-4" />
						Refresh
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => void save()}
						disabled={isSaving || !isModified}
					>
						<SaveIcon className="size-4" />
						Save
					</Button>
					<Button variant="outline" size="sm" onClick={download}>
						<DownloadIcon className="size-4" />
						Download
					</Button>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-auto p-3">
				{ioError && (
					<div className="mb-3 flex items-start gap-2 rounded border border-destructive/50 bg-destructive/5 p-3 text-destructive text-sm">
						<TriangleAlertIcon className="mt-0.5 size-4" />
						<span>{ioError}</span>
					</div>
				)}

				{tab === "edit" && (
					<textarea
						value={rawContent}
						onChange={(event) => {
							setRawContent(event.target.value);
							setIsModified(true);
						}}
						className="h-full min-h-[24rem] w-full rounded border border-border bg-background p-3 font-mono text-xs"
						spellCheck={false}
					/>
				)}

				{tab === "preview" && (
					<div className="flex flex-col gap-3">
						{isLoading && (
							<div className="rounded border border-border p-6 text-center text-muted-foreground text-sm">
								Loading notebook...
							</div>
						)}

						{/* Suppress the parse-error/empty-state banners while a load is
						    still in flight - rawContent starts empty on mount, which
						    would otherwise flash "Notebook file is empty" before the
						    real content arrives. */}
						{!isLoading && parsed.error && (
							<div className="flex items-start gap-2 rounded border border-destructive/50 bg-destructive/5 p-3 text-destructive text-sm">
								<TriangleAlertIcon className="mt-0.5 size-4" />
								<span>{parsed.error}</span>
							</div>
						)}

						{!isLoading &&
							!parsed.error &&
							parsed.notebook?.cells.map((cell, cellIndex) => (
								<NotebookCell
									key={getCellKey(cell, cellIndex)}
									cell={cell}
									cellIndex={cellIndex}
									isSelected={
										selectedRowNumber === cellIndex + 1
									}
									isRunning={runningCellIndex === cellIndex}
									onSelect={selectRow}
									onRun={
										cell.cell_type === "code"
											? async () =>
													runCell(
														parsed.notebook as JupyterNotebook,
														cell,
														cellIndex,
													)
											: undefined
									}
								/>
							))}

						{!isLoading &&
							!parsed.error &&
							parsed.notebook &&
							parsed.notebook.cells.length === 0 && (
								<div className="rounded border border-border border-dashed p-6 text-center text-muted-foreground text-sm">
									Notebook has no cells
								</div>
							)}

						{!isLoading && !parsed.error && !parsed.notebook && (
							<div className="rounded border border-border p-6 text-center text-muted-foreground text-sm">
								No notebook content
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};
