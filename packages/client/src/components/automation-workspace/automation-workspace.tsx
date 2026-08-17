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
				selected: -1,
				size: 320,
				children: [
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
				selected: -1,
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
		const canvasOrigin = new URL(
			AUTOMATION_WORKSPACE_URL,
			window.location.origin,
		).origin;
		automationFrameRef.current?.contentWindow?.postMessage(
			{ type: "SEMOSS_AUTOMATION_REFRESH", projectId: appId },
			canvasOrigin,
		);
	}, [appId]);

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
		const model = workspace.model;
		if (!model || model.getNodeById("automation-chat")) {
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

		if (rightBorder) {
			rightBorder.children.push(chatTab);
		} else {
			layout.borders = [
				...(layout.borders ?? []),
				{
					type: "border",
					location: "right",
					selected: -1,
					size: 400,
					minSize: 320,
					children: [chatTab],
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
					systemPrompt={`You create and modify the ${project.project_display_name || project.project_name} automation. Use the Automation Project Tools to add each workflow action. AddAutomationStep requires an actionId and config: select python-step.skeleton for GitHub, email, or another editable external integration, then use the returned sourceHash with UpdateAutomationCustomStep. Select model.llm for every AI summary; its config must include the summary command referencing the preceding output. If no Model engine is known, omit engineId and create the incomplete model-engine draft for the user to configure in the inspector. Never substitute a python-step for an AI summary. Never provide nodeType or operation; the selected actionId determines them. Never embed credentials, edit project files directly, or claim a workflow change succeeded before its tool result confirms it.`}
					mcp={automationMcp}
					toolHandlers={{
						AddAutomationStep: runAutomationMutation,
						UpdateAutomationCustomStep: runAutomationMutation,
					}}
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
