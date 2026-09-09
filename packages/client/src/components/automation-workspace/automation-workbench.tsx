import {
	ActivityIcon,
	BracesIcon,
	ChevronRightIcon,
	CopyIcon,
	FileCode2Icon,
	FolderTreeIcon,
	MessageSquareIcon,
	Minus as MinusIcon,
	PanelRightIcon,
	Plus as PlusIcon,
	SettingsIcon,
	Share2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	createContext,
	Suspense,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Link } from "react-router";
import {
	AgentRunDialog,
	AutomationCanvas,
	type AutomationCanvasHandle,
	type AutomationInspectorSnapshot,
	type AutomationNodeTrace,
	type AutomationRunDetail,
	type AutomationTraceSnapshot,
	InspectorTab,
	RunsTab,
} from "@semoss/automation-workspace";
import type { Role } from "@semoss/sdk";
import { InsightProvider } from "@semoss/sdk/react";
import {
	JsonViewer,
	type MCPConfig,
	MonacoEditor,
	PopoutModal,
	SandpackHtmlPreview,
} from "@semoss/shared";
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
	Markdown,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ProjectDetailTabs } from "@/components/project";
import { ShareOverlay } from "@/components/ui";
import { WorkbenchAssistantView } from "@/components/workbench/assistant";
import { Workbench } from "@/components/workbench/core";
import {
	FILE_CODE_EDITOR_PANEL,
	FILE_DOWNLOAD_PANEL,
	FILE_EXPLORER_PANEL,
	FILE_IMAGE_VIEWER_PANEL,
	FILE_MARKDOWN_EDITOR_PANEL,
	FILE_MCP_EDITOR_PANEL,
	FILE_NOTEBOOK_EDITOR_PANEL,
	FILE_PDF_VIEWER_PANEL,
} from "@/components/workbench/files";
import { WorkbenchProvider } from "@/contexts";
import { useProject, useWorkbench } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../shared";
import { AutomationSettingsToggle } from "./automation-settings-toggle";

const AUTOMATION_MUTATION_TOOLS = new Set([
	"AddAutomationStep",
	"UpdateAutomationStep",
	"UpdateAutomationCustomStep",
	"RemoveAutomationStep",
]);
/** Defensive cap on a run-trace-supplied Assistant draft; the prompt itself is already
 * bounded when built, this only guards against an unexpectedly large value. */
const MAX_ASSISTANT_DRAFT_LENGTH = 8000;
/** Keys that may hold a single changed step/node id in a completed tool's arguments. */
const SINGLE_STEP_ID_KEYS = ["stepId", "nodeId", "step_id", "node_id", "id"];
/** Keys that may hold a list of changed step/node ids in a completed tool's arguments. */
const STEP_ID_LIST_KEYS = ["stepIds", "nodeIds", "step_ids", "node_ids", "ids"];

/**
 * Best-effort extraction of the step/node id(s) a completed Assistant tool call changed, read
 * from the tool's arguments. The actual tool argument schema isn't guaranteed, so this only
 * trusts a handful of common key names and never assumes an id is present.
 */
function extractChangedStepIds(
	toolArguments: Record<string, unknown> | undefined,
): string[] {
	if (!toolArguments) return [];
	const ids = new Set<string>();
	for (const key of SINGLE_STEP_ID_KEYS) {
		const value = toolArguments[key];
		if (typeof value === "string" && value.length > 0) {
			ids.add(value);
		}
	}
	for (const key of STEP_ID_LIST_KEYS) {
		const value = toolArguments[key];
		if (Array.isArray(value)) {
			for (const item of value) {
				if (typeof item === "string" && item.length > 0) {
					ids.add(item);
				}
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
			config: { type: "PROJECT", id: appId },
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

/**
 * Data for the Editor/Inspector/Trace dock panels, read via context instead of closures so
 * `components[...].content` (rendered by Workbench as `<Content />`, i.e. as a component type)
 * never changes identity when trace/inspector state ticks — an identity change there would
 * unmount and remount the whole panel subtree every tick instead of just re-rendering it.
 */
interface AutomationWorkbenchContextValue {
	appId: string;
	readOnly: boolean;
	canvasRef: React.RefObject<AutomationCanvasHandle | null>;
	agentRunAutomationUpdate: AutomationRunDetail | null;
	onAgentRunTrace: (trace: AutomationNodeTrace | null) => void;
	onTraceChange: (snapshot: AutomationTraceSnapshot) => void;
	onInspectorChange: (snapshot: AutomationInspectorSnapshot) => void;
	onHistoryChanged: () => void;
	inspectorSnapshot: AutomationInspectorSnapshot | null;
	traceSnapshot: AutomationTraceSnapshot | null;
	historyRefreshToken: number;
	onOpenOutput: (output: string) => void;
	onAskAssistant: (prompt: string) => void;
	onOpenPythonEditor: (nodeId: string, source: string) => void;
}

const AutomationWorkbenchContext =
	createContext<AutomationWorkbenchContextValue | null>(null);

function useAutomationWorkbenchContext(): AutomationWorkbenchContextValue {
	const context = useContext(AutomationWorkbenchContext);
	if (!context) {
		throw new Error(
			"Automation dock panels must render within AutomationWorkbench.",
		);
	}
	return context;
}

const AutomationEditorPanel: WorkbenchComponent = () => {
	const ctx = useAutomationWorkbenchContext();
	return (
		<AutomationCanvas
			ref={ctx.canvasRef}
			appId={ctx.appId}
			readOnly={ctx.readOnly}
			onViewAgentRun={ctx.onAgentRunTrace}
			externalRunUpdate={ctx.agentRunAutomationUpdate}
			onTraceChange={ctx.onTraceChange}
			onInspectorChange={ctx.onInspectorChange}
			onHistoryChanged={ctx.onHistoryChanged}
		/>
	);
};

const AutomationInspectorPanel: WorkbenchComponent = () => {
	const ctx = useAutomationWorkbenchContext();
	const snapshot = ctx.inspectorSnapshot;
	return (
		<InspectorTab
			appId={ctx.appId}
			description={snapshot?.description ?? ""}
			devMode={snapshot?.devMode ?? false}
			editingStep={snapshot?.editingStep ?? null}
			onPrepareSchedule={() =>
				ctx.canvasRef.current?.prepareSchedule() ??
				Promise.resolve(false)
			}
			upstreamVars={snapshot?.upstreamVars ?? []}
			stepRunStatus={snapshot?.stepRunStatus}
			stepRunError={snapshot?.stepRunError}
			stepRunOutput={snapshot?.stepRunOutput}
			stepRunTrace={snapshot?.stepRunTrace}
			readOnly={ctx.readOnly || Boolean(snapshot?.readOnly)}
			onDescriptionChange={(description) =>
				ctx.canvasRef.current?.applyInspectorAction({
					type: "update-description",
					description,
				})
			}
			onClose={() =>
				ctx.canvasRef.current?.applyInspectorAction({ type: "close" })
			}
			onUpdate={(step) =>
				ctx.canvasRef.current?.applyInspectorAction({
					type: "update-step",
					step,
				})
			}
			onDelete={(stepId) =>
				ctx.canvasRef.current?.applyInspectorAction({
					type: "delete-step",
					stepId,
				})
			}
			onOpenPythonEditor={ctx.onOpenPythonEditor}
		/>
	);
};

const AutomationTracePanel: WorkbenchComponent = () => {
	const ctx = useAutomationWorkbenchContext();
	const snapshot = ctx.traceSnapshot;
	return (
		<RunsTab
			appId={ctx.appId}
			refreshToken={ctx.historyRefreshToken}
			running={snapshot?.running ?? false}
			latestRunStatus={snapshot?.latestRunStatus ?? null}
			aiRunSummary={snapshot?.aiRunSummary ?? null}
			generatingAiSummary={snapshot?.generatingAiSummary ?? false}
			steps={snapshot?.steps ?? []}
			results={snapshot?.results ?? []}
			executedDefinition={snapshot?.executedDefinition ?? null}
			onDismiss={() => undefined}
			onOpenOutput={ctx.onOpenOutput}
			onAskAssistant={ctx.onAskAssistant}
		/>
	);
};

const AutomationSettingsPanel: WorkbenchComponent = () => (
	<ProjectDetailTabs tabs={SETTINGS_TABS} />
);

const AutomationOutputModal = ({
	output,
	onClose,
}: {
	output: string | null;
	onClose: () => void;
}) =>
	output === null ? null : (
		<AutomationOutputModalContent output={output} onClose={onClose} />
	);

const AutomationOutputModalContent = ({
	output,
	onClose,
}: {
	output: string | null;
	onClose: () => void;
}) => {
	const [raw, setRaw] = useState(false);
	const [expandVersion, setExpandVersion] = useState(0);
	const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);
	const value = output ?? "";
	const parsed = useMemo(() => {
		try {
			return JSON.parse(value);
		} catch {
			return null;
		}
	}, [value]);
	const formatted = parsed === null ? value : JSON.stringify(parsed, null, 2);
	const isObjectOutput = parsed !== null && typeof parsed === "object";
	const isTable = isObjectOutput && isTabularArray(parsed);
	const isMarkdown = !isObjectOutput && !raw && looksLikeMarkdown(value);
	const markdownText = isMarkdown ? normalizeForMarkdown(value) : "";
	const htmlText = !isObjectOutput ? normalizeForMarkdown(value) : "";
	const isHtml = !raw && looksLikeHtml(htmlText);

	return (
		<PopoutModal
			title="Result"
			meta={`${formatted.split("\n").length} lines`}
			actions={
				<div className="inline-flex items-center gap-1">
					<div className="inline-flex overflow-hidden rounded border border-current/30 font-medium text-[10px]">
						<button
							type="button"
							className={`px-1.5 py-0 ${!raw ? "bg-current/15" : "hover:bg-current/10"}`}
							onClick={() => setRaw(false)}
						>
							FORMATTED
						</button>
						<button
							type="button"
							className={`border-current/30 border-l px-1.5 py-0 ${raw ? "bg-current/15" : "hover:bg-current/10"}`}
							onClick={() => setRaw(true)}
						>
							RAW
						</button>
					</div>
					{!raw && isObjectOutput && (
						<div className="inline-flex overflow-hidden rounded border border-current/30">
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="flex items-center px-1 py-0.5"
										onClick={() => {
											setExpandAll(true);
											setExpandVersion(
												(version) => version + 1,
											);
										}}
										aria-label="Expand all"
									>
										<PlusIcon className="size-3" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Expand all</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="flex items-center border-current/30 border-l px-1 py-0.5"
										onClick={() => {
											setExpandAll(false);
											setExpandVersion(
												(version) => version + 1,
											);
										}}
										aria-label="Collapse all"
									>
										<MinusIcon className="size-3" />
									</button>
								</TooltipTrigger>
								<TooltipContent>Collapse all</TooltipContent>
							</Tooltip>
						</div>
					)}
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
								onClick={() =>
									void navigator.clipboard.writeText(
										raw ? value : formatted,
									)
								}
								aria-label="Copy output"
							>
								<CopyIcon className="size-3.5" />
							</button>
						</TooltipTrigger>
						<TooltipContent>Copy output</TooltipContent>
					</Tooltip>
				</div>
			}
			onClose={onClose}
		>
			{!raw && isTable ? (
				<DataTable rows={parsed as Record<string, unknown>[]} />
			) : !raw && isObjectOutput ? (
				<JsonViewer
					value={parsed}
					forceVersion={expandVersion}
					forceOpen={expandAll}
				/>
			) : !raw && isMarkdown ? (
				<div className="prose prose-sm dark:prose-invert max-w-none">
					<Markdown>{markdownText}</Markdown>
				</div>
			) : isHtml ? (
				<div className="h-[70vh] min-h-0">
					<SandpackHtmlPreview html={htmlText} forceFullHeight />
				</div>
			) : (
				<pre className="whitespace-pre-wrap break-all font-mono text-foreground text-sm">
					{raw ? value : formatted}
				</pre>
			)}
		</PopoutModal>
	);
};

const MARKDOWN_PATTERNS = [
	/^#{1,6}\s/m,
	/\|.+\|.+\|/m,
	/^[-*+]\s/m,
	/^\d+\.\s/m,
	/```[\s\S]*?```/,
	/\*\*.+?\*\*/,
	/\[.+?\]\(.+?\)/,
];

function looksLikeMarkdown(text: string): boolean {
	if (!text || text.length < 4) return false;
	return MARKDOWN_PATTERNS.some((p) => p.test(text));
}

function looksLikeHtml(text: string): boolean {
	return /^\s*(?:<!doctype\s+html\b|<html\b)/i.test(text);
}

function normalizeForMarkdown(text: string): string {
	let s = text;
	if (s.startsWith('"') && s.endsWith('"')) {
		try {
			const parsed = JSON.parse(s);
			if (typeof parsed === "string") s = parsed;
		} catch {
			s = s.slice(1, -1);
		}
	}
	if (s.includes("\\n")) {
		s = s.replace(/\\n/g, "\n");
	}
	return s;
}

function isTabularArray(value: unknown): boolean {
	if (!Array.isArray(value) || value.length === 0) return false;
	if (typeof value[0] !== "object" || value[0] === null) return false;
	return (
		Object.keys(value[0]).length > 0 &&
		value.every(
			(item) =>
				typeof item === "object" &&
				item !== null &&
				!Array.isArray(item),
		)
	);
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
	const columns = Object.keys(rows[0]);
	return (
		<div className="overflow-auto">
			<table className="w-full border-collapse text-xs">
				<thead>
					<tr className="border-b bg-muted/50">
						{columns.map((col) => (
							<th
								key={col}
								className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-muted-foreground"
							>
								{col}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr
							key={`row-${i}-${String(row[columns[0]] ?? i)}`}
							className="border-b last:border-0 hover:bg-muted/30"
						>
							{columns.map((col) => (
								<td
									key={col}
									className="whitespace-nowrap px-2 py-1 text-foreground"
								>
									{String(row[col] ?? "")}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

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
		const setAssistantDraft = useWorkbench(
			(state) => state.assistant.setDraft,
		);
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
			(tool: { name: string; arguments?: Record<string, unknown> }) => {
				if (AUTOMATION_MUTATION_TOOLS.has(tool.name)) {
					notifyAutomationChanged({
						toolName: tool.name,
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

		// Stable across renders — `content` is rendered by Workbench as a component type
		// (`<Content />`), so a new function identity here would remount the whole panel
		// subtree on every trace/inspector tick instead of just re-rendering it.
		const components = useMemo<Record<string, WorkbenchPanelConfigAny>>(
			() => ({
				[EDITOR]: {
					name: "Editor",
					canClose: false,
					canRename: false,
					icon: ({ className }) => (
						<FileCode2Icon className={className} />
					),
					content: AutomationEditorPanel,
				},
				[INSPECTOR]: {
					name: "Inspector",
					canClose: false,
					canRename: false,
					enableBorderHeader: false,
					icon: ({ className }) => (
						<PanelRightIcon className={className} />
					),
					mount: "keepAlive",
					content: AutomationInspectorPanel,
				},
				[FILES]: {
					...FILE_EXPLORER_PANEL,
					canRename: false,
					enableBorderHeader: false,
					icon: ({ className }) => (
						<FolderTreeIcon className={className} />
					),
				},
				[FILE_EDITOR]: {
					...FILE_CODE_EDITOR_PANEL,
					canRename: false,
				},
				[WORKBENCH_COMPONENTS.FILE_DOWNLOAD]: {
					...FILE_DOWNLOAD_PANEL,
					canRename: false,
				},
				[WORKBENCH_COMPONENTS.FILE_IMAGE_VIEWER]: {
					...FILE_IMAGE_VIEWER_PANEL,
					canRename: false,
				},
				[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]: {
					...FILE_MARKDOWN_EDITOR_PANEL,
					canRename: false,
				},
				[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]: {
					...FILE_NOTEBOOK_EDITOR_PANEL,
					canRename: false,
				},
				[WORKBENCH_COMPONENTS.FILE_PDF_VIEWER]: {
					...FILE_PDF_VIEWER_PANEL,
					canRename: false,
				},
				[MCP_EDITOR]: {
					...FILE_MCP_EDITOR_PANEL,
					canRename: false,
					icon: ({ className }) => (
						<BracesIcon className={className} />
					),
				},
				[TRACE]: {
					name: "Run details",
					canClose: false,
					canRename: false,
					enableBorderHeader: false,
					icon: ({ className }) => (
						<ActivityIcon className={className} />
					),
					mount: "keepAlive",
					content: AutomationTracePanel,
				},
				[SETTINGS]: {
					name: "Settings",
					canRename: false,
					icon: ({ className }) => (
						<SettingsIcon className={className} />
					),
					content: AutomationSettingsPanel,
				},
				[WORKBENCH_COMPONENTS.ASSISTANT]: {
					name: "Assistant",
					canClose: false,
					canRename: false,
					enableBorderHeader: false,
					mount: "eager",
					icon: ({ className }) => (
						<MessageSquareIcon className={className} />
					),
					content: WorkbenchAssistantView,
				},
			}),
			[],
		);

		const configureWorkbench = useWorkbench((state) => state.configure);
		useEffect(() => {
			const accessInstructions = readOnly
				? "You can answer questions but cannot modify this read-only automation."
				: "Use the Automation Project Tools to inspect and make changes when needed.";
			configureWorkbench({
				resource: { type: "PROJECT", id: appId, permission },
				assistant: {
					systemPrompt: `You are the assistant for the ${projectName} automation. Help users understand, build, and troubleshoot this automation. ${accessInstructions} Explain that each step result is available to later steps as \${variableName}; configuration values are available as \${config.SETTING_NAME}; and fields marked for Playground input can be supplied at run time, overriding their default value. Use the automation's current project configuration and available tools as the source of truth. Never invent an app, reactor, agent, engine, or output variable ID. Keep appId separate from pixel, ask the user when a required concrete value is unavailable, and never claim a change or run succeeded unless a tool result confirms it.`,
					mcp: automationMcp,
					runParams: { project: appId },
					onToolCompleted: handleAutomationToolCompleted,
					onRunCompleted: () => notifyAutomationChanged(),
				},
			});
		}, [
			appId,
			automationMcp,
			configureWorkbench,
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
												Automation Catalog
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
				<AutomationWorkbenchContext.Provider
					value={workbenchContextValue}
				>
					<Workbench
						layout={workbenchLayout}
						components={components}
						borderSlots={{
							left: { after: <AutomationSettingsToggle /> },
						}}
					/>
				</AutomationWorkbenchContext.Provider>
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
			<WorkbenchProvider
				cacheKey={
					readOnly
						? `${project.project_id}--read-only`
						: project.project_id
				}
			>
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
