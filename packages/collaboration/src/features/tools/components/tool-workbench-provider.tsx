import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import {
	type FilePanelMode,
	getFilePanelType,
	isFilePanelType,
} from "@semoss/panels";
import { useIsMobile } from "@semoss/ui/next";
import {
	createWorkbenchStore,
	type WorkbenchLayout,
	type WorkbenchPanelConfigAny,
	type WorkbenchState,
} from "@semoss/workbench";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { TOOL_WORKBENCH_COMPONENTS } from "../tool-workbench.components";
import {
	createToolWorkbenchLayout,
	RUN_PANEL_TYPE,
	TOOL_PANEL_TYPE,
	toolCardTriggerId,
} from "../tool-workbench.constants";
import { ToolWorkbenchContext } from "../tool-workbench.context";
import {
	getToolDisplayLocation,
	shouldAutoOpenTool,
} from "../utils/tool-metadata";

export interface ToolWorkbenchProviderProps {
	/** Host-specific panels and initial arrangement; supplied before store creation. */
	components?: Record<string, WorkbenchPanelConfigAny>;
	createLayout?: (insightId: string) => WorkbenchLayout;
	/** A host with persistent run-status controls may keep the dock closed until requested. */
	autoReveal?: boolean;
	/** Initial visibility chosen by the host; later toggles remain user-owned. */
	defaultOpen?: boolean;
	/** Resolve the host destination before opening a working tab. */
	panelTarget?: (
		layout: WorkbenchState["layout"],
	) => Parameters<WorkbenchState["layout"]["actions"]["movePanel"]>[1];
	roomId: string;
	insightId: string;
	tools: Record<string, ConversationTool>;
	toolCreatedAt?: Record<string, string>;
	pendingApprovals: PendingToolApproval[];
	onApproveTool: (
		approval: PendingToolApproval,
		argumentsValue: Record<string, unknown>,
	) => Promise<void>;
	onRejectTool: (approval: PendingToolApproval) => Promise<void>;
	children: ReactNode;
}

/** One room's persistent store and the snapshot identity used to hydrate it. */
interface RoomToolWorkbench {
	store: ReturnType<typeof createWorkbenchStore>;
	snapshot: ReturnType<typeof createToolWorkbenchLayout>;
}

function createRoomToolWorkbench(
	insightId: string,
	components: Record<string, WorkbenchPanelConfigAny>,
	createLayout: (insightId: string) => WorkbenchLayout,
): RoomToolWorkbench {
	const snapshot = createLayout(insightId);
	const store = createWorkbenchStore({
		components,
	});
	// This store outlives the conditional Workbench shell. Restore exactly once
	// here so opening a panel while the shell is hidden cannot be overwritten on
	// the shell's next mount.
	store.getState().layout.actions.loadSnapshot(snapshot);
	return { store, snapshot };
}

/** Own one persistent tool dock for the current room. */
export function ToolWorkbenchProvider({
	roomId,
	insightId,
	tools,
	toolCreatedAt,
	pendingApprovals,
	onApproveTool,
	onRejectTool,
	children,
	autoReveal = true,
	defaultOpen = false,
	panelTarget,
	components = TOOL_WORKBENCH_COMPONENTS,
	createLayout = createToolWorkbenchLayout,
}: ToolWorkbenchProviderProps) {
	const [{ store, snapshot }] = useState(() =>
		createRoomToolWorkbench(insightId, components, createLayout),
	);
	const isMobile = useIsMobile();
	const [isOpen, setIsOpen] = useState(defaultOpen);
	const [inlineToolIds, setInlineToolIds] = useState<Set<string>>(
		() => new Set(),
	);
	const automaticallyOpened = useRef(new Set<string>());
	const workbenchTriggerId = useRef<string | null>(null);
	const activeToolId = useSyncExternalStore(
		store.subscribe,
		() => {
			const state = store.getState().layout;
			const selectedToolId = state.selection.panel
				? state.panels[state.selection.panel]?.config?.toolId
				: undefined;
			if (typeof selectedToolId === "string") return selectedToolId;

			// Selecting the file rail or an editor must not disable the workbench
			// toggle. Keep the most recently selected tool as the focus return
			// target while a file panel is active.
			for (
				let index = state.selection.history.length - 1;
				index >= 0;
				index -= 1
			) {
				const toolId =
					state.panels[state.selection.history[index]]?.config
						?.toolId;
				if (typeof toolId === "string") return toolId;
			}
			return null;
		},
		() => null,
	);
	const workbenchToolIdsKey = useSyncExternalStore(
		store.subscribe,
		() =>
			JSON.stringify(
				Object.values(store.getState().layout.panels)
					.flatMap((panel) => {
						if (panel.type !== TOOL_PANEL_TYPE) return [];
						const toolId = panel.config?.toolId;
						return typeof toolId === "string" ? [toolId] : [];
					})
					.sort(),
			),
		() => "[]",
	);
	const workbenchToolIds = useMemo(
		() => new Set<string>(JSON.parse(workbenchToolIdsKey) as string[]),
		[workbenchToolIdsKey],
	);

	useEffect(() => {
		const layout = store.getState().layout;
		for (const panel of layout.actions.findPanels((candidate) => {
			const config = candidate.config as
				| { mode?: FilePanelMode; isolated?: boolean }
				| undefined;
			const mode = config?.mode;
			return (
				isFilePanelType(candidate.type) &&
				!config?.isolated &&
				mode?.type === "INSIGHT" &&
				mode.insightId !== insightId
			);
		})) {
			layout.actions.updatePanel(panel.id, {
				config: {
					...panel.config,
					mode: { type: "INSIGHT", insightId },
				},
			});
		}
	}, [insightId, store]);

	useEffect(() => {
		const layout = store.getState().layout;
		for (const panel of Object.values(layout.panels)) {
			const toolId = panel.config?.toolId;
			const nextName =
				typeof toolId === "string" ? tools[toolId]?.title : undefined;
			if (nextName && nextName !== panel.name) {
				layout.actions.updatePanel(panel.id, { name: nextName });
			}
		}
	}, [store, tools]);

	const focusToolTrigger = useCallback((toolId: string) => {
		window.requestAnimationFrame(() => {
			document.getElementById(toolCardTriggerId(toolId))?.focus();
		});
	}, []);

	const openWorkbench = useCallback(
		(toolId?: string, returnFocusId?: string) => {
			if (!isOpen) {
				const trigger = document.activeElement;
				workbenchTriggerId.current =
					returnFocusId ??
					(trigger instanceof HTMLElement
						? trigger.id || null
						: null);
			}
			if (toolId) {
				setInlineToolIds((current) => {
					if (!current.has(toolId)) return current;
					const next = new Set(current);
					next.delete(toolId);
					return next;
				});
				const actions = store.getState().layout.actions;
				const panelId = actions.selectPanel(
					TOOL_PANEL_TYPE,
					{ toolId },
					{
						name: tools[toolId]?.title ?? "Tool",
						target: panelTarget?.(store.getState().layout),
					},
				);
				actions.updatePanel(panelId, {
					name: tools[toolId]?.title ?? "Tool",
					config: { toolId },
				});
			}
			setIsOpen(true);
		},
		[isOpen, store, tools, panelTarget],
	);

	const openRun = useCallback(
		(runId: string) => {
			if (!isOpen) workbenchTriggerId.current = `run-${runId}`;
			store.getState().layout.actions.selectPanel(
				RUN_PANEL_TYPE,
				{ runId },
				{
					name: "Agent run",
					target: panelTarget?.(store.getState().layout),
				},
			);
			setIsOpen(true);
		},
		[isOpen, store, panelTarget],
	);

	const openFile = useCallback(
		(path: string, name: string, fileInsightId?: string) => {
			if (!isOpen) {
				const trigger = document.activeElement;
				workbenchTriggerId.current =
					trigger instanceof HTMLElement ? trigger.id || null : null;
			}
			const otherInsightId =
				fileInsightId && fileInsightId !== insightId
					? fileInsightId
					: null;
			store.getState().layout.actions.selectPanel(
				getFilePanelType(path),
				{
					mode: {
						type: "INSIGHT",
						insightId: otherInsightId ?? insightId,
					},
					name,
					path,
					// Another insight's file keeps its own scope when the room's insight changes.
					...(otherInsightId ? { isolated: true } : {}),
				},
				{ name, target: panelTarget?.(store.getState().layout) },
			);
			setIsOpen(true);
		},
		[insightId, isOpen, store, panelTarget],
	);

	const openInline = useCallback(
		(toolId: string) => {
			if (isMobile) setIsOpen(false);
			const actions = store.getState().layout.actions;
			for (const panel of actions.matchPanels(TOOL_PANEL_TYPE, {
				toolId,
			})) {
				actions.closePanel(panel.id);
			}
			setInlineToolIds((current) => {
				if (current.has(toolId)) return current;
				return new Set(current).add(toolId);
			});
			focusToolTrigger(toolId);
		},
		[focusToolTrigger, isMobile, store],
	);

	const closeTool = useCallback(
		(toolId: string) => {
			const actions = store.getState().layout.actions;
			for (const panel of actions.matchPanels(TOOL_PANEL_TYPE, {
				toolId,
			})) {
				actions.closePanel(panel.id);
			}
			setInlineToolIds((current) => {
				if (!current.has(toolId)) return current;
				const next = new Set(current);
				next.delete(toolId);
				return next;
			});
			focusToolTrigger(toolId);
		},
		[focusToolTrigger, store],
	);

	const closeWorkbench = useCallback(() => {
		setIsOpen(false);
		if (workbenchTriggerId.current) {
			const triggerId = workbenchTriggerId.current;
			window.requestAnimationFrame(() =>
				document.getElementById(triggerId)?.focus(),
			);
			workbenchTriggerId.current = null;
			return true;
		} else if (activeToolId) focusToolTrigger(activeToolId);
		return false;
	}, [activeToolId, focusToolTrigger]);

	useEffect(() => {
		if (!autoReveal) return;
		const approval = pendingApprovals.find(
			(item) =>
				!automaticallyOpened.current.has(
					`approval:${item.actionId ?? item.toolId}`,
				),
		);
		const tool = approval && tools[approval.toolId];
		if (!approval || !tool) return;
		automaticallyOpened.current.add(
			`approval:${approval.actionId ?? approval.toolId}`,
		);
		// Honor tools that ask to be reviewed in the transcript.
		if (
			isMobile ||
			getToolDisplayLocation(tool) === "inline" ||
			getToolDisplayLocation(tool) === "hidden"
		)
			openInline(tool.id);
		else openWorkbench(approval.toolId);
	}, [
		autoReveal,
		isMobile,
		openInline,
		openWorkbench,
		pendingApprovals,
		tools,
	]);

	useEffect(() => {
		if (!autoReveal) return;
		for (const tool of Object.values(tools)) {
			const key = `tool:${tool.id}`;
			if (
				automaticallyOpened.current.has(key) ||
				!shouldAutoOpenTool(tool) ||
				getToolDisplayLocation(tool) === "hidden"
			) {
				continue;
			}
			automaticallyOpened.current.add(key);
			if (getToolDisplayLocation(tool) === "inline") {
				openInline(tool.id);
			} else {
				openWorkbench(tool.id);
			}
			break;
		}
	}, [autoReveal, openInline, openWorkbench, tools]);

	const isToolInline = useCallback(
		(toolId: string) => inlineToolIds.has(toolId),
		[inlineToolIds],
	);
	const getToolDisplayMode = useCallback(
		(toolId: string) => {
			if (inlineToolIds.has(toolId)) return "inline" as const;
			if (workbenchToolIds.has(toolId)) return "workbench" as const;
			return "hidden" as const;
		},
		[inlineToolIds, workbenchToolIds],
	);

	const value = useMemo(
		() => ({
			store,
			snapshot,
			roomId,
			insightId,
			openRun,
			tools,
			toolCreatedAt,
			pendingApprovals,
			isOpen,
			activeToolId,
			isToolInline,
			getToolDisplayMode,
			openInline,
			openWorkbench,
			openFile,
			closeTool,
			closeWorkbench,
			onApproveTool,
			onRejectTool,
		}),
		[
			store,
			snapshot,
			roomId,
			insightId,
			openRun,
			tools,
			toolCreatedAt,
			pendingApprovals,
			isOpen,
			activeToolId,
			isToolInline,
			getToolDisplayMode,
			openInline,
			openWorkbench,
			openFile,
			closeTool,
			closeWorkbench,
			onApproveTool,
			onRejectTool,
		],
	);

	return (
		<ToolWorkbenchContext.Provider value={value}>
			{children}
		</ToolWorkbenchContext.Provider>
	);
}
