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
	Share2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	type RefObject,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Link } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import {
	JsonViewer,
	type MCPConfig,
	MonacoEditor,
	PopoutModal,
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
	useTheme,
} from "@semoss/ui/next";
import { ProjectDetailTabs } from "@/components/project";
import { ShareOverlay } from "@/components/ui";
import { WorkbenchAssistantView } from "@/components/workbench/assistant";
import { Workbench } from "@/components/workbench/core";
import { PROJECT_FILE_EDITOR_PANEL } from "@/components/workbench/project/project-file-editor-panel";
import { PROJECT_FILE_EXPLORER_PANEL } from "@/components/workbench/project/project-file-explorer-panel";
import { PROJECT_MCP_EDITOR_PANEL } from "@/components/workbench/project/project-mcp-editor-panel";
import { WorkbenchProvider } from "@/contexts";
import { useProject, useWorkbench } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import { NavbarHeader, NavbarLeft, NavbarRight } from "../shared";

const AUTOMATION_WORKSPACE_URL =
	window.location.port === "5173"
		? "http://localhost:5177/"
		: "../../automation-workspace/dist/";
const AUTOMATION_WORKSPACE_CACHE_KEY = "20260827-2";
const AUTOMATION_MUTATION_TOOLS = new Set([
	"AddAutomationStep",
	"UpdateAutomationStep",
	"UpdateAutomationCustomStep",
	"RemoveAutomationStep",
]);
const EDITOR = "automation-editor";
const INSPECTOR = "automation-inspector";
const TRACE = "automation-trace";
const FILES = WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER;
const FILE_EDITOR = WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR;
const MCP_EDITOR = WORKBENCH_COMPONENTS.PROJECT_MCP_EDITOR;
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

const AUTOMATION_LAYOUT: WorkbenchLayout = {
	version: 1,
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
		[FILES]: { id: FILES, type: FILES, name: "Files", canClose: false },
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
			activeId: INSPECTOR,
			size: 400,
		},
	},
};

interface AutomationWorkbenchProps {
	appId: string;
	readOnly: boolean;
	projectName: string;
	catalogPath?: string;
	onShare: () => void;
}

const AutomationFrame = ({
	appId,
	mode,
	readOnly,
	title,
	srcRef,
}: {
	appId: string;
	mode: string;
	readOnly?: boolean;
	title: string;
	srcRef: RefObject<HTMLIFrameElement | null>;
}) => (
	<iframe
		ref={srcRef}
		className="h-full w-full border-none"
		title={title}
		src={`${AUTOMATION_WORKSPACE_URL}?v=${AUTOMATION_WORKSPACE_CACHE_KEY}&app=${encodeURIComponent(appId)}&mode=${mode}${readOnly === undefined ? "" : `&readOnly=${readOnly ? "1" : "0"}`}&parentOrigin=${encodeURIComponent(window.location.origin)}`}
		sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
	/>
);

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
		readOnly,
		projectName,
		catalogPath,
		onShare,
	}: AutomationWorkbenchProps) => {
		const layoutActions = useWorkbench((state) => state.layout.actions);
		const { resolvedTheme } = useTheme();
		const editorRef = useRef<HTMLIFrameElement>(null);
		const inspectorRef = useRef<HTMLIFrameElement>(null);
		const traceRef = useRef<HTMLIFrameElement>(null);
		const [traceSnapshot, setTraceSnapshot] = useState<unknown>(null);
		const [outputModal, setOutputModal] = useState<string | null>(null);
		const [inspectorSnapshot, setInspectorSnapshot] =
			useState<unknown>(null);
		const [pythonEditor, setPythonEditor] = useState<{
			nodeId: string;
			source: string;
		} | null>(null);

		const automationOrigin = useMemo(
			() =>
				new URL(AUTOMATION_WORKSPACE_URL, window.location.origin)
					.origin,
			[],
		);

		const selectPanel = useCallback(
			(panelId: string) => {
				layoutActions.selectPanel(panelId);
			},
			[layoutActions],
		);

		useEffect(() => {
			const message = { type: "SEMOSS_THEME_SYNC", theme: resolvedTheme };
			for (const frame of [editorRef, inspectorRef, traceRef]) {
				frame.current?.contentWindow?.postMessage(
					message,
					automationOrigin,
				);
			}
		}, [automationOrigin, resolvedTheme]);

		useEffect(() => {
			const handleMessage = (event: MessageEvent<unknown>) => {
				if (
					event.origin !== automationOrigin ||
					typeof event.data !== "object" ||
					event.data === null
				)
					return;
				const message = event.data as {
					type?: unknown;
					snapshot?: unknown;
					projectId?: unknown;
					nodeId?: unknown;
					source?: unknown;
					output?: unknown;
				};
				if (
					event.source === editorRef.current?.contentWindow &&
					message.type === "SEMOSS_AUTOMATION_TRACE"
				) {
					setTraceSnapshot(message.snapshot);
					if (
						(message.snapshot as { running?: boolean } | null)
							?.running
					)
						selectPanel(TRACE);
				}
				if (
					event.source === editorRef.current?.contentWindow &&
					message.type === "SEMOSS_AUTOMATION_INSPECTOR"
				) {
					setInspectorSnapshot(message.snapshot);
					if (
						(message.snapshot as { editingStep?: unknown } | null)
							?.editingStep
					)
						selectPanel(INSPECTOR);
				}
				if (
					event.source === editorRef.current?.contentWindow &&
					message.type === "SEMOSS_AUTOMATION_HISTORY_REFRESH"
				) {
					traceRef.current?.contentWindow?.postMessage(
						message,
						automationOrigin,
					);
				}
				if (
					event.source === traceRef.current?.contentWindow &&
					message.type === "SEMOSS_AUTOMATION_TRACE_READY"
				) {
					traceRef.current?.contentWindow?.postMessage(
						{
							type: "SEMOSS_AUTOMATION_TRACE",
							snapshot: traceSnapshot,
						},
						automationOrigin,
					);
				}
				if (
					event.source === traceRef.current?.contentWindow &&
					message.type === "SEMOSS_AUTOMATION_OPEN_OUTPUT" &&
					typeof message.output === "string"
				) {
					setOutputModal(message.output);
				}
				if (
					event.source === inspectorRef.current?.contentWindow &&
					message.type === "SEMOSS_AUTOMATION_INSPECTOR_READY"
				) {
					inspectorRef.current?.contentWindow?.postMessage(
						{
							type: "SEMOSS_AUTOMATION_INSPECTOR",
							snapshot: inspectorSnapshot,
						},
						automationOrigin,
					);
				}
				if (
					event.source === inspectorRef.current?.contentWindow &&
					message.type === "SEMOSS_AUTOMATION_OPEN_PYTHON_EDITOR" &&
					typeof message.nodeId === "string" &&
					typeof message.source === "string"
				) {
					setPythonEditor({
						nodeId: message.nodeId,
						source: message.source,
					});
				}
				if (
					event.source === inspectorRef.current?.contentWindow &&
					message.type === "SEMOSS_AUTOMATION_INSPECTOR_ACTION"
				) {
					editorRef.current?.contentWindow?.postMessage(
						message,
						automationOrigin,
					);
				}
			};
			window.addEventListener("message", handleMessage);
			return () => window.removeEventListener("message", handleMessage);
		}, [automationOrigin, inspectorSnapshot, selectPanel, traceSnapshot]);

		useEffect(() => {
			inspectorRef.current?.contentWindow?.postMessage(
				{
					type: "SEMOSS_AUTOMATION_INSPECTOR",
					snapshot: inspectorSnapshot,
				},
				automationOrigin,
			);
		}, [automationOrigin, inspectorSnapshot]);

		useEffect(() => {
			traceRef.current?.contentWindow?.postMessage(
				{ type: "SEMOSS_AUTOMATION_TRACE", snapshot: traceSnapshot },
				automationOrigin,
			);
		}, [automationOrigin, traceSnapshot]);

		const sendPythonSource = useCallback(
			(source: string, nodeId: string) => {
				inspectorRef.current?.contentWindow?.postMessage(
					{
						type: "SEMOSS_AUTOMATION_PYTHON_SOURCE_CHANGED",
						projectId: appId,
						nodeId,
						source,
					},
					automationOrigin,
				);
			},
			[appId, automationOrigin],
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
		const notifyAutomationChanged = useCallback(() => {
			editorRef.current?.contentWindow?.postMessage(
				{ type: "SEMOSS_AUTOMATION_REFRESH", projectId: appId },
				automationOrigin,
			);
		}, [appId, automationOrigin]);
		const handleAutomationToolCompleted = useCallback(
			(tool: { name: string }) => {
				if (AUTOMATION_MUTATION_TOOLS.has(tool.name)) {
					notifyAutomationChanged();
				}
			},
			[notifyAutomationChanged],
		);
		const components = useMemo<Record<string, WorkbenchPanelConfigAny>>(
			() => ({
				[EDITOR]: {
					name: "Editor",
					canClose: false,
					canRename: false,
					icon: ({ className }) => (
						<FileCode2Icon className={className} />
					),
					content: () => (
						<AutomationFrame
							appId={appId}
							mode="edit"
							readOnly={readOnly}
							title="Automation Workspace"
							srcRef={editorRef}
						/>
					),
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
					content: () => (
						<AutomationFrame
							appId={appId}
							mode="inspector"
							readOnly={readOnly}
							title="Automation inspector"
							srcRef={inspectorRef}
						/>
					),
				},
				[FILES]: {
					...PROJECT_FILE_EXPLORER_PANEL,
					canRename: false,
					enableBorderHeader: false,
					icon: ({ className }) => (
						<FolderTreeIcon className={className} />
					),
				},
				[FILE_EDITOR]: {
					...PROJECT_FILE_EDITOR_PANEL,
					canRename: false,
				},
				[MCP_EDITOR]: {
					...PROJECT_MCP_EDITOR_PANEL,
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
					content: () => (
						<AutomationFrame
							appId={appId}
							mode="trace"
							title="Automation run details"
							srcRef={traceRef}
						/>
					),
				},
				[SETTINGS]: {
					name: "Settings",
					canRename: false,
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
			[appId, readOnly],
		);

		const configureAssistant = useWorkbench(
			(state) => state.assistant.configure,
		);
		useEffect(() => {
			const accessInstructions = readOnly
				? "You can answer questions but cannot modify this read-only automation."
				: "Use the Automation Project Tools to inspect and make changes when needed.";
			configureAssistant({
				systemPrompt: `You are the assistant for the ${projectName} automation. Help users understand, build, and troubleshoot this automation. ${accessInstructions} Explain that each step result is available to later steps as \${variableName}; configuration values are available as \${config.SETTING_NAME}; and fields marked for Playground input can be supplied at run time, overriding their default value. Use the automation's current project configuration and available tools as the source of truth. Never invent an app, reactor, agent, engine, or output variable ID. Keep appId separate from pixel, ask the user when a required concrete value is unavailable, and never claim a change or run succeeded unless a tool result confirms it.`,
				mcp: automationMcp,
				runParams: { project: appId },
				onToolCompleted: handleAutomationToolCompleted,
				onRunCompleted: notifyAutomationChanged,
			});
		}, [
			appId,
			automationMcp,
			configureAssistant,
			handleAutomationToolCompleted,
			notifyAutomationChanged,
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
				<Workbench
					layout={AUTOMATION_LAYOUT}
					components={components}
					readOnly={readOnly}
				/>
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
			<WorkbenchProvider id={project.project_id}>
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
