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
	const { catalog, project } = useProject();
	const [shareOpen, setShareOpen] = useState(false);
	const appId = workspace.appId || project.project_id;
	const [showEditorTabs, setShowEditorTabs] = useState(false);
	const automationFrameRef = useRef<HTMLIFrameElement>(null);
	const traceFrameRef = useRef<HTMLIFrameElement>(null);
	const inspectorFrameRef = useRef<HTMLIFrameElement>(null);
	const [traceSnapshot, setTraceSnapshot] = useState<unknown>(null);
	const [inspectorSnapshot, setInspectorSnapshot] = useState<unknown>(null);
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
	}, [appId]);

	const automationMcp = useMemo<MCPConfig[]>(
		() => [
			{
				id: appId,
				name: "Automation Project Tools",
				type: "PROJECT",
			},
		],
		[appId],
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
			};
			if (
				event.source === automationFrameRef.current?.contentWindow &&
				message.type === "SEMOSS_AUTOMATION_TRACE"
			) {
				setTraceSnapshot(message.snapshot);
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
	}, [workspace.load, workspace.model, workspace.saveToCache]);

	useEffect(() => {
		traceFrameRef.current?.contentWindow?.postMessage(
			{ type: "SEMOSS_AUTOMATION_TRACE", snapshot: traceSnapshot },
			automationWorkspaceOrigin,
		);
	}, [automationWorkspaceOrigin, traceSnapshot]);

	const runAutomationMutation = useCallback<WorkbenchChatToolHandler>(
		async (_parameters, context) => {
			const output = await runWorkbenchRoomMcpTool(
				context.insightId,
				context.roomId,
				context.toolCall,
			);
			notifyAutomationChanged();
			return output;
		},
		[notifyAutomationChanged],
	);

	useEffect(() => {
		const model = workspace.model;
		const legacySettingsTab = model?.getNodeById("settings-panel");

		if (legacySettingsTab instanceof FlexLayout.TabNode) {
			legacySettingsTab
				.getModel()
				.doAction(
					FlexLayout.Actions.deleteTab(legacySettingsTab.getId()),
				);
		}
	}, [workspace.model]);

	useEffect(() => {
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
	}, [workspace.model]);

	useEffect(() => {
		const model = workspace.model;
		if (
			!model ||
			(model.getNodeById("automation-chat") &&
				model.getNodeById("automation-trace"))
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

		if (rightBorder) {
			if (!model.getNodeById("automation-chat")) {
				rightBorder.children.push(chatTab);
			}
			if (!model.getNodeById("automation-trace")) {
				rightBorder.children.push(traceTab);
			}
			rightBorder.selected = rightBorder.children.length - 1;
		} else {
			layout.borders = [
				...(layout.borders ?? []),
				{
					type: "border",
					location: "right",
					selected: 0,
					size: 400,
					minSize: 320,
					children: [chatTab, traceTab],
				},
			];
		}
		workspace.load({ version: "", layout });
		workspace.saveToCache();
	}, [workspace.load, workspace.model, workspace.saveToCache]);

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
		const editorTab = workspace.model?.getNodeById("automation-editor");
		const editorTabset = editorTab?.getParent();
		if (editorTabset instanceof FlexLayout.TabSetNode) {
			editorTabset.getModel().doAction(
				FlexLayout.Actions.updateNodeAttributes(editorTabset.getId(), {
					enableTabStrip: showEditorTabs,
				}),
			);
		}
	}, [showEditorTabs, workspace.model]);

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
					src={`${AUTOMATION_WORKSPACE_URL}?app=${encodeURIComponent(appId)}&mode=edit&parentOrigin=${encodeURIComponent(window.location.origin)}`}
					sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
				/>
			);
		}

		if (component === "automation-chat") {
			return (
				<WorkbenchChatPanel
					systemPrompt={`You create and modify the ${project.project_display_name || project.project_name} automation. Use the Automation Project Tools to make changes. AddAutomationStep requires nodeType, config, label, and outputVar. Prefer supported engine-backed nodes: database.* queries a selected database; model.* calls a selected AI model; storage.* manages files in selected storage; vector.* searches or manages selected documents; function.execute invokes a selected function engine; app.pixel runs Pixel; control.wait pauses. Every engine-backed node requires a real selected engineId--never invent one or create an engine node without it. Use developer.python only when no supported engine action can perform a public external integration, such as calling the GitHub REST API. Its config must provide source defining run(scope); do not use it for database, model, storage, vector, or function work. Use output placeholders such as \${prior_output} in downstream configuration. Use UpdateAutomationStep to change a generated node. For UpdateAutomationCustomStep, first call GetAutomation and pass its exact sourceHashes[nodeId] value as expectedSourceHash. If any requested mutation fails, say the automation is only partially updated and identify the unresolved change. Never embed credentials, edit project files directly, or claim a workflow change succeeded before its tool result confirms it.`}
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
					sandbox="allow-scripts allow-same-origin"
				/>
			);
		}

		if (component === "automation-inspector") {
			return (
				<iframe
					ref={inspectorFrameRef}
					className="h-full w-full border-none"
					title="Automation inspector"
					src={`${AUTOMATION_WORKSPACE_URL}?app=${encodeURIComponent(appId)}&mode=inspector&parentOrigin=${encodeURIComponent(window.location.origin)}`}
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
				/>
			);
		}

		if (component === "app-file-editor") {
			return <AppFileEditor node={node} app={workspace.appId} />;
		}

		if (component === "mcpJsonEditor") {
			return <MCPJsonEditor dataMap={config.data} />;
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
							<BreadcrumbPage>Edit</BreadcrumbPage>
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
			<WorkspaceManager options={DEFAULT_OPTIONS} factory={factory} />
		</>
	);
});
