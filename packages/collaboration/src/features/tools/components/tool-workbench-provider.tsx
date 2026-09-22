import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { createWorkbenchStore } from "@semoss/workbench";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { TOOL_WORKBENCH_COMPONENTS } from "../tool-workbench.components";
import {
	TOOL_PANEL_TYPE,
	TOOL_WORKBENCH_LAYOUT,
	toolCardTriggerId,
} from "../tool-workbench.constants";
import { ToolWorkbenchContext } from "../tool-workbench.context";
import {
	getToolDisplayLocation,
	shouldAutoOpenTool,
} from "../utils/tool-metadata";

export interface ToolWorkbenchProviderProps {
	roomId: string;
	tools: Record<string, ConversationTool>;
	pendingApprovals: PendingToolApproval[];
	onApproveTool: (
		approval: PendingToolApproval,
		argumentsValue: Record<string, unknown>,
	) => Promise<void>;
	onRejectTool: (approval: PendingToolApproval) => Promise<void>;
	children: ReactNode;
}

function createRoomToolWorkbench() {
	const store = createWorkbenchStore({
		components: TOOL_WORKBENCH_COMPONENTS,
	});
	// This store outlives the conditional Workbench shell. Restore exactly once
	// here so opening a panel while the shell is hidden cannot be overwritten on
	// the shell's next mount.
	store.getState().layout.actions.loadSnapshot(TOOL_WORKBENCH_LAYOUT);
	return store;
}

/** Own one persistent tool dock for the current room. */
export function ToolWorkbenchProvider({
	roomId,
	tools,
	pendingApprovals,
	onApproveTool,
	onRejectTool,
	children,
}: ToolWorkbenchProviderProps) {
	const [store] = useState(createRoomToolWorkbench);
	const [isOpen, setIsOpen] = useState(false);
	const [inlineToolIds, setInlineToolIds] = useState<Set<string>>(
		() => new Set(),
	);
	const automaticallyOpened = useRef(new Set<string>());
	const activeToolId = useSyncExternalStore(
		store.subscribe,
		() => {
			const state = store.getState().layout;
			const selected = state.selection.panel;
			const toolId = selected
				? state.panels[selected]?.config?.toolId
				: undefined;
			return typeof toolId === "string" ? toolId : null;
		},
		() => null,
	);
	const panelCount = useSyncExternalStore(
		store.subscribe,
		() => Object.keys(store.getState().layout.panels).length,
		() => 0,
	);
	const workbenchToolIdsKey = useSyncExternalStore(
		store.subscribe,
		() =>
			JSON.stringify(
				Object.values(store.getState().layout.panels)
					.flatMap((panel) => {
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
		if (panelCount === 0) setIsOpen(false);
	}, [panelCount]);

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
		(toolId: string) => {
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
			setIsOpen(true);
		},
		[store, tools],
	);

	const openInline = useCallback(
		(toolId: string) => {
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
		[focusToolTrigger, store],
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
		if (activeToolId) focusToolTrigger(activeToolId);
	}, [activeToolId, focusToolTrigger]);

	useEffect(() => {
		const approval = pendingApprovals.find(
			(item) =>
				!automaticallyOpened.current.has(`approval:${item.toolId}`),
		);
		if (!approval || !tools[approval.toolId]) return;
		automaticallyOpened.current.add(`approval:${approval.toolId}`);
		openWorkbench(approval.toolId);
	}, [openWorkbench, pendingApprovals, tools]);

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
			roomId,
			tools,
			pendingApprovals,
			isOpen,
			activeToolId,
			isToolInline,
			getToolDisplayMode,
			openInline,
			openWorkbench,
			closeTool,
			closeWorkbench,
			onApproveTool,
			onRejectTool,
		}),
		[
			store,
			roomId,
			tools,
			pendingApprovals,
			isOpen,
			activeToolId,
			isToolInline,
			getToolDisplayMode,
			openInline,
			openWorkbench,
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
