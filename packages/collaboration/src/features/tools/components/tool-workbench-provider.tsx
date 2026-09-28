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
import { createWorkbenchStore } from "@semoss/workbench";
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

function createRoomToolWorkbench(insightId: string): RoomToolWorkbench {
	const snapshot = createToolWorkbenchLayout(insightId);
	const store = createWorkbenchStore({
		components: TOOL_WORKBENCH_COMPONENTS,
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
}: ToolWorkbenchProviderProps) {
	const [{ store, snapshot }] = useState(() =>
		createRoomToolWorkbench(insightId),
	);
	const isMobile = useIsMobile();
	const [isOpen, setIsOpen] = useState(false);
	const [inlineToolIds, setInlineToolIds] = useState<Set<string>>(
		() => new Set(),
	);
	const automaticallyOpened = useRef(new Set<string>());
	const runTriggerId = useRef<string | null>(null);
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
			const mode = (
				candidate.config as { mode?: FilePanelMode } | undefined
			)?.mode;
			return (
				isFilePanelType(candidate.type) &&
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
		(toolId?: string) => {
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
					{ name: tools[toolId]?.title ?? "Tool" },
				);
				actions.updatePanel(panelId, {
					name: tools[toolId]?.title ?? "Tool",
					config: { toolId },
				});
			}
			setIsOpen(true);
		},
		[store, tools],
	);

	const openRun = useCallback(
		(runId: string) => {
			if (!isOpen) runTriggerId.current = `run-${runId}`;
			store
				.getState()
				.layout.actions.selectPanel(
					RUN_PANEL_TYPE,
					{ runId },
					{ name: "Agent run" },
				);
			setIsOpen(true);
		},
		[isOpen, store],
	);

	const openFile = useCallback(
		(path: string, name: string) => {
			store
				.getState()
				.layout.actions.selectPanel(
					getFilePanelType(path),
					{ mode: { type: "INSIGHT", insightId }, name, path },
					{ name },
				);
			setIsOpen(true);
		},
		[insightId, store],
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
		if (runTriggerId.current) {
			const triggerId = runTriggerId.current;
			window.requestAnimationFrame(() =>
				document.getElementById(triggerId)?.focus(),
			);
			runTriggerId.current = null;
		} else if (activeToolId) focusToolTrigger(activeToolId);
	}, [activeToolId, focusToolTrigger]);

	useEffect(() => {
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
	}, [isMobile, openInline, openWorkbench, pendingApprovals, tools]);

	useEffect(() => {
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
	}, [openInline, openWorkbench, tools]);

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
