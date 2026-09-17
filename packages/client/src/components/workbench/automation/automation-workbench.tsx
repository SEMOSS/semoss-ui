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
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import type { Role } from "@semoss/sdk";
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
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../../shared";
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
const FILES = WORKBENCH_COMPONENTS.FILE_EXPLORER;
const FILE_EDITOR = WORKBENCH_COMPONENTS.FILE_CODE_EDITOR;
const MCP_EDITOR = WORKBENCH_COMPONENTS.FILE_MCP_EDITOR;
const SETTINGS = WORKBENCH_COMPONENTS.PROJECT_SETTINGS;

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
		left: { panelIds: [FILES], activeId: null, size: 320 },
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
	permission: Role;
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
		permission,
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
		} | null>(null);
		const wasRunningRef = useRef(false);
		const editingStepIdRef = useRef<string | null>(null);

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
		const handleAskAssistant = useCallback(
			(prompt: string) => {
				setAssistantDraft(prompt.slice(0, MAX_ASSISTANT_DRAFT_LENGTH));
				selectPanel(WORKBENCH_COMPONENTS.ASSISTANT);
			},
			[selectPanel, setAssistantDraft],
		);
		const handleOpenPythonEditor = useCallback(
			(nodeId: string, source: string) =>
				setPythonEditor({ nodeId, source }),
			[],
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
				historyRefreshToken,
				onOpenOutput: setOutputModal,
				onAskAssistant: handleAskAssistant,
				onOpenPythonEditor: handleOpenPythonEditor,
			}),
			[
				appId,
				agentRunAutomationUpdate,
				conversionModel,
				handleAskAssistant,
				handleHistoryChanged,
				handleInspectorChange,
				handleOpenPythonEditor,
				handleTraceChange,
				historyRefreshToken,
				inspectorSnapshot,
				readOnly,
				traceSnapshot,
			],
		);

		const configureAssistant = assistantStore.getState().configure;
		useEffect(() => {
			const accessInstructions = readOnly
				? "You can answer questions but cannot modify this read-only automation."
				: "Use the Automation Project Tools to inspect and make changes when needed.";
			configureAssistant({
				systemPrompt: `You are the assistant for the ${projectName} automation. Help users understand, build, and troubleshoot this automation. ${accessInstructions} Explain that each step result is available to later steps as \${variableName}; configuration values are available as \${config.SETTING_NAME}; and fields marked for Playground input can be supplied at run time, overriding their default value. Use the automation's current project configuration and available tools as the source of truth. Never invent an app, reactor, agent, engine, or output variable ID. Keep appId separate from pixel, ask the user when a required concrete value is unavailable, and never claim a change or run succeeded unless a tool result confirms it.`,
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
			permission,
			projectName,
			readOnly,
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
					<Tooltip>
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
							sendPythonSource(
								pythonEditor.source,
								pythonEditor.nodeId,
							);
							setPythonEditor(null);
						}
					}}
				>
					<DialogContent className="flex h-[85vh] w-[min(92vw,80rem)] max-w-none flex-col p-0 sm:max-w-3xl">
						<DialogHeader className="border-b px-4 py-3">
							<DialogTitle>Python source</DialogTitle>
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
					permission={permission}
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
