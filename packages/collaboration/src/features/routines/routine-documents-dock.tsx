import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import { cn } from "@semoss/ui/next";
import {
	createWorkbenchStore,
	Workbench,
	WorkbenchChromeButton,
	type WorkbenchLayout,
	type WorkbenchPanelConfigAny,
	WorkbenchProvider,
} from "@semoss/workbench";

interface RoutineDocumentsDockProps {
	/** The routine's folder in the owner's user assets, with a leading slash. */
	path: string;
	/** Panel blueprints: the shared file panels, or stubs in tests. */
	components: Record<string, WorkbenchPanelConfigAny>;
}

// below this width the dock uses the phone shell, as the room's tool dock does
const COMPACT_BELOW_PX = 768;

/**
 * The same dock as Settings > My Files, rooted at the routine's folder: the
 * user-assets explorer on the left, files opening in the stage beside it.
 */
function createLayout(path: string): WorkbenchLayout {
	// shortcut: the explorer's crumbs can climb above this folder into the rest of the owner's files; clamp navigateTo if that confuses owners
	return {
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [],
			activeId: null,
			enableDeleteWhenEmpty: false,
		},
		panels: {
			[FILE_PANEL_TYPES.FILE_EXPLORER]: {
				id: FILE_PANEL_TYPES.FILE_EXPLORER,
				type: FILE_PANEL_TYPES.FILE_EXPLORER,
				name: "Documents",
				helpText: "Reference documents",
				canClose: false,
				config: { mode: { type: "USER" }, initialPath: path },
			},
		},
		borders: {
			left: {
				panelIds: [FILE_PANEL_TYPES.FILE_EXPLORER],
				activeId: FILE_PANEL_TYPES.FILE_EXPLORER,
				size: 260,
			},
		},
	};
}

/**
 * A file dock over one routine's documents folder: sized to the card, or to
 * the viewport when maximized. The shell fills its nearest positioned
 * ancestor, so the frame around it is always positioned.
 */
export function RoutineDocumentsDock({
	path,
	components,
}: RoutineDocumentsDockProps) {
	// one store per folder; the shell loads the snapshot itself
	const [{ store, snapshot }] = useState(() => ({
		store: createWorkbenchStore({ components }),
		snapshot: createLayout(path),
	}));
	const [isMaximized, setIsMaximized] = useState(false);
	const frame = useRef<HTMLDivElement | null>(null);
	// the dock's own width decides the layout, not the viewport's: a narrow card column gets the phone shell
	const [isCompact, setIsCompact] = useState(false);
	useEffect(() => {
		const element = frame.current;
		if (!element) return;
		const measure = () =>
			setIsCompact(
				element.getBoundingClientRect().width < COMPACT_BELOW_PX,
			);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return (
		<WorkbenchProvider store={store}>
			<div
				aria-hidden="true"
				className={cn(
					"fixed inset-0 z-50 bg-black/50",
					!isMaximized && "hidden",
				)}
			/>
			<div
				ref={frame}
				className={cn(
					"overflow-hidden rounded-lg border bg-secondary-background",
					isMaximized
						? "fixed inset-4 z-50"
						: "relative min-h-128 flex-1",
				)}
			>
				<Workbench
					snapshot={snapshot}
					layoutMode={isCompact ? "compact" : "auto"}
					borderSlots={{
						left: {
							after: (
								<WorkbenchChromeButton
									icon={isMaximized ? Minimize2 : Maximize2}
									label={
										isMaximized ? "Minimize" : "Maximize"
									}
									onClick={() =>
										setIsMaximized((value) => !value)
									}
								/>
							),
						},
					}}
				/>
			</div>
		</WorkbenchProvider>
	);
}
