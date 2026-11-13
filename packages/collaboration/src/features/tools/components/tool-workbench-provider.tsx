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

// Issue 3857: remember the sub-agent run the person has open, per conversation, so a
// page refresh reopens the same one in the side panel instead of dropping them back to
// the chat. sessionStorage keeps it to this tab and clears when the tab closes; every
// access is guarded because storage can be blocked or empty (private mode, previews).
const OPEN_RUN_KEY_PREFIX = "semoss.workbench.openRun.";

function openRunStorageKey(insightId: string): string {
	return `${OPEN_RUN_KEY_PREFIX}${insightId}`;
}

function rememberOpenRun(insightId: string, runId: string | null): void {
	try {
		if (runId) sessionStorage.setItem(openRunStorageKey(insightId), runId);
		else sessionStorage.removeItem(openRunStorageKey(insightId));
	} catch {
		// storage unavailable; the panel still works for this session.
	}
}

function recallOpenRun(insightId: string): string | null {
	try {
		return sessionStorage.getItem(openRunStorageKey(insightId));
	} catch {
		return null;
	}
}

export interface ToolWorkbenchProviderProps {
	/** Host-specific panels and initial arrangement; supplied before store creation. */
	components?: Record<string, WorkbenchPanelConfigAny>;
	createLayout?: (insightId: string) => WorkbenchLayout;
	/** Changing it merges a fresh createLayout into the live dock, keeping children mounted. */
	layoutKey?: string;
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
	layoutKey,
}: ToolWorkbenchProviderProps) {
	const [{ store, snapshot: initialSnapshot }] = useState(() =>
		createRoomToolWorkbench(insightId, components, createLayout),
	);
	// the shell re-applies this on mount, so it must track what the store loaded
	const [snapshot, setSnapshot] = useState(initialSnapshot);
	const appliedLayoutKey = useRef(layoutKey);
	useEffect(() => {
		if (appliedLayoutKey.current === layoutKey) return;
		appliedLayoutKey.current = layoutKey;
		const actions = store.getState().layout.actions;
		const current = actions.getSnapshot();
		const next = createLayout(insightId);
		// new panels and rails join; panels the user already opened stay
		const merged = {
			...current,
			panels: { ...next.panels, ...current.panels },
			borders: { ...current.borders, ...next.borders },
		};
		actions.loadSnapshot(merged);
		setSnapshot(merged);
	}, [layoutKey, createLayout, insightId, store]);
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
			// so a refresh reopens this same sub-agent
			rememberOpenRun(insightId, runId);
		},
		[isOpen, store, panelTarget, insightId],
	);

	// Issue 3857: after a refresh, reopen the sub-agent the person had open. Runs once
	// per conversation, and only when nothing is open yet, so it never fights a live
	// selection. The panel reopens without stealing focus, since no one clicked.
	const restoredRunFor = useRef<string | null>(null);
	useEffect(() => {
		if (restoredRunFor.current === insightId) return;
		restoredRunFor.current = insightId;
		const runId = recallOpenRun(insightId);
		if (!runId || store.getState().layout.selection.panel) return;
		store.getState().layout.actions.selectPanel(
			RUN_PANEL_TYPE,
			{ runId },
			{
				name: "Agent run",
				target: panelTarget?.(store.getState().layout),
			},
		);
		setIsOpen(true);
	}, [insightId, store, panelTarget]);

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
		// an explicit close should not reopen on the next refresh
		rememberOpenRun(insightId, null);
		if (workbenchTriggerId.current) {
			const triggerId = workbenchTriggerId.current;
			window.requestAnimationFrame(() =>
				document.getElementById(triggerId)?.focus(),
			);
			workbenchTriggerId.current = null;
			return true;
		} else if (activeToolId) focusToolTrigger(activeToolId);
		return false;
	}, [activeToolId, focusToolTrigger, insightId]);

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
