import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
} from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { FlexLayout } from "@semoss/shared";
import "flexlayout-react/style/light.css";
import "@semoss/shared/flexlayout.css";

const SIDE_DOCK_ID = "AUTOMATION_SIDE_DOCK";
const CANVAS_TAB_ID = "AUTOMATION_CANVAS";
const CANVAS_TABSET_ID = "AUTOMATION_CANVAS_TABSET";
const INSPECTOR_TAB_ID = "AUTOMATION_INSPECTOR";
const ADD_NODE_TAB_ID = "AUTOMATION_ADD_NODE";
const TEMPLATE_TAB_ID = "AUTOMATION_TEMPLATES";
const VARIABLES_TAB_ID = "AUTOMATION_VARIABLES";
const VALIDATION_TAB_ID = "AUTOMATION_VALIDATION";
const TRACE_TAB_ID = "AUTOMATION_TRACE";
const HISTORY_TAB_ID = "AUTOMATION_HISTORY";

type AutomationDockTab =
	| "inspector"
	| "config"
	| "validation"
	| "trace"
	| "history";

type DockPosition = "left" | "right" | "top" | "bottom";

const sideTabIds: Record<AutomationDockTab, string> = {
	inspector: INSPECTOR_TAB_ID,
	config: VARIABLES_TAB_ID,
	validation: VALIDATION_TAB_ID,
	trace: TRACE_TAB_ID,
	history: HISTORY_TAB_ID,
};

const tabIdToSideTab = Object.fromEntries(
	Object.entries(sideTabIds).map(([tab, id]) => [id, tab]),
) as Record<string, AutomationDockTab>;

const buildWorkbenchModel = (): FlexLayout.IJsonModel => ({
	global: {
		tabEnableRename: false,
		tabEnableDrag: true,
		tabSetEnableDrag: true,
		tabSetEnableDrop: true,
		tabSetEnableDeleteWhenEmpty: false,
	},
	borders: [],
	layout: {
		type: "row",
		weight: 100,
		children: [
			{
				type: "tabset",
				id: SIDE_DOCK_ID,
				weight: 24,
				minWidth: 240,
				minHeight: 180,
				enableDeleteWhenEmpty: false,
				enableDrag: true,
				enableDrop: true,
				enableMaximize: false,
				children: [
					{
						id: INSPECTOR_TAB_ID,
						type: "tab",
						name: "Inspector",
						component: "inspector",
						enableClose: false,
						enableDrag: true,
						enableRename: false,
					},
					{
						id: VARIABLES_TAB_ID,
						type: "tab",
						name: "Variables",
						component: "variables",
						enableClose: false,
						enableDrag: true,
						enableRename: false,
					},
					{
						id: VALIDATION_TAB_ID,
						type: "tab",
						name: "Validation",
						component: "validation",
						enableClose: false,
						enableDrag: true,
						enableRename: false,
					},
					{
						id: TRACE_TAB_ID,
						type: "tab",
						name: "Run trace",
						component: "trace",
						enableClose: false,
						enableDrag: true,
						enableRename: false,
					},
					{
						id: HISTORY_TAB_ID,
						type: "tab",
						name: "History",
						component: "history",
						enableClose: false,
						enableDrag: true,
						enableRename: false,
					},
				],
			},
			{
				type: "tabset",
				id: CANVAS_TABSET_ID,
				weight: 76,
				minWidth: 360,
				minHeight: 360,
				enableDeleteWhenEmpty: false,
				enableDrag: true,
				enableDrop: true,
				enableMaximize: false,
				children: [
					{
						id: CANVAS_TAB_ID,
						type: "tab",
						name: "Authoring canvas",
						component: "canvas",
						enableClose: false,
						enableDrag: true,
						enableRename: false,
					},
				],
			},
		],
	},
});

interface AutomationDockLayoutProps {
	activeTab?: AutomationDockTab;
	addNode: ReactNode;
	canvas: ReactNode;
	history: ReactNode;
	inspector: ReactNode;
	isAddNodeOpen: boolean;
	isTemplateOpen: boolean;
	onActiveTabChange?: (tab: AutomationDockTab) => void;
	onAddNodeTabClose?: () => void;
	onTemplateTabClose?: () => void;
	focusKey?: string | null;
	template: ReactNode;
	trace: ReactNode;
	validation: ReactNode;
	variables: ReactNode;
}

function getDockPosition(model: FlexLayout.Model): DockPosition {
	const sideDock = model.getNodeById(SIDE_DOCK_ID);
	const canvas = model.getNodeById(CANVAS_TAB_ID);
	if (!sideDock || !canvas) return "left";

	const sideRect = sideDock.getRect();
	const canvasRect = canvas.getRect();
	if (sideRect.bottom <= canvasRect.y) return "top";
	if (sideRect.y >= canvasRect.bottom) return "bottom";
	if (sideRect.right <= canvasRect.x) return "left";
	return "right";
}

function getToggleIcon(
	position: DockPosition,
	collapsed: boolean,
): typeof ChevronLeft {
	if (position === "top") return collapsed ? ChevronDown : ChevronUp;
	if (position === "bottom") return collapsed ? ChevronUp : ChevronDown;
	if (position === "right") return collapsed ? ChevronLeft : ChevronRight;
	return collapsed ? ChevronRight : ChevronLeft;
}

export function AutomationDockLayout({
	activeTab,
	addNode,
	canvas,
	history,
	inspector,
	isAddNodeOpen,
	isTemplateOpen,
	onActiveTabChange,
	onAddNodeTabClose,
	onTemplateTabClose,
	focusKey,
	template,
	trace,
	validation,
	variables,
}: AutomationDockLayoutProps) {
	const [model] = useState<FlexLayout.Model>(() =>
		FlexLayout.Model.fromJson(buildWorkbenchModel()),
	);
	const [collapsed, setCollapsed] = useState(false);
	const collapsedRef = useRef(false);
	const [dockPosition, setDockPosition] = useState<DockPosition>("left");

	const syncTemporaryTab = useCallback(
		(
			id: string,
			name: string,
			component: "add-node" | "templates",
			isOpen: boolean,
		) => {
			const existingTab = model.getNodeById(id);
			if (isOpen && !existingTab) {
				model.doAction(
					FlexLayout.Actions.addNode(
						{
							id,
							type: "tab",
							name,
							component,
							enableClose: true,
							enableDrag: true,
							enableRename: false,
						},
						SIDE_DOCK_ID,
						FlexLayout.DockLocation.CENTER,
						-1,
						true,
					),
				);
				return;
			}
			if (isOpen && existingTab) {
				model.doAction(FlexLayout.Actions.selectTab(id));
				return;
			}
			if (!isOpen && existingTab) {
				model.doAction(FlexLayout.Actions.deleteTab(id));
			}
		},
		[model],
	);

	useEffect(() => {
		syncTemporaryTab(
			ADD_NODE_TAB_ID,
			"Add node",
			"add-node",
			isAddNodeOpen,
		);
	}, [isAddNodeOpen, syncTemporaryTab]);

	useEffect(() => {
		syncTemporaryTab(
			TEMPLATE_TAB_ID,
			"Templates",
			"templates",
			isTemplateOpen,
		);
	}, [isTemplateOpen, syncTemporaryTab]);

	const handleModelChange = useCallback(
		(current: FlexLayout.Model, action: FlexLayout.Action) => {
			if (action.type === FlexLayout.Actions.DELETE_TAB) {
				if (action.data.node === ADD_NODE_TAB_ID) onAddNodeTabClose?.();
				if (action.data.node === TEMPLATE_TAB_ID)
					onTemplateTabClose?.();
				return;
			}
			if (
				action.type !== FlexLayout.Actions.SELECT_TAB ||
				!onActiveTabChange
			)
				return;
			const selectedTabId = current
				.getActiveTabset()
				?.getSelectedNode()
				?.getId();
			const selectedTab = selectedTabId
				? tabIdToSideTab[selectedTabId]
				: undefined;
			if (selectedTab) onActiveTabChange(selectedTab);
		},
		[onActiveTabChange, onAddNodeTabClose, onTemplateTabClose],
	);

	const toggleSideDock = useCallback(() => {
		const sideDock = model.getNodeById(SIDE_DOCK_ID);
		const parent = sideDock?.getParent();
		if (!sideDock || !parent) return;

		const nextCollapsed = !collapsedRef.current;
		const nextPosition = getDockPosition(model);
		const children = parent.getChildren();
		const sideDockIndex = children.findIndex(
			(child) => child.getId() === SIDE_DOCK_ID,
		);
		if (sideDockIndex < 0) return;

		const weights = children.map((_child, index) =>
			index === sideDockIndex
				? nextCollapsed
					? 0
					: 24
				: nextCollapsed
					? 100
					: 76,
		);
		model.doAction(
			FlexLayout.Actions.updateNodeAttributes(SIDE_DOCK_ID, {
				minHeight: nextCollapsed ? 0 : 180,
				minWidth: nextCollapsed ? 0 : 240,
			}),
		);
		model.doAction(
			FlexLayout.Actions.adjustWeights(parent.getId(), weights),
		);
		setDockPosition(nextPosition);
		collapsedRef.current = nextCollapsed;
		setCollapsed(nextCollapsed);
	}, [model]);

	useEffect(() => {
		if (!activeTab) return;
		const shouldRestore = focusKey !== null || Boolean(activeTab);
		if (collapsedRef.current && shouldRestore) toggleSideDock();
		model.doAction(FlexLayout.Actions.selectTab(sideTabIds[activeTab]));
	}, [activeTab, focusKey, model, toggleSideDock]);

	const factory = useCallback(
		(node: FlexLayout.TabNode): ReactNode => {
			switch (node.getComponent()) {
				case "add-node":
					return addNode;
				case "canvas":
					return canvas;
				case "history":
					return history;
				case "inspector":
					return inspector;
				case "templates":
					return template;
				case "trace":
					return trace;
				case "validation":
					return validation;
				case "variables":
					return variables;
				default:
					return null;
			}
		},
		[
			addNode,
			canvas,
			history,
			inspector,
			template,
			trace,
			validation,
			variables,
		],
	);

	const onRenderTabSet = useCallback(
		(
			tabSetNode: FlexLayout.TabSetNode | FlexLayout.BorderNode,
			renderValues: {
				leading: ReactNode;
			},
		) => {
			if (tabSetNode.getId() !== CANVAS_TABSET_ID) return;
			const Icon = getToggleIcon(dockPosition, collapsed);
			const action = collapsed ? "Expand" : "Collapse";
			renderValues.leading = (
				<button
					key="toggle-automation-side-dock"
					type="button"
					aria-label={`${action} side panel`}
					title={`${action} side panel`}
					onClick={toggleSideDock}
					className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<Icon className="h-4 w-4" />
				</button>
			);
		},
		[collapsed, dockPosition, toggleSideDock],
	);

	return (
		<div className="flexlayout__theme_smss relative h-full w-full overflow-hidden">
			<FlexLayout.Layout
				model={model}
				factory={factory}
				onModelChange={handleModelChange}
				onRenderTabSet={onRenderTabSet}
			/>
		</div>
	);
}
