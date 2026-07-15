import { NotebookTabs } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useState } from "react";
import {
	Blocks,
	DefaultBlocks,
	DefaultCells,
	STATE_VERSION,
	StateStore,
} from "@semoss/renderer";
import { InsightProvider, useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";
import { ClosePage } from "@/assets/img/ClosePage";
import {
	NotebookExplorerPanel,
	NotebookViewerPanel,
} from "@/components/blocks-workspace/panels";
import { FlexLayout } from "@/components/flex-layout";
import { LogoutPopover } from "@/components/shared/LogoutPopover";
import { WorkspaceOverlay } from "@/components/workspace/workspace-overlay";
import { WorkspaceContext } from "@/contexts";
import { useRootStore, useWorkspace } from "@/hooks";
import type { WorkspaceOptions } from "@/stores";
import { WorkspaceStore } from "@/stores";

// No FlexLayout borders — explorer is a plain React-controlled sidebar
const NOTEBOOK_SYSTEM_APP_OPTIONS: WorkspaceOptions = {
	version: "",
	layout: {
		global: { tabEnableClose: true, tabEnableRename: false },
		borders: [],
		layout: {
			type: "row",
			weight: 100,
			children: [
				{
					type: "tabset",
					id: "main-tabset",
					weight: 100,
					selected: -1,
					enableMaximize: false,
					children: [],
				},
			],
		},
	},
};

const NOTEBOOK_SYSTEM_APP_METADATA = {
	project_id: "notebook-system-app",
	project_name: "Notebook",
	project_type: "BLOCKS" as const,
	project_cost: "",
	project_global: "",
	project_catalog_name: "",
	project_created_by: "SYSTEM",
	project_created_by_type: "",
	project_date_created: "",
	project_date_last_edited: "",
};

const NotebookWorkspace: React.FC = observer(() => {
	const { workspace } = useWorkspace();
	const insight = useInsight();

	const [layout, setLayout] = useState<FlexLayout.Layout | null>(null);
	const [state, setState] = useState<StateStore | null>(null);
	const [explorerOpen, setExplorerOpen] = useState(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional - run once insight is ready
	useEffect(() => {
		if (!insight.isReady) return;

		const s = new StateStore({
			mode: "interactive",
			insightId: insight.insightId,
			state: {
				version: STATE_VERSION,
				queries: {},
				blocks: {},
				variables: {},
				executionOrder: [],
			},
			// biome-ignore lint/suspicious/noExplicitAny: CellRegistry type variance
			cellRegistry: DefaultCells as any,
		});

		setState(s);
	}, [insight.isReady, insight.insightId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only load
	useEffect(() => {
		const defaultOptions = JSON.parse(
			JSON.stringify(NOTEBOOK_SYSTEM_APP_OPTIONS),
		);
		const isLoaded = workspace.loadFromCache();
		if (!isLoaded) {
			workspace.load(defaultOptions);
		}
	}, []);

	const factory = (node: FlexLayout.TabNode) => {
		const component = node.getComponent();
		const config = node.getConfig() as { id?: string };
		if (component === "notebook-viewer") {
			return <NotebookViewerPanel id={config.id ?? ""} />;
		}
		return null;
	};

	if (!state || !workspace.model) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<Blocks state={state} registry={DefaultBlocks}>
			<div className="relative flex h-full w-full overflow-hidden bg-background text-foreground">
				{/* Single icon strip - widened */}
				<div className="relative z-10 flex h-full w-13 flex-shrink-0 flex-col items-center border-border border-r bg-background">
					<button
						type="button"
						className="mt-3 flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
						onClick={() => setExplorerOpen((o) => !o)}
						title="Toggle Notebooks"
					>
						<NotebookTabs className="size-5" />
					</button>
					<div className="mt-auto py-2 [&>*]:size-8 [&_svg]:size-5">
						<LogoutPopover />
					</div>
				</div>

				{/* Explorer sidebar */}
				{explorerOpen && layout && (
					<div className="relative z-10 flex h-full w-[280px] flex-shrink-0 flex-col overflow-hidden border-border border-r bg-background">
						<NotebookExplorerPanel
							title="Notebooks"
							layout={layout}
						/>
					</div>
				)}

				{/* FlexLayout area - relative wrapper so absolute child positions correctly */}
				<div className="relative h-full flex-1 overflow-hidden bg-background">
					<div className="flexlayout__theme_smss--legacy absolute inset-0 overflow-hidden">
						<FlexLayout.Layout
							ref={(el) => {
								if (el && !layout) setLayout(el);
							}}
							model={workspace.model}
							factory={factory}
							icons={{ close: <ClosePage /> }}
							onRenderTab={(tabNode, renderValues) => {
								if (
									tabNode.getComponent() === "notebook-viewer"
								) {
									renderValues.leading = (
										<NotebookTabs className="size-4" />
									);
								}
								return renderValues;
							}}
							onModelChange={() => workspace.saveToCache()}
						/>
					</div>
				</div>

				<WorkspaceOverlay />
			</div>
		</Blocks>
	);
});

const NotebookAppContent = observer(() => {
	const insight = useInsight();
	const root = useRootStore();
	const [workspace, setWorkspace] = useState<WorkspaceStore | null>(null);

	useEffect(() => {
		if (!insight.isReady) return;

		const ws = new WorkspaceStore(root, {
			appId: "notebook-system-app",
			insightId: insight.insightId,
			type: "BLOCKS",
			role: "OWNER",
			metadata: NOTEBOOK_SYSTEM_APP_METADATA,
		});
		localStorage.removeItem(ws.cacheKey);

		setWorkspace(ws);
	}, [insight.isReady, insight.insightId, root]);

	if (!insight.isReady || !workspace) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	return (
		<WorkspaceContext.Provider value={{ workspace }}>
			<NotebookWorkspace />
		</WorkspaceContext.Provider>
	);
});

export const NotebookAppPage = () => (
	<div className="fixed inset-0 bg-background text-foreground">
		<InsightProvider>
			<NotebookAppContent />
		</InsightProvider>
	</div>
);
