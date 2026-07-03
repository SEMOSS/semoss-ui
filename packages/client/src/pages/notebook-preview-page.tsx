import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
	Blocks,
	DefaultBlocks,
	DefaultCells,
	StateStore,
} from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { Notebook } from "@/components/notebook";
import { WorkspaceContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import { WorkspaceStore } from "@/stores";

/**
 * NotebookPreviewPage — renders a .notebook.json insight-asset file as a
 * fully-interactive notebook (the real <Notebook> component with executable
 * cells) inside the client app.  Used as the iframe target when the
 * playground's Preview tab is clicked on a .notebook.json file.
 *
 * Query Parameters:
 * - insightId: ID of the insight that owns the file
 * - path:      Asset path to the .notebook.json file
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
	};

	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<NotebookData | null>(null);

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

				// Parse the notebook file
				const serialized = JSON.parse(content);

				// Get the first notebook ID from the state
				const notebookId = Object.keys(serialized.queries ?? {})[0];
				if (!notebookId) {
					throw new Error("No notebook found in file");
				}

				// Create a StateStore with interactive mode so cells can be executed
				const s = new StateStore({
					mode: "interactive",
					insightId: returnedInsightId,
					state: serialized,
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

				setData({ state: s, workspace: ws, notebookId });
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
