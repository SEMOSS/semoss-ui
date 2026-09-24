import {
	ActivityIcon,
	BracesIcon,
	ChevronRightIcon,
	FileCode2Icon,
	FolderTreeIcon,
	PanelRightIcon,
	SettingsIcon,
	Share2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Link } from "react-router";
import {
	AgentRunDialog,
	type AutomationCanvasHandle,
	AutomationEditorPanel,
	AutomationInspectorPanel,
	type AutomationInspectorSnapshot,
	type AutomationNodeTrace,
	AutomationOutputModal,
	type AutomationRunDetail,
	AutomationTracePanel,
	type AutomationTraceSnapshot,
	AutomationWorkbenchContext,
	type AutomationWorkbenchContextValue,
	type N8nImportConversionInput,
	type N8nImportConversionResult,
} from "@semoss/automation";
import {
	FILE_PANEL_COMPONENTS,
	FILE_PANEL_EVENTS,
	type FileSavedEvent,
	getFilePanelScope,
} from "@semoss/panels";
import { runPixel } from "@semoss/sdk";
import { InsightProvider } from "@semoss/sdk/react";
import { type MCPConfig, MonacoEditor } from "@semoss/shared";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	useWorkbench,
	useWorkbenchEvent,
	Workbench,
	type WorkbenchComponent,
	type WorkbenchLayout,
	type WorkbenchPanelConfigAny,
} from "@semoss/workbench";
import { ASSISTANT_PANEL } from "@/components/assistant";
import { stripMcpToolAlias } from "@/components/assistant/assistant-tools";
import { ProjectDetailTabs } from "@/components/project";
import { ShareOverlay } from "@/components/ui";
import { AssistantStoreProvider, WorkbenchProvider } from "@/contexts";
import { useAssistantStore, useProject } from "@/hooks";
import type { BuildTool } from "@/stores/assistant";
import { AUTOMATION_BUILDER_AGENT } from "@/stores/assistant/assistant-agents";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../../shared";
import { AUTOMATION_RUN_FILES_PANEL } from "./automation-run-files-panel";
import { AutomationSettingsToggle } from "./automation-settings-toggle";

const AUTOMATION_MUTATION_TOOLS = new Set([
	"AddAutomationStep",
	"UpdateAutomationStep",
	"UpdateAutomationCustomStep",
	"RemoveAutomationStep",
]);
const MAX_ASSISTANT_DRAFT_LENGTH = 8000;
const SINGLE_STEP_ID_KEYS = ["stepId", "nodeId", "step_id", "node_id", "id"];
const STEP_ID_LIST_KEYS = ["stepIds", "nodeIds", "step_ids", "node_ids", "ids"];

function extractChangedStepIds(
	toolArguments: Record<string, unknown> | undefined,
): string[] {
	if (!toolArguments) return [];
	const ids = new Set<string>();
	for (const key of SINGLE_STEP_ID_KEYS) {
		const value = toolArguments[key];
		if (typeof value === "string" && value.length > 0) ids.add(value);
	}
	for (const key of STEP_ID_LIST_KEYS) {
		const value = toolArguments[key];
		if (Array.isArray(value)) {
			for (const item of value) {
				if (typeof item === "string" && item.length > 0) ids.add(item);
			}
		}
	}
	return Array.from(ids);
}

const EDITOR = "automation-editor";
const INSPECTOR = "automation-inspector";
const TRACE = "automation-trace";
const RUN_FILES = "automation-run-files";
const FILES = WORKBENCH_COMPONENTS.FILE_EXPLORER;
const FILE_EDITOR = WORKBENCH_COMPONENTS.FILE_CODE_EDITOR;
const MCP_EDITOR = WORKBENCH_COMPONENTS.FILE_MCP_EDITOR;
const SETTINGS = WORKBENCH_COMPONENTS.PROJECT_SETTINGS;
// Backend writes each custom-Python node's compiled source here as a real
// project asset (see SaveAutomation) — this is the same file the workflow
// executes from.
const AUTOMATION_NODES_ASSET_PATH = "/automation-nodes/";

// Node ids are minted as `${type}-${crypto.randomUUID()}` (see automation-workflow-adapter.ts),
// but the backend names each compiled asset after the step's label slug, not its type — e.g.
// imported n8n steps get saved as "prepare_incident_context__<uuid>.py" instead of
// "developer-python-<uuid>.py". The uuid suffix is the only part guaranteed to match.
const UUID_PATTERN =
	/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Find the on-disk asset for a node's Python source, so the "Open Editor"
 * button can open the real file instead of an in-memory copy of it.
 *
 * @param appId - Project the automation lives in.
 * @param nodeId - Node whose compiled source file we're looking for.
 * @return The asset's name/path, or null if none was found (e.g. the node
 * hasn't been saved yet).
 */
async function findAutomationNodeAsset(
	appId: string,
	nodeId: string,
): Promise<{ name: string; path: string } | null> {
	const response = await runPixel(
		`BrowseAppAssets(filePath=${JSON.stringify([
			AUTOMATION_NODES_ASSET_PATH,
		])}, project=${JSON.stringify([appId])});`,
	);
	if (response.errors.length > 0) return null;
	const entries = response.pixelReturn?.[0]?.output;
	if (!Array.isArray(entries)) return null;
	const nodeUuid = nodeId.match(UUID_PATTERN)?.[0];
	const match = entries.find(
		(entry): entry is { name: string; path: string } => {
			if (
				!entry ||
				typeof entry !== "object" ||
				typeof (entry as { name?: unknown }).name !== "string"
			) {
				return false;
			}
			const name = (entry as { name: string }).name;
			return nodeUuid ? name.includes(nodeUuid) : name.includes(nodeId);
		},
	);
	return match ? { name: match.name, path: match.path } : null;
}

const SETTINGS_TABS: React.ComponentProps<typeof ProjectDetailTabs>["tabs"] = [
	{ name: "Overview", component: "project-overview" },
	{
		name: "MCP",
		component: "mcp-usage",
		restrict: ["OWNER", "EDIT", "READ_ONLY"],
	},
	{ name: "GitHub", component: "github", restrict: ["OWNER"] },
	{ name: "Settings", component: "settings", restrict: ["OWNER"] },
	{
		name: "Access Control",
		component: "access-control",
		restrict: ["OWNER", "EDIT"],
	},
	{ name: "SMSS", component: "smss", restrict: ["OWNER"] },
];

const createAutomationLayout = (appId: string): WorkbenchLayout => ({
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [EDITOR],
		activeId: EDITOR,
		enableDeleteWhenEmpty: false,
	},
	panels: {
		[EDITOR]: {
			id: EDITOR,
			type: EDITOR,
			name: "Editor",
			canClose: false,
			config: {},
		},
		[INSPECTOR]: {
			id: INSPECTOR,
			type: INSPECTOR,
			name: "Inspector",
			canClose: false,
		},
		[FILES]: {
			id: FILES,
			type: FILES,
			name: "Files",
			canClose: false,
			config: { mode: { type: "APP", app: appId } },
		},
		[TRACE]: {
			id: TRACE,
			type: TRACE,
			name: "Run details",
			canClose: false,
		},
		[RUN_FILES]: {
			id: RUN_FILES,
			type: RUN_FILES,
			name: "Run files",
			canClose: false,
		},
		[SETTINGS]: {
			id: SETTINGS,
			type: SETTINGS,
			name: "Settings",
			canClose: true,
		},
		[MCP_EDITOR]: {
			id: MCP_EDITOR,
			type: MCP_EDITOR,
			name: "MCP",
			canClose: true,
		},
		[WORKBENCH_COMPONENTS.ASSISTANT]: {
			id: WORKBENCH_COMPONENTS.ASSISTANT,
			type: WORKBENCH_COMPONENTS.ASSISTANT,
			name: "Assistant",
			canClose: false,
		},
	},
	borders: {
		left: { panelIds: [FILES, RUN_FILES], activeId: null, size: 320 },
		bottom: { panelIds: [TRACE], activeId: null, size: 300 },
		right: {
			panelIds: [INSPECTOR, WORKBENCH_COMPONENTS.ASSISTANT],
			activeId: WORKBENCH_COMPONENTS.ASSISTANT,
			size: 400,
		},
	},
});

interface AutomationWorkbenchProps {
	appId: string;
	readOnly: boolean;
	projectName: string;
	catalogPath?: string;
	onShare: () => void;
}

const AutomationSettingsPanel: WorkbenchComponent = () => (
	<ProjectDetailTabs tabs={SETTINGS_TABS} />
);

function parseConversionModelOutput(
	output: unknown,
): N8nImportConversionResult {
	let candidate = output;
	for (let depth = 0; depth < 3; depth += 1) {
		if (typeof candidate === "string") {
			const normalized = candidate
				.trim()
				.replace(/^```(?:json)?\s*/i, "")
				.replace(/\s*```$/i, "")
				.trim();
			candidate = JSON.parse(normalized);
			continue;
		}
		if (
			candidate &&
			typeof candidate === "object" &&
			!Array.isArray(candidate)
		) {
			const object = candidate as Record<string, unknown>;
			if (Array.isArray(object.conversions)) break;
			const nested = object.response ?? object.output;
			if (nested !== undefined) {
				candidate = nested;
				continue;
			}
		}
		break;
	}
	if (
		!candidate ||
		typeof candidate !== "object" ||
		!Array.isArray((candidate as { conversions?: unknown }).conversions)
	) {
		throw new Error("The conversion model returned an invalid response.");
	}
	return candidate as N8nImportConversionResult;
}

async function getFirstTextGenerationModelId(): Promise<string> {
	const response = await runPixel(
		'META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);',
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}
	const output = response.pixelReturn?.[0]?.output;
	if (Array.isArray(output)) {
		const firstModel = output[0];
		if (
			firstModel &&
			typeof firstModel === "object" &&
			typeof (firstModel as { engine_id?: unknown }).engine_id ===
				"string"
		) {
			return (firstModel as { engine_id: string }).engine_id;
		}
	}
	throw new Error("No text-generation model is available for conversion.");
}

const AUTOMATION_COMPONENTS: Record<string, WorkbenchPanelConfigAny> = {
	[EDITOR]: {
		name: "Editor",
		canClose: false,
		canRename: false,
		icon: ({ className }) => <FileCode2Icon className={className} />,
		// Without this, switching the main tabset to a Python file tab unmounts
		// the canvas (default "lazy"), wiping editingStep/inspector selection
		// and every other in-memory canvas state — it only ever shared a
		// tabset with itself before file tabs could open alongside it.
		mount: "keepAlive",
		content: AutomationEditorPanel,
	},
	[INSPECTOR]: {
		name: "Inspector",
		canClose: false,
		canRename: false,
		enableBorderHeader: false,
		icon: ({ className }) => <PanelRightIcon className={className} />,
		mount: "keepAlive",
		content: AutomationInspectorPanel,
	},
	[FILES]: {
		...FILE_PANEL_COMPONENTS[WORKBENCH_COMPONENTS.FILE_EXPLORER],
		canRename: false,
		enableBorderHeader: false,
		icon: ({ className }) => <FolderTreeIcon className={className} />,
	},
	[FILE_EDITOR]: {
		...FILE_PANEL_COMPONENTS[WORKBENCH_COMPONENTS.FILE_CODE_EDITOR],
		canRename: false,
	},
	[WORKBENCH_COMPONENTS.FILE_DOWNLOAD]: {
		...FILE_PANEL_COMPONENTS[WORKBENCH_COMPONENTS.FILE_DOWNLOAD],
		canRename: false,
	},
	[WORKBENCH_COMPONENTS.FILE_IMAGE_VIEWER]: {
		...FILE_PANEL_COMPONENTS[WORKBENCH_COMPONENTS.FILE_IMAGE_VIEWER],
		canRename: false,
	},
	[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]: {
		...FILE_PANEL_COMPONENTS[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR],
		canRename: false,
	},
	[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]: {
		...FILE_PANEL_COMPONENTS[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR],
		canRename: false,
	},
	[WORKBENCH_COMPONENTS.FILE_PDF_VIEWER]: {
		...FILE_PANEL_COMPONENTS[WORKBENCH_COMPONENTS.FILE_PDF_VIEWER],
		canRename: false,
	},
	[WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER]: {
		...FILE_PANEL_COMPONENTS[WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER],
		canRename: false,
	},
	[MCP_EDITOR]: {
		...FILE_PANEL_COMPONENTS[WORKBENCH_COMPONENTS.FILE_MCP_EDITOR],
		canRename: false,
		icon: ({ className }) => <BracesIcon className={className} />,
	},
	[TRACE]: {
		name: "Run details",
		canClose: false,
		canRename: false,
		enableBorderHeader: false,
		icon: ({ className }) => <ActivityIcon className={className} />,
		mount: "keepAlive",
		content: AutomationTracePanel,
	},
	[RUN_FILES]: AUTOMATION_RUN_FILES_PANEL,
	[SETTINGS]: {
		name: "Settings",
		canRename: false,
		icon: ({ className }) => <SettingsIcon className={className} />,
		content: AutomationSettingsPanel,
	},
	[WORKBENCH_COMPONENTS.ASSISTANT]: {
		...ASSISTANT_PANEL,
	},
};

export const AutomationWorkbench = observer(
	({
		appId,
		readOnly,
		projectName,
		catalogPath,
		onShare,
	}: AutomationWorkbenchProps) => {
		const layoutActions = useWorkbench((state) => state.layout.actions);
		const workbenchLayout = useMemo(
			() => createAutomationLayout(appId),
			[appId],
		);
		// Paths of every open Python-node file tab, so the inline editor can lock
		// itself while the same file is being edited in a real editor tab.
		// Selects the stable `panels` record, not a derived array — an inline
		// filter/map here would return a new array reference on every store
		// notification, defeating useSyncExternalStore's snapshot check and
		// spinning into "Maximum update depth exceeded".
		const panels = useWorkbench((state) => state.layout.panels);
		const openPythonNodeFilePaths = useMemo(
			() =>
				Object.values(panels)
					.filter((record) => record.type === FILE_EDITOR)
					.map(
						(record) =>
							(record.config as { path?: string } | undefined)
								?.path,
					)
					.filter((path): path is string => Boolean(path)),
			[panels],
		);
		const isPythonFileOpen = useCallback(
			(nodeId: string) => {
				const nodeUuid = nodeId.match(UUID_PATTERN)?.[0];
				return openPythonNodeFilePaths.some((path) =>
					nodeUuid ? path.includes(nodeUuid) : path.includes(nodeId),
				);
			},
			[openPythonNodeFilePaths],
		);
		const workbenchId = readOnly ? `${appId}--read-only` : appId;
		const assistantStore = useAssistantStore(workbenchId);
		const conversionModel = useCallback(
			async (
				input: N8nImportConversionInput,
			): Promise<N8nImportConversionResult> => {
				const engineId =
					assistantStore.getState().model?.engine_id ??
					(await getFirstTextGenerationModelId());
				const prompt = JSON.stringify({
					instruction:
						"Convert the unsupported n8n nodes into SEMOSS automation nodes. Return JSON only. Do not change node IDs or connections. Omit a conversion when no safe mapping exists; the caller will retain a Python placeholder.",
					nodes: input.nodes,
					workflow: {
						name: input.workflow.name,
						connections: input.workflow.connections,
					},
					availableNodeTypes: input.availableNodeTypes,
					responseShape: {
						conversions: [
							{
								nodeId: "string",
								type: "supported SEMOSS node type",
								config: "object",
								codeMode: "generated or custom",
								pythonSource: "optional string",
								label: "optional string",
							},
						],
					},
				});
				const response = await runPixel(
					`LLM(engine=${JSON.stringify(engineId)}, command=["<encode>${prompt}</encode>"]);`,
				);
				if (response.errors.length > 0) {
					throw new Error(response.errors.join("\n"));
				}
				return parseConversionModelOutput(
					response.pixelReturn?.[0]?.output,
				);
			},
			[assistantStore],
		);
		const setAssistantDraft = assistantStore.getState().setDraft;
		const canvasRef = useRef<AutomationCanvasHandle>(null);
		const [traceSnapshot, setTraceSnapshot] =
			useState<AutomationTraceSnapshot | null>(null);
		const [selectedRun, setSelectedRun] =
			useState<AutomationRunDetail | null>(null);
		const [outputModal, setOutputModal] = useState<string | null>(null);
		const [inspectorSnapshot, setInspectorSnapshot] =
			useState<AutomationInspectorSnapshot | null>(null);
		const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
		const [agentRunTrace, setAgentRunTrace] =
			useState<AutomationNodeTrace | null>(null);
		const [agentRunAutomationUpdate, setAgentRunAutomationUpdate] =
			useState<AutomationRunDetail | null>(null);
		const [pythonEditor, setPythonEditor] = useState<{
			nodeId: string;
			source: string;
			/** Source the dialog opened with, so dismissing without an edit changes nothing. */
			openedWith: string;
		} | null>(null);
		// The node "View run details" last asked to be focused, and a token bumped on every
		// call so re-focusing the same node (after navigating away) still takes effect.
		const [runDetailsFocus, setRunDetailsFocus] = useState<{
			nodeId: string;
			token: number;
		} | null>(null);
		const wasRunningRef = useRef(false);
		const editingStepIdRef = useRef<string | null>(null);
		// Which node a Python-node file tab's path belongs to, so a save of it
		// can be mirrored onto that node's in-memory step (see syncPythonSource).
		const pythonNodeAssetPathsRef = useRef(new Map<string, string>());

		const selectPanel = useCallback(
			(panelId: string) => {
				layoutActions.selectPanel(panelId);
			},
			[layoutActions],
		);

		const sendPythonSource = useCallback(
			(source: string, nodeId: string) => {
				const step = inspectorSnapshot?.editingStep;
				if (
					!step ||
					step.id !== nodeId ||
					inspectorSnapshot?.readOnly
				) {
					return;
				}
				canvasRef.current?.applyInspectorAction({
					type: "update-step",
					step: {
						...step,
						workflowCodeMode: "custom",
						workflowConfig: {
							...step.workflowConfig,
							pythonSource: source,
						},
					},
				});
			},
			[inspectorSnapshot],
		);

		const automationMcp = useMemo<MCPConfig[]>(
			() =>
				readOnly
					? []
					: [
							{
								id: appId,
								name: "Automation Project Tools",
								type: "PROJECT",
							},
						],
			[appId, readOnly],
		);
		const notifyAutomationChanged = useCallback(
			(change?: { toolName: string; changedStepIds: string[] }) => {
				canvasRef.current?.refresh(change);
			},
			[],
		);
		const handleAutomationToolCompleted = useCallback(
			(tool: BuildTool) => {
				const toolName = stripMcpToolAlias(tool.name, tool.metadata);
				if (AUTOMATION_MUTATION_TOOLS.has(toolName)) {
					notifyAutomationChanged({
						toolName,
						changedStepIds: extractChangedStepIds(tool.arguments),
					});
				}
			},
			[notifyAutomationChanged],
		);
		const handleTraceChange = useCallback(
			(snapshot: AutomationTraceSnapshot) => {
				setTraceSnapshot(snapshot);
				// Only switch tabs on the false->true transition — the canvas re-emits this
				// snapshot on every progress tick while a run is in flight, and re-selecting an
				// already-active panel on every tick is unnecessary render churn.
				if (snapshot.running && !wasRunningRef.current) {
					selectPanel(TRACE);
				}
				wasRunningRef.current = snapshot.running;
			},
			[selectPanel],
		);
		const handleInspectorChange = useCallback(
			(snapshot: AutomationInspectorSnapshot) => {
				setInspectorSnapshot(snapshot);
				const editingStepId = snapshot.editingStep?.id ?? null;
				// Only switch tabs when a different step starts being edited, not on every
				// snapshot re-emitted while the same step stays open (e.g. its run status ticking).
				if (
					editingStepId &&
					editingStepId !== editingStepIdRef.current
				) {
					selectPanel(INSPECTOR);
				}
				editingStepIdRef.current = editingStepId;
			},
			[selectPanel],
		);
		const handleHistoryChanged = useCallback(() => {
			setHistoryRefreshToken((token) => token + 1);
		}, []);
		const handleViewRun = useCallback((run: AutomationRunDetail) => {
			setSelectedRun(run);
			canvasRef.current?.viewHistoricalRun(run);
		}, []);
		const handleExitHistoricalView = useCallback(() => {
			setSelectedRun(null);
			canvasRef.current?.exitHistoricalView();
		}, []);
		const handleAskAssistant = useCallback(
			(prompt: string) => {
				setAssistantDraft(prompt.slice(0, MAX_ASSISTANT_DRAFT_LENGTH));
				selectPanel(WORKBENCH_COMPONENTS.ASSISTANT);
			},
			[selectPanel, setAssistantDraft],
		);
		const handleViewRunDetails = useCallback(
			(stepId: string) => {
				setRunDetailsFocus((current) => ({
					nodeId: stepId,
					token: (current?.token ?? 0) + 1,
				}));
				selectPanel(TRACE);
			},
			[selectPanel],
		);
		const handleOpenPythonEditor = useCallback(
			async (nodeId: string, source: string) => {
				const asset = await findAutomationNodeAsset(appId, nodeId);
				if (asset) {
					pythonNodeAssetPathsRef.current.set(asset.path, nodeId);
					layoutActions.selectPanel(
						FILE_EDITOR,
						{
							mode: { type: "APP", app: appId },
							name: asset.name,
							path: asset.path,
						},
						{ name: asset.name },
					);
					return;
				}
				// No compiled asset yet (e.g. a brand-new node) — fall back to
				// editing the in-memory draft in the modal.
				setPythonEditor({ nodeId, source, openedWith: source });
			},
			[appId, layoutActions],
		);

		// A save from the file-editor tab writes straight to the asset, bypassing
		// the canvas's in-memory step entirely — mirror it back in so a later
		// canvas Save can't clobber the file with the stale copy it loaded with.
		useWorkbenchEvent<FileSavedEvent>(
			FILE_PANEL_EVENTS.FILE_SAVED,
			(event) => {
				const nodeId = pythonNodeAssetPathsRef.current.get(event.path);
				if (
					!nodeId ||
					event.scope !==
						getFilePanelScope({ type: "APP", app: appId })
				) {
					return;
				}
				void (async () => {
					const response = await runPixel<[string]>(
						`GetAppAssets(filePath=${JSON.stringify([event.path])}, project=${JSON.stringify([appId])});`,
					);
					if (response.errors.length > 0) return;
					const content = response.pixelReturn?.[0]?.output;
					if (typeof content === "string") {
						canvasRef.current?.syncPythonSource(nodeId, content);
					}
				})();
			},
		);

		const workbenchContextValue = useMemo<AutomationWorkbenchContextValue>(
			() => ({
				appId,
				readOnly,
				conversionModel,
				canvasRef,
				agentRunAutomationUpdate,
				onAgentRunTrace: setAgentRunTrace,
				onTraceChange: handleTraceChange,
				onInspectorChange: handleInspectorChange,
				onHistoryChanged: handleHistoryChanged,
				inspectorSnapshot,
				traceSnapshot,
				selectedRun,
				onViewRun: handleViewRun,
				onExitHistoricalView: handleExitHistoricalView,
				historyRefreshToken,
				onOpenOutput: setOutputModal,
				onAskAssistant: handleAskAssistant,
				onOpenPythonEditor: handleOpenPythonEditor,
				isPythonFileOpen,
				onViewRunDetails: handleViewRunDetails,
				runDetailsFocusNodeId: runDetailsFocus?.nodeId ?? null,
				runDetailsFocusToken: runDetailsFocus?.token ?? 0,
			}),
			[
				appId,
				agentRunAutomationUpdate,
				conversionModel,
				handleAskAssistant,
				handleHistoryChanged,
				handleExitHistoricalView,
				handleInspectorChange,
				handleOpenPythonEditor,
				handleTraceChange,
				handleViewRunDetails,
				handleViewRun,
				historyRefreshToken,
				inspectorSnapshot,
				isPythonFileOpen,
				readOnly,
				runDetailsFocus,
				selectedRun,
				traceSnapshot,
			],
		);

		const configureAssistant = assistantStore.getState().configure;
		useEffect(() => {
			configureAssistant({
				systemPrompt: "",
				defaultAgent: AUTOMATION_BUILDER_AGENT,
				mcp: automationMcp,
				runParams: { project: appId },
				onToolCompleted: handleAutomationToolCompleted,
				onRunCompleted: () => notifyAutomationChanged(),
			});
		}, [
			appId,
			automationMcp,
			configureAssistant,
			handleAutomationToolCompleted,
			notifyAutomationChanged,
		]);

		return (
			<>
				<NavbarLeft>
					<NavbarHeader logo={null} />
					<Breadcrumb>
						<BreadcrumbList>
							{catalogPath && (
								<>
									<BreadcrumbItem>
										<BreadcrumbLink asChild>
											<Link to={catalogPath}>
												<span className="inline-flex items-center gap-1.5">
													Automation Catalog
													<span className="rounded border px-1 py-0.5 font-semibold text-[9px] leading-none">
														BETA
													</span>
												</span>
											</Link>
										</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator>
										<ChevronRightIcon />
									</BreadcrumbSeparator>
								</>
							)}
							<BreadcrumbItem>
								<BreadcrumbPage>{projectName}</BreadcrumbPage>
							</BreadcrumbItem>
							<BreadcrumbSeparator>
								<ChevronRightIcon />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<BreadcrumbPage>
									{readOnly ? "View" : "Edit"}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</NavbarLeft>
				<NavbarRight>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={onShare}
								aria-label="Share automation"
							>
								<Share2 className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Share automation</TooltipContent>
					</Tooltip>
				</NavbarRight>
				<Dialog
					open={pythonEditor !== null}
					onOpenChange={(open) => {
						if (!open && pythonEditor) {
							// Escape and backdrop dismissals land here too. Writing
							// unconditionally would flip an untouched generated node
							// to custom just for opening and closing the editor.
							if (
								pythonEditor.source !== pythonEditor.openedWith
							) {
								sendPythonSource(
									pythonEditor.source,
									pythonEditor.nodeId,
								);
							}
							setPythonEditor(null);
						}
					}}
				>
					<DialogContent
						aria-describedby={undefined}
						className="flex h-[85vh] w-[min(92vw,80rem)] max-w-none flex-col p-0 sm:max-w-3xl"
					>
						<DialogHeader className="border-b px-4 py-3">
							<DialogTitle className="font-medium text-base leading-6">
								Python source
							</DialogTitle>
						</DialogHeader>
						<div className="min-h-0 flex-1 p-4">
							<div className="h-full overflow-hidden rounded-lg border bg-muted/30">
								{pythonEditor && (
									<Suspense
										fallback={
											<pre className="h-full overflow-auto p-3 font-mono text-xs">
												{pythonEditor.source}
											</pre>
										}
									>
										<MonacoEditor
											height="100%"
											width="100%"
											language="python"
											value={pythonEditor.source}
											onChange={(source) =>
												setPythonEditor((current) =>
													current
														? {
																...current,
																source:
																	source ??
																	"",
															}
														: current,
												)
											}
											options={{
												automaticLayout: true,
												minimap: { enabled: false },
												wordWrap: "on",
											}}
										/>
									</Suspense>
								)}
							</div>
						</div>
						<DialogFooter className="border-t px-4 py-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									if (pythonEditor) {
										sendPythonSource(
											pythonEditor.source,
											pythonEditor.nodeId,
										);
										setPythonEditor(null);
									}
								}}
							>
								Save
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<AutomationOutputModal
					output={outputModal}
					onClose={() => setOutputModal(null)}
				/>
				<AgentRunDialog
					open={agentRunTrace !== null}
					projectId={appId}
					trace={agentRunTrace}
					onAutomationRunUpdated={setAgentRunAutomationUpdate}
					onOpenChange={(open) => {
						if (!open) setAgentRunTrace(null);
					}}
				/>
				<AssistantStoreProvider store={assistantStore}>
					<AutomationWorkbenchContext.Provider
						value={workbenchContextValue}
					>
						<Workbench
							snapshot={workbenchLayout}
							borderSlots={{
								left: { after: <AutomationSettingsToggle /> },
							}}
						/>
					</AutomationWorkbenchContext.Provider>
				</AssistantStoreProvider>
			</>
		);
	},
);

export const AutomationWorkbenchPage = observer(() => {
	const { project, catalog, permission } = useProject();
	const [shareOpen, setShareOpen] = useState(false);
	const readOnly = permission !== "OWNER" && permission !== "EDIT";
	return (
		<InsightProvider>
			<WorkbenchProvider components={AUTOMATION_COMPONENTS}>
				<AutomationWorkbench
					appId={project.project_id}
					readOnly={readOnly}
					projectName={
						project.project_display_name || project.project_name
					}
					catalogPath={catalog?.path}
					onShare={() => setShareOpen(true)}
				/>
				<Dialog
					open={shareOpen}
					onOpenChange={(open) => !open && setShareOpen(false)}
				>
					<DialogContent className="max-w-lg p-0">
						<ShareOverlay
							appId={project.project_id}
							onClose={() => setShareOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</WorkbenchProvider>
		</InsightProvider>
	);
});
