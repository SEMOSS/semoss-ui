import { reaction } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
	Blocks,
	DefaultBlocks,
	DefaultCells,
	type SerializedState,
	StateStore,
} from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import { notifyFileEditorRefresh } from "@semoss/shared";
import {
	ipynbToSemoss,
	type SemossNotebook,
	stateToIpynb,
} from "@semoss/shared/notebook";
import { Spinner } from "@semoss/ui/next";
import { Notebook } from "@/components/notebook";
import { WorkspaceContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import { WorkspaceStore } from "@/stores";

/**
 * NotebookPreviewPage — renders a .notebook.json or .ipynb insight-asset file as a
 * fully-interactive notebook (the real <Notebook> component with executable
 * cells) inside the client app. Used as the iframe target when the playground's
 * Preview tab is clicked on a notebook file.
 *
 * Both formats are supported:
 * - .notebook.json: SEMOSS custom format (loaded directly)
 * - .ipynb: Jupyter format (converted to SEMOSS format for rendering)
 *
 * Query Parameters:
 * - insightId: ID of the insight that owns the file
 * - path:      Asset path to the notebook file
 */
export const NotebookPreviewPage = observer(() => {
	const [searchParams] = useSearchParams();
	const insightId = searchParams.get("insightId");
	const filePath = searchParams.get("path");

	const root = useRootStore();

	type NotebookData = {
		state: StateStore;
		workspace: WorkspaceStore;
		notebookId: string;
		/** Original parsed .ipynb object — used to preserve metadata on re-save. Null for .notebook.json files. */
		parsedIpynb: Record<string, unknown> | null;
	};

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<NotebookData | null>(null);
	// Track execution transitions and persisted counts across autosaves.
	const autosaveStateRef = useRef<{
		loadingByCell: Record<string, boolean>;
		executionCountByCell: Record<string, number | null>;
	}>({
		loadingByCell: {},
		executionCountByCell: {},
	});

	useEffect(() => {
		if (!insightId || !filePath) {
			setError("Missing insightId or path parameter");
			setIsLoading(false);
			return;
		}

		const loadNotebook = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Load the notebook JSON file from the insight's assets
				const {
					pixelReturn,
					errors,
					insightId: returnedInsightId,
				} = await runPixel<[string]>(
					`GetInsightAssets(filePath=["${filePath}"]);`,
					insightId,
				);

				if (errors.length > 0) {
					throw new Error(errors.join(", "));
				}

				const content = pixelReturn[0]?.output;
				if (!content) {
					throw new Error("Failed to load notebook file");
				}

				// Detect file format and parse accordingly
				let serialized: SemossNotebook | null = null;
				let parsedIpynb: Record<string, unknown> | null = null;
				try {
					const parsed = JSON.parse(content);
					// Check if it's .ipynb format (nbformat === 4)
					if (parsed.nbformat === 4 && Array.isArray(parsed.cells)) {
						// Convert .ipynb to SEMOSS format
						parsedIpynb = parsed;
						serialized = ipynbToSemoss(parsed);
					} else if (
						parsed.version === "1" &&
						typeof parsed.queries === "object"
					) {
						// Already in SEMOSS format (.notebook.json)
						serialized = parsed as SemossNotebook;
					} else {
						throw new Error("Invalid notebook format");
					}
				} catch (parseError) {
					throw new Error(
						`Failed to parse notebook: ${
							parseError instanceof Error
								? parseError.message
								: "Unknown error"
						}`,
					);
				}

				// Get the first notebook ID from the state
				const notebookId = Object.keys(serialized?.queries ?? {})[0];
				if (!notebookId) {
					throw new Error("No notebook found in file");
				}

				// Create a StateStore with interactive mode so cells can be executed
				const s = new StateStore({
					mode: "interactive",
					insightId: returnedInsightId,
					state: serialized as unknown as SerializedState,
					// biome-ignore lint/suspicious/noExplicitAny: CellRegistry generic type must be widened to base type
					cellRegistry: DefaultCells as any,
				});

				// Create a WorkspaceStore so <Notebook> child components can call useWorkspace()
				const ws = new WorkspaceStore(root, {
					appId: "notebook-preview",
					insightId: returnedInsightId,
					type: "BLOCKS",
					role: "OWNER",
					metadata: {
						project_id: "notebook-preview",
						project_name: filePath.split("/").pop() ?? "Notebook",
						project_type: "BLOCKS",
						project_cost: "0",
						project_global: "false",
						project_catalog_name: "",
						project_created_by: "",
						project_date_last_edited: "",
						project_created_by_type: "",
						project_date_created: "",
					},
				});

				setData({ state: s, workspace: ws, notebookId, parsedIpynb });
			} catch (e) {
				console.error("Failed to load notebook:", e);
				setError(
					e instanceof Error ? e.message : "Failed to load notebook",
				);
			} finally {
				setIsLoading(false);
			}
		};

		loadNotebook();
	}, [insightId, filePath, root]);

	// After any cell finishes executing, write the updated execution_count and
	// outputs back to the .ipynb file so the Edit tab stays in sync.
	useEffect(() => {
		if (!data || !filePath || !data.parsedIpynb) return;

		const { state, notebookId, parsedIpynb } = data;
		const notebook = state.notebooks[notebookId];
		if (!notebook) return;

		// Initialize baseline execution counts from the loaded .ipynb.
		const baselineCounts: Record<string, number | null> = {};
		const ipynbCells = Array.isArray(parsedIpynb.cells)
			? parsedIpynb.cells
			: [];
		for (let i = 0; i < notebook.list.length; i++) {
			const cellId = notebook.list[i];
			const ipynbCell = ipynbCells[i];
			if (ipynbCell && ipynbCell.cell_type === "code") {
				const count =
					typeof ipynbCell.execution_count === "number"
						? ipynbCell.execution_count
						: null;
				baselineCounts[cellId] = count;
			}
		}
		autosaveStateRef.current = {
			loadingByCell: Object.fromEntries(
				notebook.list.map((id) => [
					id,
					Boolean(notebook.cells[id]?.isLoading),
				]),
			),
			executionCountByCell: baselineCounts,
		};

		// React on any cell's isLoading/isExecuted changing.
		// Fires synchronously when the reaction source changes.
		const disposer = reaction(
			() =>
				notebook.list
					.map((id) => {
						const cell = notebook.cells[id];
						return cell
							? `${id}:${cell.isLoading}:${cell.isExecuted}`
							: id;
					})
					.join(","),
			() => {
				const previousLoading = autosaveStateRef.current.loadingByCell;
				const currentLoading: Record<string, boolean> = {};
				for (const id of notebook.list) {
					currentLoading[id] = Boolean(notebook.cells[id]?.isLoading);
				}

				const finishedIds = notebook.list.filter(
					(id) => previousLoading[id] && !currentLoading[id],
				);

				autosaveStateRef.current.loadingByCell = currentLoading;

				// Only save when no cell is actively running.
				const anyLoading = notebook.list.some(
					(id) => notebook.cells[id]?.isLoading,
				);
				if (anyLoading) return;

				// Save only when at least one run has just completed.
				if (finishedIds.length === 0) return;

				// Increment execution_count per code cell when that cell run completes.
				for (const id of finishedIds) {
					const c = notebook.cells[id];
					if (
						!c ||
						c.widget.toLowerCase() !== "code" ||
						!c.isExecuted
					) {
						continue;
					}

					const existing =
						autosaveStateRef.current.executionCountByCell[id];
					autosaveStateRef.current.executionCountByCell[id] =
						typeof existing === "number" ? existing + 1 : 1;
				}

				// Build live cell state for the converter.
				const liveCells: Record<
					string,
					import("@semoss/shared/notebook").LiveCellState
				> = {};
				for (const id of notebook.list) {
					const c = notebook.cells[id];
					if (!c) continue;
					liveCells[id] = {
						id: c.id,
						widget: c.widget,
						isExecuted: c.isExecuted,
						executionCount:
							autosaveStateRef.current.executionCountByCell[id] ??
							null,
						isError: c.isError,
						operation: c.operation,
						output: c.output,
						messages: c.messages,
						parameters: c.parameters,
					};
				}

				const updatedJson = stateToIpynb(
					{ id: notebookId, list: notebook.list, cells: liveCells },
					parsedIpynb as unknown as import("@semoss/shared/notebook").JupyterNotebook,
				);

				// Save back to disk silently (best-effort).
				runPixel(
					`SaveInsightAssets(filePath=[${JSON.stringify(filePath)}], content=["<encode>${updatedJson}</encode>"]);`,
					state.insightId,
				)
					.then(() => {
						notifyFileEditorRefresh(
							filePath,
							`INSIGHT:${state.insightId}`,
						);
					})
					.catch(() => {
						// non-critical — silent fail
					});
			},
			{ fireImmediately: false },
		);

		return () => {
			disposer();
		};
	}, [data, filePath]);

	if (isLoading) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-background">
				<Spinner className="size-8" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background p-4 text-foreground">
				<h1 className="font-semibold text-xl">
					Failed to Load Notebook
				</h1>
				<p className="text-muted-foreground">{error}</p>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-background">
				<p className="text-muted-foreground">No notebook content</p>
			</div>
		);
	}

	const { state, workspace, notebookId } = data;

	return (
		<div className="fixed inset-0 bg-background text-foreground">
			<WorkspaceContext.Provider value={{ workspace }}>
				<Blocks state={state} registry={DefaultBlocks}>
					<Notebook id={notebookId} />
				</Blocks>
			</WorkspaceContext.Provider>
		</div>
	);
});
