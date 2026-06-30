import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
	Blocks,
	DefaultBlocks,
	DefaultCells,
	MigrationManager,
	type SerializedState,
	STATE_VERSION,
	StateStore,
} from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import { Spinner, toast } from "@semoss/ui/next";
import { DEFAULT_NOTEBOOK_ID } from "@/components/app/templates/NotebookTemplate";
import { Notebook } from "@/components/notebook/notebook";
import { WorkspaceContext } from "@/contexts";
import { useRootStore } from "@/hooks";
import { WorkspaceStore } from "@/stores";

/**
 * Lightweight, embeddable view of a single app's notebook.
 *
 * This route (`/#/s/:appId/notebook`) is loaded inside the playground's MCP
 * tool result iframe for Notebook-template apps. The notebook tools advertise
 * it via their `SMSS_MCP_UI.resourceURI = "/notebook"` metadata, so the
 * playground points the iframe here after a read/add tool runs. Because the
 * Python MCP driver persists cell changes to the app's `blocks.json` before
 * the tool completes, simply re-loading the app's blocks here always reflects
 * the latest cells — no cross-frame write protocol is required.
 */
export const NotebookEmbedPage = observer(() => {
	const { appId } = useParams();
	const root = useRootStore();

	const [state, setState] = useState<StateStore | null>(null);
	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);
	const [notebookId, setNotebookId] = useState<string>(DEFAULT_NOTEBOOK_ID);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload only when the app changes
	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			try {
				const { pixelReturn, errors, insightId } = await runPixel<
					[SerializedState]
				>(`GetAppBlocksJson(project=["${appId}"]);`, "new");

				if (errors.length) {
					throw new Error(errors.join(""));
				}

				// get the output (SerializedState)
				let serialized = pixelReturn[0].output;

				// run migration if not up to date
				if (serialized.version !== STATE_VERSION) {
					const migration = new MigrationManager();
					serialized = await migration.run(serialized);
				}

				const s = new StateStore({
					mode: "static",
					insightId: insightId,
					state: serialized,
					// biome-ignore lint/suspicious/noExplicitAny: CellRegistry type variance
					cellRegistry: DefaultCells as any,
				});

				// Notebook cells call `useWorkspace()` (for `appId`, `setLoading`,
				// `agentModelEngine`), so the embed must supply a workspace just
				// like the edit page does. We don't call `workspace.load()` — no
				// FlexLayout model is needed because we render <Notebook /> directly
				// rather than through workspace panels.
				const ws = new WorkspaceStore(root, {
					appId: appId ?? "",
					insightId: insightId,
					type: "BLOCKS",
					role: "OWNER",
					metadata: {
						project_id: appId ?? "",
						project_name: "",
						project_type: "BLOCKS",
						project_cost: "",
						project_global: "",
						project_catalog_name: "",
						project_created_by: "",
						project_date_last_edited: "",
						project_created_by_type: "",
						project_date_created: "",
					},
				});

				if (cancelled) {
					return;
				}

				// pick a notebook to render: prefer the default, else the first
				const ids = Object.keys(serialized.queries ?? {});
				setNotebookId(
					ids.includes(DEFAULT_NOTEBOOK_ID)
						? DEFAULT_NOTEBOOK_ID
						: (ids[0] ?? DEFAULT_NOTEBOOK_ID),
				);
				setWorkspace(ws);
				setState(s);
			} catch (e) {
				if (!cancelled) {
					toast.error((e as Error).message);
				}
			}
		};

		load();

		return () => {
			cancelled = true;
		};
	}, [appId]);

	if (!state || !workspace) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
				<Spinner />
			</div>
		);
	}

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
