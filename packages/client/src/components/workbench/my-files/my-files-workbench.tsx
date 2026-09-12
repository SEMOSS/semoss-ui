import { MonitorXIcon, TvMinimalIcon } from "lucide-react";
import { useState } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useCacheState,
} from "@semoss/ui/next";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
	WorkbenchSnapshot,
} from "@semoss/workbench";
import {
	parseWorkbenchSnapshot,
	useWorkbenchCommands,
	WORKBENCH_STYLES,
	Workbench,
	WorkbenchCommandMenuButton,
} from "@semoss/workbench";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";
import {
	createFileCommands,
	createOpenPanelCommand,
	createReconnectCommand,
} from "../workbench.presets";

/** The user's own asset tree. Unlike every other scope, it carries no id. */
const USER_MODE = { type: "USER" } as const;

/**
 * Blueprints, keyed by type. Module-scope so identities never churn.
 *
 * Only the file panels: a user's space has no engine, no project, and so no
 * settings, version control, or assistant room to hang off. The assistant in
 * particular needs a PROJECT or ENGINE id to source its room tools from, and
 * there is no user-scoped equivalent yet.
 */
export const MY_FILES_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	...FILE_PANEL_COMPONENTS,
};

/**
 * The default arrangement: files on the left, an empty stage to open them into.
 *
 * A module-scope constant rather than a factory, because USER mode has nothing
 * to parameterise it with — no id, and no permission to branch on (a user
 * always owns their own space).
 */
const MY_FILES_LAYOUT: WorkbenchLayout = {
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [],
		activeId: null,
	},
	panels: {
		[WORKBENCH_PANEL_RECORDS.FILE_EXPLORER.id]: {
			...WORKBENCH_PANEL_RECORDS.FILE_EXPLORER,
			config: { mode: USER_MODE },
		},
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.FILE_EXPLORER],
			activeId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			size: 300,
		},
	},
};

/**
 * The workbench for a user's own file space, embedded in Settings > My Files.
 *
 * Sized rather than full-bleed: the settings shell puts a breadcrumb, title,
 * and description above it, so the dock gets what is left of the viewport and
 * a maximize toggle to escape it — the same arrangement the admin query
 * workbench uses on the neighbouring settings route.
 */
export const MyFilesWorkbench: React.FC = () => {
	const insight = useInsight();
	const [snapshot, onSnapshotChange] = useCacheState<WorkbenchSnapshot>(
		MY_FILES_LAYOUT,
		"workbench-layout--my-files--1",
		parseWorkbenchSnapshot,
	);
	const [isMaximized, setIsMaximized] = useState(false);

	useWorkbenchCommands([
		createReconnectCommand(insight),
		...createFileCommands({ readOnly: false }),
		createOpenPanelCommand({
			id: "workbench.file-explorer.open",
			label: "Open File Explorer",
			type: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			config: { mode: USER_MODE },
		}),
	]);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div
				className={cn(
					"fixed inset-0 z-50 bg-black/50 transition-opacity duration-200",
					isMaximized
						? "pointer-events-auto opacity-100"
						: "pointer-events-none hidden opacity-0",
				)}
			/>
			<div
				className={cn(
					"overflow-hidden rounded-lg border border-border bg-secondary-background shadow-sm transition-all duration-200 ease-in-out",
					isMaximized ? "fixed inset-4 z-50" : "h-full w-full",
				)}
			>
				<Workbench
					snapshot={snapshot}
					onUnmount={onSnapshotChange}
					borderSlots={{
						left: {
							after: (
								<>
									<WorkbenchCommandMenuButton />
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												aria-label={
													isMaximized
														? "Minimize"
														: "Maximize"
												}
												data-testid="myFilesWorkbench-maximize-toggle"
												onClick={() =>
													setIsMaximized(!isMaximized)
												}
												className={cn(
													WORKBENCH_STYLES.chromeButton,
													isMaximized
														? WORKBENCH_STYLES.chromeButtonActive
														: WORKBENCH_STYLES.chromeButtonInactive,
												)}
											>
												{isMaximized ? (
													<MonitorXIcon
														className={
															WORKBENCH_STYLES.chromeIcon
														}
													/>
												) : (
													<TvMinimalIcon
														className={
															WORKBENCH_STYLES.chromeIcon
														}
													/>
												)}
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{isMaximized
												? "Minimize"
												: "Maximize"}
										</TooltipContent>
									</Tooltip>
								</>
							),
						},
					}}
				/>
			</div>
		</div>
	);
};
