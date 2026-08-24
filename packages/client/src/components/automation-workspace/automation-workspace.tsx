import { ChevronRightIcon, Share2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FlexLayout, type MCPConfig } from "@semoss/shared";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { runWorkbenchRoomMcpTool } from "@/api/rooms";
import { AppFileEditor } from "@/components/app-workspace/app-file-editor";
import { AppFileExplorer } from "@/components/app-workspace/app-file-explorer";
import { ProjectDetailTabs } from "@/components/project";
import { ShareOverlay } from "@/components/ui";
import { useProject, useWorkspace } from "@/hooks";
import type { WorkspaceOptions } from "@/stores";
import {
	MCPJsonEditor,
	NavbarHeader,
	NavbarLeft,
	NavbarRight,
} from "../shared";
import type { WorkbenchChatToolHandler } from "../workbench/chat/workbench-chat.types";
import { WorkbenchChatPanel } from "../workbench/chat/workbench-chat-panel";
import { WorkspaceManager } from "../workspace";

const AUTOMATION_WORKSPACE_URL = import.meta.env.DEV
	? "http://localhost:5177/"
	: "../../automation-workspace/dist/";

/** Same tabs as CodeWorkspace's settings panel — shared config should be centralized if these drift. */
const SETTINGS_TABS: React.ComponentProps<typeof ProjectDetailTabs>["tabs"] = [
	{ name: "Overview", component: "project-overview" },
	{
		name: "MCP",
		component: "mcp-usage",
		restrict: ["OWNER", "EDIT", "READ_ONLY"],
	},
	{ name: "Commits", component: "commits", restrict: ["OWNER", "EDIT"] },
	{ name: "GitHub", component: "github", restrict: ["OWNER"] },
	{ name: "Settings", component: "settings", restrict: ["OWNER"] },
	{
		name: "Access Control",
		component: "access-control",
		restrict: ["OWNER", "EDIT"],
	},
	{ name: "SMSS", component: "smss", restrict: ["OWNER"] },
];

const DEFAULT_OPTIONS: WorkspaceOptions = {
	version: "",
	layout: {
		global: {
			tabEnableClose: false,
			tabEnableRename: false,
		},
		borders: [
			{
				type: "border",
				location: "left",
				selected: 0,
				size: 320,
				children: [
					{
						id: "automation-inspector",
						type: "tab",
						name: "Inspector",
						component: "automation-inspector",
						enableClose: false,
						enableRenderOnDemand: false,
						config: {},
					},
					{
						id: "file-explorer",
						type: "tab",
						name: "Files",
						component: "app-file-explorer",
						enableClose: false,
						config: {},
					},
				],
			},
			{
				type: "border",
				location: "right",
				selected: 0,
				size: 400,
				minSize: 320,
				children: [
					{
						id: "automation-chat",
						type: "tab",
						name: "Chat",
						component: "automation-chat",
						enableClose: false,
						enableRenderOnDemand: false,
						config: {},
					},
					{
						id: "automation-trace",
						type: "tab",
						name: "Run details",
						component: "automation-trace",
						enableClose: false,
						enableRenderOnDemand: false,
						config: {},
					},
					{
						id: "automation-history",
						type: "tab",
						name: "History",
						component: "automation-history",
						enableClose: false,
						enableRenderOnDemand: false,
						config: {},
					},
				],
			},
		],
		layout: {
			type: "row",
			weight: 100,
			children: [
				{
					type: "tabset",
					weight: 100,
					selected: 0,
					enableTabStrip: false,
					children: [
						{
							id: "automation-editor",
							type: "tab",
							name: "Editor",
							component: "automation-editor",
							enableClose: false,
							config: {},
						},
					],
				},
			],
		},
	},
};

/** Edit-mode workspace for AUTOMATION apps with a persistent canvas editor and dockable supporting panels. */
export const AutomationWorkspace = observer(() => {
	const { workspace } = useWorkspace();
	const { catalog, permission, project } = useProject();
	const [shareOpen, setShareOpen] = useState(false);
	const appId = workspace.appId || project.project_id;
	const readOnly = permission !== "OWNER" && permission !== "EDIT";
	const [showEditorTabs, setShowEditorTabs] = useState(false);
	const automationFrameRef = useRef<HTMLIFrameElement>(null);
	const traceFrameRef = useRef<HTMLIFrameElement>(null);
	const historyFrameRef = useRef<HTMLIFrameElement>(null);
	const inspectorFrameRef = useRef<HTMLIFrameElement>(null);
	const [traceSnapshot, setTraceSnapshot] = useState<unknown>(null);
	const [inspectorSnapshot, setInspectorSnapshot] = useState<unknown>(null);
	const [automationDirty, setAutomationDirty] = useState(false);
	const automationWorkspaceOrigin = useMemo(
		() => new URL(AUTOMATION_WORKSPACE_URL, window.location.origin).origin,
		[],
	);

	const activateInspector = useCallback(() => {
		const inspectorTab = workspace.model?.getNodeById(
			"automation-inspector",
		);
		if (inspectorTab instanceof FlexLayout.TabNode) {
			const inspectorBorder = inspectorTab.getParent();
			if (
				inspectorBorder instanceof FlexLayout.BorderNode &&
				inspectorBorder.getSelectedNode()?.getId() ===
					inspectorTab.getId()
			) {
				return;
			}
			inspectorTab
				.getModel()
				.doAction(FlexLayout.Actions.selectTab(inspectorTab.getId()));
		}
	}, [workspace.model]);

	useEffect(() => {
		if (!appId) return;
		setInspectorSnapshot(null);
		setAutomationDirty(false);
	}, [appId]);

	useEffect(() => {
		if (!automationDirty) return;
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () =>
			window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [automationDirty]);

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
		automationFrameRef.current?.contentWindow?.postMessage(
			{ type: "SEMOSS_AUTOMATION_REFRESH", projectId: appId },
			automationWorkspaceOrigin,
		);
	}, [appId, automationWorkspaceOrigin]);

	useEffect(() => {
		const handleMessage = (event: MessageEvent<unknown>) => {
			if (
				event.origin !== automationWorkspaceOrigin ||
				typeof event.data !== "object" ||
				event.data === null
			) {
				return;
			}
			const message = event.data as {
				type?: unknown;
				snapshot?: unknown;
				projectId?: unknown;
				isDirty?: unknown;
			};
			if (
				event.source === automationFrameRef.current?.contentWindow &&
				message.type === "SEMOSS_AUTOMATION_DIRTY_STATE" &&
				message.projectId === appId &&
				typeof message.isDirty === "boolean"
			) {
				setAutomationDirty(message.isDirty);
			}
			if (
				event.source === automationFrameRef.current?.contentWindow &&
				message.type === "SEMOSS_AUTOMATION_TRACE"
			) {
				setTraceSnapshot(message.snapshot);
			}
			if (
				event.source === automationFrameRef.current?.contentWindow &&
				message.type === "SEMOSS_AUTOMATION_HISTORY_REFRESH"
			) {
				historyFrameRef.current?.contentWindow?.postMessage(
					message,
					automationWorkspaceOrigin,
				);
			}
			if (
				event.source === traceFrameRef.current?.contentWindow &&
				message.type === "SEMOSS_AUTOMATION_TRACE_READY"
			) {
				traceFrameRef.current?.contentWindow?.postMessage(
					{
						type: "SEMOSS_AUTOMATION_TRACE",
						snapshot: traceSnapshot,
					},
					automationWorkspaceOrigin,
				);
			}
			if (
				event.source === automationFrameRef.current?.contentWindow &&
				message.type === "SEMOSS_AUTOMATION_INSPECTOR"
			) {
				setInspectorSnapshot(message.snapshot);
				if (
					typeof message.snapshot === "object" &&
					message.snapshot !== null &&
					"editingStep" in message.snapshot &&
					message.snapshot.editingStep
				) {
					activateInspector();
				}
			}
			if (
				event.source === inspectorFrameRef.current?.contentWindow &&
				message.type === "SEMOSS_AUTOMATION_INSPECTOR_READY"
			) {
				inspectorFrameRef.current?.contentWindow?.postMessage(
					{
						type: "SEMOSS_AUTOMATION_INSPECTOR",
						snapshot: inspectorSnapshot,
					},
					automationWorkspaceOrigin,
				);
			}
			if (
				event.source === inspectorFrameRef.current?.contentWindow &&
				message.type === "SEMOSS_AUTOMATION_INSPECTOR_ACTION"
			) {
				automationFrameRef.current?.contentWindow?.postMessage(
					message,
					automationWorkspaceOrigin,
				);
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [
		activateInspector,
		appId,
		automationWorkspaceOrigin,
		inspectorSnapshot,
		traceSnapshot,
	]);

	useEffect(() => {
		inspectorFrameRef.current?.contentWindow?.postMessage(
			{
				type: "SEMOSS_AUTOMATION_INSPECTOR",
				snapshot: inspectorSnapshot,
			},
			automationWorkspaceOrigin,
		);
	}, [automationWorkspaceOrigin, inspectorSnapshot]);

	useEffect(() => {
		if (readOnly) return;
		const model = workspace.model;
		if (!model || model.getNodeById("automation-inspector")) return;
		const layout = model.toJson();
		const leftBorder = layout.borders?.find(
			(border) => border.location === "left",
		);
		if (!leftBorder) return;
		leftBorder.children.unshift({
			id: "automation-inspector",
			type: "tab",
			name: "Inspector",
			component: "automation-inspector",
			enableClose: false,
			enableRenderOnDemand: false,
			config: {},
		});
		leftBorder.selected = 0;
		workspace.load({ version: "", layout });
		workspace.saveToCache();
	}, [readOnly, workspace.load, workspace.model, workspace.saveToCache]);

	useEffect(() => {
		traceFrameRef.current?.contentWindow?.postMessage(
			{ type: "SEMOSS_AUTOMATION_TRACE", snapshot: traceSnapshot },
			automationWorkspaceOrigin,
		);
	}, [automationWorkspaceOrigin, traceSnapshot]);

	const runAutomationMutation = useCallback<WorkbenchChatToolHandler>(
		async (_parameters, context) => {
			if (readOnly) {
				throw new Error(
					"You have read-only access to this automation.",
				);
			}
			if (automationDirty) {
				throw new Error(
					"Save the unsaved editor changes before using chat to modify this automation.",
				);
			}
			const output = await runWorkbenchRoomMcpTool(
				context.insightId,
				context.roomId,
				context.toolCall,
			);
			notifyAutomationChanged();
			return output;
		},
		[automationDirty, notifyAutomationChanged, readOnly],
	);

	useEffect(() => {
		if (readOnly) return;
		const model = workspace.model;
		const legacySettingsTab = model?.getNodeById("settings-panel");

		if (legacySettingsTab instanceof FlexLayout.TabNode) {
			legacySettingsTab
				.getModel()
				.doAction(
					FlexLayout.Actions.deleteTab(legacySettingsTab.getId()),
				);
		}
	}, [readOnly, workspace.model]);

	useEffect(() => {
		if (readOnly) return;
		const traceTab = workspace.model?.getNodeById("automation-trace");
		if (
			traceTab instanceof FlexLayout.TabNode &&
			traceTab.getName() !== "Run details"
		) {
			traceTab
				.getModel()
				.doAction(
					FlexLayout.Actions.renameTab(
						traceTab.getId(),
						"Run details",
					),
				);
		}
	}, [readOnly, workspace.model]);

	useEffect(() => {
		if (readOnly) return;
		const model = workspace.model;
		if (
			!model ||
			(model.getNodeById("automation-chat") &&
				model.getNodeById("automation-trace") &&
				model.getNodeById("automation-history"))
		) {
			return;
		}
		const layout = model.toJson();
		const rightBorder = layout.borders?.find(
			(border) => border.location === "right",
		);
		const chatTab = {
			id: "automation-chat",
			type: "tab" as const,
			name: "Chat",
			component: "automation-chat",
			enableClose: false,
			enableRenderOnDemand: false,
			config: {},
		};
		const traceTab = {
			id: "automation-trace",
			type: "tab" as const,
			name: "Run details",
			component: "automation-trace",
			enableClose: false,
			enableRenderOnDemand: false,
			config: {},
		};
		const historyTab = {
			id: "automation-history",
			type: "tab" as const,
			name: "History",
			component: "automation-history",
			enableClose: false,
			enableRenderOnDemand: false,
			config: {},
		};

		if (rightBorder) {
			if (!model.getNodeById("automation-chat")) {
				rightBorder.children.push(chatTab);
			}
			if (!model.getNodeById("automation-trace")) {
				rightBorder.children.push(traceTab);
			}
			if (!model.getNodeById("automation-history")) {
				rightBorder.children.push(historyTab);
			}
		} else {
			layout.borders = [
				...(layout.borders ?? []),
				{
					type: "border",
					location: "right",
					selected: 0,
					size: 400,
					minSize: 320,
					children: [chatTab, traceTab, historyTab],
				},
			];
		}
		workspace.load({ version: "", layout });
		workspace.saveToCache();
	}, [readOnly, workspace.load, workspace.model, workspace.saveToCache]);

	useEffect(() => {
		const model = workspace.model;
		if (!model) return;

		const updateTabStrip = () => {
			const editorTab = model.getNodeById("automation-editor");
			const editorTabset = editorTab?.getParent();
			if (editorTabset instanceof FlexLayout.TabSetNode) {
				setShowEditorTabs(editorTabset.getChildren().length > 1);
			}
		};

		updateTabStrip();
		model.addChangeListener(updateTabStrip);
		return () => model.removeChangeListener(updateTabStrip);
	}, [workspace.model]);

	useEffect(() => {
		if (readOnly) return;
		const editorTab = workspace.model?.getNodeById("automation-editor");
		const editorTabset = editorTab?.getParent();
		if (editorTabset instanceof FlexLayout.TabSetNode) {
			editorTabset.getModel().doAction(
				FlexLayout.Actions.updateNodeAttributes(editorTabset.getId(), {
					enableTabStrip: showEditorTabs,
				}),
			);
		}
	}, [readOnly, showEditorTabs, workspace.model]);

	const factory: React.ComponentProps<typeof WorkspaceManager>["factory"] = (
		node,
		layout,
	) => {
		const component = node.getComponent();
		const config = node.getConfig();

		if (component === "automation-editor") {
			return (
				<iframe
					ref={automationFrameRef}
					className="h-full w-full border-none"
					title="Automation Workspace"
					src={`${AUTOMATION_WORKSPACE_URL}?app=${encodeURIComponent(appId)}&mode=edit&readOnly=${readOnly ? "1" : "0"}&parentOrigin=${encodeURIComponent(window.location.origin)}`}
					sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
				/>
			);
		}

		if (component === "automation-chat") {
			if (readOnly) {
				return (
					<div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground text-sm">
						Automation chat is unavailable with read-only access.
					</div>
				);
			}
			return (
				<WorkbenchChatPanel
					systemPrompt={`You create and modify the ${project.project_display_name || project.project_name} automation. Use the Automation Project Tools to make changes. AddAutomationStep requires nodeType, config, label, and outputVar. Prefer supported engine-backed nodes: database.* queries a selected database; model.* calls a selected AI model; storage.* manages files in selected storage; vector.* searches or manages selected documents; function.execute invokes a selected function engine; app.pixel runs Pixel in a selected app; agent.run invokes a selected WORKSPACE agent; control.wait pauses. Every engine-backed node requires a real selected engineId--never invent one or create an engine node without it. Before adding or updating app.pixel, call MyProjects with projectType=["CODE","BLOCKS"], use the returned project_id exactly as appId, call GetProjectAvailableReactors, then call GetProjectReactorSignature for the exact case-sensitive reactor. Use its returned template and supply every required parameter; ask the user when a required value or valid upstream placeholder is unavailable. Keep appId separate from pixel and never put APP or LoadApp inside the Pixel expression. Before adding or updating agent.run, call MyProjects with projectType=["WORKSPACE"], choose an agent the user can access, and use its returned project_id exactly as workspaceId; also select its MODEL engineId with MyEngines. For app-building requests, use the accessible App Building Agent returned by MyProjects. Never invent an app, reactor, agent, or engine ID; never import an agent client or emulate agent.run in Python. Use developer.python only when no supported engine action can perform a public external integration, such as calling the GitHub REST API. Its config must provide source defining run(scope); do not use it for database, model, storage, vector, function, app, or agent work. Use output placeholders such as \${prior_output} in downstream configuration. Use UpdateAutomationStep to change a generated node. For UpdateAutomationCustomStep, first call GetAutomation and pass its exact sourceHashes[nodeId] value as expectedSourceHash. If any requested mutation fails, say the automation is only partially updated and identify the unresolved change. Never embed credentials, edit project files directly, or claim a workflow change succeeded before its tool result confirms it.`}
					mcp={automationMcp}
					toolHandlers={{
						AddAutomationStep: runAutomationMutation,
						UpdateAutomationStep: runAutomationMutation,
						UpdateAutomationCustomStep: runAutomationMutation,
						RemoveAutomationStep: runAutomationMutation,
					}}
				/>
			);
		}

		if (component === "automation-trace") {
			return (
				<iframe
					ref={traceFrameRef}
					className="h-full w-full border-none"
					title="Automation run details"
					src={`${AUTOMATION_WORKSPACE_URL}?app=${encodeURIComponent(appId)}&mode=trace&parentOrigin=${encodeURIComponent(window.location.origin)}`}
					sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
				/>
			);
		}

		if (component === "automation-history") {
			return (
				<iframe
					ref={historyFrameRef}
					className="h-full w-full border-none"
					title="Automation history"
					src={`${AUTOMATION_WORKSPACE_URL}?app=${encodeURIComponent(appId)}&mode=history&parentOrigin=${encodeURIComponent(window.location.origin)}`}
					sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
				/>
			);
		}

		if (component === "automation-inspector") {
			return (
				<iframe
					ref={inspectorFrameRef}
					className="h-full w-full border-none"
					title="Automation inspector"
					src={`${AUTOMATION_WORKSPACE_URL}?app=${encodeURIComponent(appId)}&mode=inspector&readOnly=${readOnly ? "1" : "0"}&parentOrigin=${encodeURIComponent(window.location.origin)}`}
					sandbox="allow-scripts allow-same-origin"
				/>
			);
		}

		if (component === "app-file-explorer") {
			return (
				<AppFileExplorer
					node={node}
					layout={layout}
					app={workspace.appId}
					readOnly={readOnly}
				/>
			);
		}

		if (component === "app-file-editor") {
			return (
				<AppFileEditor
					node={node}
					app={workspace.appId}
					readOnly={readOnly}
				/>
			);
		}

		if (component === "mcpJsonEditor") {
			return <MCPJsonEditor dataMap={config.data} readOnly={readOnly} />;
		}

		if (component === "settings-panel") {
			return <ProjectDetailTabs tabs={SETTINGS_TABS} />;
		}

		return null;
	};

	if (!project) {
		return null;
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader logo={null} />
				<Breadcrumb>
					<BreadcrumbList>
						{catalog && (
							<>
								<BreadcrumbItem>
									<BreadcrumbLink asChild>
										<Link to={catalog.path}>
											{catalog.name} Catalog
										</Link>
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator>
									<ChevronRightIcon />
								</BreadcrumbSeparator>
							</>
						)}
						<BreadcrumbItem>
							{catalog ? (
								<BreadcrumbLink asChild>
									<Link
										to={`${catalog.path}/${project.project_id}`}
									>
										{project.project_display_name ||
											project.project_name}
									</Link>
								</BreadcrumbLink>
							) : (
								<BreadcrumbPage>
									{project.project_display_name ||
										project.project_name}
								</BreadcrumbPage>
							)}
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
							className={readOnly ? "hidden" : undefined}
							onClick={() => setShareOpen(true)}
						>
							<Share2 className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Share App</TooltipContent>
				</Tooltip>
				<Dialog
					open={shareOpen}
					onOpenChange={(o) => !o && setShareOpen(false)}
				>
					<DialogContent className="max-w-lg p-0">
						<ShareOverlay
							appId={workspace.appId}
							onClose={() => setShareOpen(false)}
						/>
					</DialogContent>
				</Dialog>
			</NavbarRight>
			<WorkspaceManager
				options={DEFAULT_OPTIONS}
				factory={factory}
				readOnly={readOnly}
			/>
		</>
	);
});
