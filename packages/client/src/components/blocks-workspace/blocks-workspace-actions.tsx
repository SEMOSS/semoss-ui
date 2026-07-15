// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { Bot, Eye, Save, Share2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useBlocks } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import {
	ipynbToSemoss,
	type JupyterNotebook,
	type LiveCellState,
	type LiveNotebookState,
	type SemossNotebook,
	semossToIpynb,
	stateToIpynb,
} from "@semoss/shared/notebook";
import {
	Button,
	Dialog,
	DialogContent,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { ShareOverlay } from "@/components/ui";
import { PreviewOverlay } from "@/components/workspace";
import { useRootStore, useWorkspace } from "@/hooks";
import { DEFAULT_NOTEBOOK_ID, NOTEBOOK_APP_TAG } from "../app/templates";
import { LLMSelectOverlay } from "../llms";

export const BlocksWorkspaceActions = observer(() => {
	const { state } = useBlocks();

	const { monolithStore } = useRootStore();
	const { workspace } = useWorkspace();

	const [shareOpen, setShareOpen] = useState(false);
	const [shareDiffs, setShareDiffs] = useState(false);

	const removePageIdsFromURL = () => {
		const url = window.location.href;
		const pages = state.getAllBlocksOfType("page").map((page) => page.id);
		const matchedSubstring = pages.find((sub) => url.includes(sub));
		if (matchedSubstring) {
			const cleanedUrl = matchedSubstring
				? url
						.replace(matchedSubstring, "")
						.replace(/\/+$/, "") // remove trailing slash if left
				: url;
			window.location.href = cleanedUrl;
		}
	};
	/**
	 * Select default model
	 * TODO: We should probably just make this call in workspace so it persists across app
	 */
	const selectModel = async () => {
		let modelList = [];
		if (workspace.role === "OWNER" || workspace.role === "EDIT") {
			const pixel = `MyEngines(engineTypes=["MODEL"])`;
			const res = await runPixel(pixel);

			const list = res.pixelReturn[0].output as Array<{
				engine_subtype: string;
				engine_type: string;
				engine_name: string;
				engine_id: string;
			}>;

			modelList = list.map((model) => {
				return {
					label: model.engine_name,
					value: model.engine_id,
				};
			});
		}
		workspace.openOverlay(
			() => (
				<LLMSelectOverlay
					llmList={modelList || []}
					selectedLLM={workspace.agentModelEngine || ""}
					onSelect={(id: string) => {
						workspace.setAgentModelEngine(id);
					}}
					onClose={() => {
						workspace.closeOverlay();
					}}
				/>
			),
			{
				maxWidth: "sm",
			},
		);
	};

	/**
	 * Preview the current App
	 */
	const previewApp = () => {
		try {
			//before entering preview, remove page id's from the url if any exsist
			removePageIdsFromURL();
			// get the current state
			const json = state.toJSON();

			workspace.openOverlay(
				() => (
					<PreviewOverlay
						state={json}
						onClose={() => {
							workspace.closeOverlay();
						}}
					/>
				),
				{
					maxWidth: "3xl",
				},
			);
		} catch (e) {
			console.error(e);
			toast.error(e.message);
		}
	};

	/**
	 * Save the current app
	 */
	const saveApp = async () => {
		// turn on loading
		workspace.setLoading(true);

		// convert the state to json
		const json = state.toJSON();

		// remove the visual from the json
		Object.keys(json?.blocks).forEach((key) => {
			if (key.startsWith("e-chart")) {
				if (json?.blocks[key]?.data?.option?.visual) {
					json.blocks[key].data.option.visual = false;
				}
			}
		});

		// Check if this is a notebook app
		const tag = workspace.metadata?.tag;
		const tags = Array.isArray(tag) ? tag : tag ? [tag] : [];
		const isNotebookApp = tags.some((t) => String(t) === NOTEBOOK_APP_TAG);

		// For notebook apps, convert to Jupyter .ipynb format, preserving
		// live execution outputs (not just cell source) for cells run in this session,
		// and falling back to the last-saved outputs for cells that were not re-run.
		let jsonPayload: string;
		if (isNotebookApp) {
			// Baseline to preserve outputs of cells that are not re-executed
			// in this session (defaults to a fresh, structure-only conversion).
			let existingIpynb: JupyterNotebook = semossToIpynb(
				json as unknown as SemossNotebook,
			);
			try {
				const { pixelReturn: getReturn, errors: getErrors } =
					await monolithStore.runQuery<[JupyterNotebook]>(
						`GetAppBlocksJson(project=["${workspace.appId}"]);`,
					);
				if (getErrors.length === 0) {
					const existing = getReturn[0]?.output;
					if (
						existing &&
						typeof existing === "object" &&
						(existing as JupyterNotebook).nbformat === 4
					) {
						existingIpynb = existing as unknown as JupyterNotebook;
					}
				}
			} catch (e) {
				console.error(e);
				// best-effort — fall back to the structure-only baseline
			}

			const notebook = state.getNotebook(DEFAULT_NOTEBOOK_ID);
			const liveCells: Record<string, LiveCellState> = {};
			const list = notebook ? notebook.list : [];
			if (notebook) {
				for (const id of notebook.list) {
					const cell = notebook.cells[id];
					if (!cell) continue;
					liveCells[id] = {
						id: cell.id,
						widget: cell.widget,
						isExecuted: cell.isExecuted,
						executionCount: null,
						isError: cell.isError,
						operation: cell.operation,
						output: cell.output,
						messages: cell.messages,
						parameters: cell.parameters,
					};
				}
			}

			const liveNotebookState: LiveNotebookState = {
				id: DEFAULT_NOTEBOOK_ID,
				list,
				cells: liveCells,
			};

			jsonPayload = stateToIpynb(liveNotebookState, existingIpynb);
		} else {
			jsonPayload = JSON.stringify(json);
		}

		try {
			// save the json
			const { errors } = await monolithStore.runQuery<[true]>(
				`SaveAppBlocksJson(project=["${
					workspace.appId
				}"], json=["<encode>${jsonPayload}</encode>"], isNotebook=[${isNotebookApp}]);`,
			);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			toast.success(
				"Save successful! Make sure to double-check your changes for correctness",
			);
		} catch (e) {
			console.error(e);
			toast.error(e.message);
		} finally {
			// turn of loading
			workspace.setLoading(false);
		}
	};

	/**
	 * Share the current App
	 */
	const shareApp = async () => {
		// turn on loading
		workspace.setLoading(true);

		try {
			let isChanged = false;

			// only get the json if the user can edit
			if (workspace.role === "OWNER" || workspace.role === "EDIT") {
				const { pixelReturn, errors } = await monolithStore.runQuery<
					[true]
				>(`GetAppBlocksJson ( project=['${workspace.appId}']);`);

				if (errors.length > 0) {
					throw new Error(errors.join(""));
				}

				const { output } = pixelReturn[0];

				// Convert ipynb format to SEMOSS format for comparison if needed
				let savedState = output;
				if (
					output &&
					typeof output === "object" &&
					"nbformat" in output &&
					(output as JupyterNotebook).nbformat === 4
				) {
					savedState = ipynbToSemoss(
						output as unknown as JupyterNotebook,
					);
				}

				// TODO: Do we want a better way to check if it is changed
				isChanged =
					JSON.stringify(savedState) !==
					JSON.stringify(state.toJSON());
			}

			setShareDiffs(isChanged);
			setShareOpen(true);
		} catch (e) {
			console.error(e);
			toast.error(e.message);
		} finally {
			// turn of loading
			workspace.setLoading(false);
		}
	};

	useEffect(() => {
		/**
		 * Trigger save on ctrl + s or command + s
		 */
		const onDocumentKeydown = (event: KeyboardEvent) => {
			if ((event.ctrlKey || event.metaKey) && event.key === "s") {
				event.preventDefault();
				saveApp();
			}
		};

		// attach the event listener
		document.addEventListener("keydown", onDocumentKeydown);

		// remove the event listener
		return () => {
			document.removeEventListener("keydown", onDocumentKeydown);
		};
	}, []);

	return (
		<div className="flex flex-row items-center gap-1">
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							selectModel();
						}}
					>
						<Bot
							className={`size-4 ${workspace.agentModelEngine ? "text-primary" : "text-muted-foreground"}`}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>Modal Selection</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							previewApp();
						}}
					>
						<Eye className="h-[1em] w-[1em]" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Preview App</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							shareApp();
						}}
					>
						<Share2 className="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Share App</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => {
							saveApp();
						}}
					>
						<Save className="size-4" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Save App (ctrl/command + s)</TooltipContent>
			</Tooltip>

			<Dialog
				open={shareOpen}
				onOpenChange={(o) => !o && setShareOpen(false)}
			>
				<DialogContent className="max-w-lg p-0">
					<ShareOverlay
						appId={workspace.appId}
						diffs={shareDiffs}
						onClose={() => setShareOpen(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
});
