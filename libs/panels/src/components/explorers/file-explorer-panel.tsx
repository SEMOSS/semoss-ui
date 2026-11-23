import { FolderTreeIcon, HammerIcon, PencilIcon } from "lucide-react";
import {
	type DragEvent,
	Fragment,
	type ReactNode,
	useCallback,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import {
	type FileExplorerApi,
	type FileExplorerItemActions,
	type FileItem,
	getFileExplorerAdapter,
	resolveScopedFilePath,
	scopeFileExplorerAdapter,
} from "@semoss/shared";
import { cn, toast } from "@semoss/ui/next";
import type {
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import {
	useWorkbench,
	useWorkbenchPanel,
	WorkbenchPanelError,
	WorkbenchPanelLoading,
} from "@semoss/workbench";
import { FILE_PANEL_TYPES, MCP } from "../../constants/file-panel.constants";
import { useFileExplorerHost } from "../../contexts/file-explorer-host.context";
import { useFileSources } from "../../contexts/file-sources.context";
import { useAccess } from "../../hooks/use-access";
import { useDockFileExplorer } from "../../hooks/use-dock-file-explorer";
import {
	type FileExplorerSectionsLayout,
	useFileExplorerSections,
} from "../../hooks/use-file-explorer-sections";
import {
	type FilePanelMode,
	getFilePanelResource,
	sameFileMode,
} from "../../types/file-panel.types";
import { FileExplorerPane } from "./file-explorer-pane";
import { FileExplorerSectionHeading } from "./file-explorer-section-heading";
import { FileExplorerSectionResizer } from "./file-explorer-section-resizer";
import { FileMountSection } from "./file-mount-section";

export interface FileExplorerParams {
	mode: FilePanelMode;
	initialPath?: string;
	/**
	 * A folder to keep the explorer to, such as `/public`: it becomes the
	 * explorer's `/`, and nothing above it can be browsed, searched, or written
	 * to. `initialPath` is then a path inside it.
	 */
	rootPath?: string;
	/** How the user ordered and sized the panel's sections. */
	sections?: FileExplorerSectionsLayout;
}

/** The section key of the panel's own tree. */
const PRIMARY_SECTION = "primary";

/** What a section heading's drag carries: the section's key. */
const SECTION_DRAG_DATA_TYPE = "application/x-semoss-file-explorer-section";

/** Where a dragged section heading would land. */
interface SectionDropTarget {
	key: string;
	side: "before" | "after";
}

/** One top-level section of the panel, as it renders. */
interface PanelSection {
	key: string;
	label: string;
	isExpanded: boolean;
	/** Whether it takes a share of the height, rather than its headings' alone. */
	isFilling: boolean;
	actions?: ReactNode;
	contentClassName: string;
	content: ReactNode;
}

const FileExplorerPanel = ({ id }: WorkbenchPanelProps) => {
	const { config, setConfig } = useWorkbenchPanel<FileExplorerParams>(id);
	const { t } = useTranslation("common");

	const insight = useInsight();
	const host = useFileExplorerHost();
	const resource = getFilePanelResource(config.mode);
	const access = useAccess(resource?.type ?? "INSIGHT", resource?.id ?? "");
	const readOnly = access.status !== "ready" || access.readOnly;
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const mode = config.mode;
	const rootPath = config.rootPath;
	const sources = useFileSources();
	const primaryContentId = useId();
	// sections are open until the user closes them; not kept in the layout
	const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const sectionElements = useRef(new Map<string, HTMLDivElement>());
	const [draggingSection, setDraggingSection] = useState<string | null>(null);
	const [sectionDropTarget, setSectionDropTarget] =
		useState<SectionDropTarget | null>(null);
	const toggleSection = useCallback((key: string) => {
		setCollapsed((previous) => {
			const next = new Set(previous);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	}, []);

	// Kept to a folder, the explorer's paths are relative to it. Open panels,
	// events and drags all speak paths in the source, so every path that
	// leaves the explorer goes through `toSourcePath` first.
	const adapter = useMemo(
		() =>
			rootPath
				? scopeFileExplorerAdapter(
						getFileExplorerAdapter(mode),
						rootPath,
					)
				: undefined,
		[mode, rootPath],
	);
	const toSourcePath = useCallback(
		(path: string): string =>
			rootPath ? resolveScopedFilePath(rootPath, path) : path,
		[rootPath],
	);

	const explorer = useDockFileExplorer({
		mode,
		adapter,
		readOnly,
		onRefresh: host?.onRefresh,
		initialPath: config.initialPath,
		toSourcePath,
	});

	const itemActions = useCallback(
		(item: FileItem): FileExplorerItemActions => {
			// the row as it is in the source, which the toolbox paths and a
			// host's own entries go by
			const source = rootPath
				? { ...item, path: toSourcePath(item.path) }
				: item;
			const isDirectory = source.type === "directory";
			const actions: FileExplorerItemActions["actions"] = [];
			// toolboxes belong to a project or engine, never to an insight
			const mcpMode =
				mode.type === "APP" || mode.type === "ENGINE" ? mode : null;

			if (
				mcpMode &&
				!isDirectory &&
				!readOnly &&
				MCP.DRIVER_PATHS.some((path) => source.path === path)
			) {
				actions.push({
					name: "Create",
					icon: <HammerIcon />,
					tooltip: "Create Toolbox",
					action: async () => {
						try {
							const [reactorScope, resourceId] =
								mcpMode.type === "APP"
									? ["project", mcpMode.app]
									: ["engine", mcpMode.engine];
							await insight.actions.run(
								`MakePythonMCP(${reactorScope}=[${JSON.stringify(resourceId)}]);`,
							);
							explorer.commands.refresh();
						} catch (error) {
							toast.error(`Error: ${error}`);
						}

						layoutActions.selectPanel(
							FILE_PANEL_TYPES.FILE_MCP_EDITOR,
							{
								mode: mcpMode,
								name: "py_mcp.json",
								path: "/mcp/py_mcp.json",
							},
							{ name: "Toolbox Editor - py_mcp.json" },
						);
					},
				});
			}

			if (
				mcpMode &&
				!isDirectory &&
				!readOnly &&
				MCP.JSON_PATHS.some((path) => source.path.startsWith(path))
			) {
				actions.push({
					name: "Edit",
					icon: <PencilIcon />,
					tooltip: "Edit Toolbox",
					action: async (target: FileItem) => {
						layoutActions.selectPanel(
							FILE_PANEL_TYPES.FILE_MCP_EDITOR,
							{
								mode: mcpMode,
								name: target.name,
								path: toSourcePath(target.path),
							},
							{ name: `Toolbox Editor - ${target.name}` },
						);
					},
				});
			}

			return {
				actions,
				secondaryActions: host?.secondaryActions?.(source, mode) ?? [],
			};
		},
		[
			mode,
			explorer.commands,
			insight.actions,
			layoutActions,
			readOnly,
			host,
			rootPath,
			toSourcePath,
		],
	);

	// a group with nothing to show hides, so a host with no mounts and no
	// empty state leaves the panel exactly as it is without one
	const groups =
		sources?.isShownIn(mode) === true
			? sources.groups
					.map((group) => ({
						group: group,
						mounts: sources.mounts.filter(
							(mount) => mount.group === group.id,
						),
					}))
					.filter(
						(entry) =>
							entry.mounts.length > 0 ||
							Boolean(entry.group.emptyState),
					)
			: [];

	const sections = useFileExplorerSections({
		keys: [
			PRIMARY_SECTION,
			...groups.map(({ group }) => `group:${group.id}`),
		],
		layout: config.sections,
		onLayoutChange: (layout) => setConfig({ sections: layout }),
	});

	if (access.status === "loading") {
		return <WorkbenchPanelLoading label="Loading resource access" />;
	}

	if (access.status === "error") {
		return (
			<WorkbenchPanelError
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		);
	}

	const pane = (
		<FileExplorerPane
			id={id}
			explorer={explorer}
			itemActions={itemActions}
		/>
	);

	if (!sources || groups.length === 0) {
		return pane;
	}

	const isPrimaryExpanded = !collapsed.has(PRIMARY_SECTION);
	const panelSections: PanelSection[] = [
		{
			key: PRIMARY_SECTION,
			label: sources.primaryLabel,
			isExpanded: isPrimaryExpanded,
			isFilling: isPrimaryExpanded,
			contentClassName: "min-h-0 flex-1",
			content: pane,
		},
		...groups.map(({ group, mounts }): PanelSection => {
			const key = `group:${group.id}`;
			const isExpanded = !collapsed.has(key);

			return {
				key: key,
				label: group.label,
				isExpanded: isExpanded,
				// a group whose folders are all closed is only its headings
				isFilling:
					isExpanded &&
					mounts.some((mount) => !collapsed.has(`mount:${mount.id}`)),
				actions: group.actions,
				contentClassName: "flex min-h-0 flex-1 flex-col",
				content:
					mounts.length === 0
						? group.emptyState
						: mounts.map((mount) => (
								<FileMountSection
									key={mount.id}
									mount={mount}
									group={group}
									isExpanded={
										!collapsed.has(`mount:${mount.id}`)
									}
									onToggle={() =>
										toggleSection(`mount:${mount.id}`)
									}
								/>
							)),
			};
		}),
	];
	const ordered = sections.order.flatMap(
		(key) => panelSections.find((section) => section.key === key) ?? [],
	);

	/**
	 * Move a section one place, keeping focus on its heading as it goes.
	 *
	 * @param key - The section.
	 * @param offset - -1 for up, 1 for down.
	 */
	const moveSectionBy = (key: string, offset: -1 | 1) => {
		sections.move(key, sections.order.indexOf(key) + offset);
		requestAnimationFrame(() =>
			sectionElements.current
				.get(key)
				?.querySelector<HTMLButtonElement>("[data-section-toggle]")
				?.focus(),
		);
	};

	/**
	 * Where a dragged heading would land over a section: before it in its
	 * upper half, after it in its lower half.
	 *
	 * @param e - The drag over the section.
	 * @param key - The section.
	 * @returns Where it lands, or null for a drag that is not a heading's.
	 */
	const getSectionDropTarget = (
		e: DragEvent<HTMLDivElement>,
		key: string,
	): SectionDropTarget | null => {
		if (
			!draggingSection ||
			draggingSection === key ||
			!e.dataTransfer.types.includes(SECTION_DRAG_DATA_TYPE)
		) {
			return null;
		}

		const rect = e.currentTarget.getBoundingClientRect();
		return {
			key: key,
			side: e.clientY < rect.top + rect.height / 2 ? "before" : "after",
		};
	};

	const endSectionDrag = () => {
		setDraggingSection(null);
		setSectionDropTarget(null);
	};

	/**
	 * A section's height now, for a resize to start from.
	 *
	 * @param key - The section.
	 * @returns Its height in px.
	 */
	const getSectionHeight = (key: string): number =>
		sectionElements.current.get(key)?.getBoundingClientRect().height ?? 0;

	return (
		<div className="flex size-full flex-col overflow-hidden">
			{ordered.map((section, index) => {
				const next = ordered[index + 1];
				const contentId = `${primaryContentId}-${section.key}`;
				const dropSide =
					sectionDropTarget?.key === section.key
						? sectionDropTarget.side
						: null;

				return (
					<Fragment key={section.key}>
						{/* biome-ignore lint/a11y/noStaticElementInteractions: a drop zone for a heading drag; Alt+Up and Alt+Down on the heading move it from the keyboard */}
						<div
							ref={(element) => {
								if (element) {
									sectionElements.current.set(
										section.key,
										element,
									);
								} else {
									sectionElements.current.delete(section.key);
								}
							}}
							data-testid={`fileExplorerPanel-section-${section.key}`}
							className={cn(
								"relative flex min-h-0 flex-col",
								section.isFilling ? "min-h-32" : "shrink-0",
								draggingSection === section.key && "opacity-60",
							)}
							// a section's share of the height is the user's,
							// so it can only be a runtime value
							style={
								section.isFilling
									? {
											flex: `${sections.getSize(section.key)} 1 0px`,
										}
									: undefined
							}
							onDragOver={(e) => {
								const target = getSectionDropTarget(
									e,
									section.key,
								);
								if (!target) {
									return;
								}

								e.preventDefault();
								e.dataTransfer.dropEffect = "move";
								if (
									sectionDropTarget?.key !== target.key ||
									sectionDropTarget.side !== target.side
								) {
									setSectionDropTarget(target);
								}
							}}
							onDragLeave={(e) => {
								if (
									e.relatedTarget instanceof Node &&
									e.currentTarget.contains(e.relatedTarget)
								) {
									return;
								}

								setSectionDropTarget((previous) =>
									previous?.key === section.key
										? null
										: previous,
								);
							}}
							onDrop={(e) => {
								const target = getSectionDropTarget(
									e,
									section.key,
								);
								if (!target || !draggingSection) {
									return;
								}

								e.preventDefault();
								const rest = sections.order.filter(
									(key) => key !== draggingSection,
								);
								sections.move(
									draggingSection,
									rest.indexOf(target.key) +
										(target.side === "after" ? 1 : 0),
								);
								endSectionDrag();
							}}
						>
							{dropSide ? (
								<div
									aria-hidden
									className={cn(
										"pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-primary",
										dropSide === "before"
											? "top-0"
											: "bottom-0",
									)}
								/>
							) : null}
							<FileExplorerSectionHeading
								label={section.label}
								isExpanded={section.isExpanded}
								onToggle={() => toggleSection(section.key)}
								controls={contentId}
								actions={section.actions}
								onDragStart={(e) => {
									// the dock never sees it, and the
									// explorers below leave its type alone
									e.stopPropagation();
									e.dataTransfer.effectAllowed = "move";
									e.dataTransfer.setData(
										SECTION_DRAG_DATA_TYPE,
										section.key,
									);
									setDraggingSection(section.key);
								}}
								onDragEnd={endSectionDrag}
								onMove={(offset) =>
									moveSectionBy(section.key, offset)
								}
							/>
							<div
								id={contentId}
								className={cn(
									section.contentClassName,
									!section.isExpanded && "hidden",
								)}
							>
								{section.content}
							</div>
						</div>
						{section.isFilling && next?.isFilling ? (
							<FileExplorerSectionResizer
								label={t("fileExplorer.resizeSections", {
									above: section.label,
									below: next.label,
								})}
								value={
									(100 * sections.getSize(section.key)) /
									(sections.getSize(section.key) +
										sections.getSize(next.key))
								}
								onResizeStart={() =>
									sections.startResize(
										section.key,
										next.key,
										{
											above: getSectionHeight(
												section.key,
											),
											below: getSectionHeight(next.key),
										},
									)
								}
								onResize={sections.updateResize}
								onResizeEnd={sections.endResize}
							/>
						) : null}
					</Fragment>
				);
			})}
		</div>
	);
};

/** Scope-aware file explorer blueprint shared by all workbenches. */
export const FILE_EXPLORER_PANEL: WorkbenchPanelConfig<
	FileExplorerParams,
	FileExplorerApi
> = {
	name: "Files",
	helpText: "File Explorer",
	icon: ({ className }) => <FolderTreeIcon className={className} />,
	canClose: false,
	canRename: false,
	canSplitTab: true,
	mount: "keepAlive",
	matches: (a, b) =>
		Boolean(a.mode) && Boolean(b.mode) && sameFileMode(a.mode, b.mode),
	content: FileExplorerPanel,
};
