import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	MouseSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	AlertTriangle,
	Grid3x3,
	GripVertical,
	Pencil,
	Plus,
	Shield,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FlexLayout } from "@semoss/shared";
import {
	Button,
	Card,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { SavedComponent, SavedQuery } from "../../insight.types";

// Types for internal state management
interface Sheet {
	id: string;
	name: string;
	componentIds: string[];
}

interface LayoutState {
	sheets: Sheet[];
	availableComponentIds: string[];
	componentNames: Record<string, string>;
	componentHasPII: Record<string, boolean>;
}

interface LayoutBuilderStepProps {
	savedComponents: SavedComponent[];
	savedQueries: SavedQuery[];
	existingLayout?: FlexLayout.IJsonModel | null;
	onLayoutChange?: (layout: FlexLayout.IJsonModel, isValid: boolean) => void;
}

// Sortable Component Item
// This represents components built by the user that can be dragged into sheets in any order.
// These will be created into flex layouts tabs and host the block component within it.
// It also allows the user to name the component from its default name.
const SortableComponentItem = ({
	componentId,
	componentName,
	onRename,
	showRename = false,
	hasPII = false,
	onPIIChange,
}: {
	componentId: string;
	componentName: string;
	onRename?: (newName: string) => void;
	showRename?: boolean;
	hasPII?: boolean;
	onPIIChange?: (hasPII: boolean) => void;
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(componentName);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: componentId });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const handleSave = () => {
		if (editValue.trim() && onRename) {
			onRename(editValue.trim());
		}
		setIsEditing(false);
	};

	return (
		<div ref={setNodeRef} style={style}>
			<Card
				className={`mb-1 flex flex-row items-center justify-between border border-neutral-300 bg-card p-2 px-4 transition-colors hover:bg-accent ${isDragging ? "opacity-50" : ""}`}
			>
				<div className="flex flex-1 items-center gap-2">
					<div {...attributes} {...listeners} className="cursor-grab">
						<GripVertical className="size-4 text-muted-foreground" />
					</div>
					{isEditing ? (
						<Input
							value={editValue}
							onChange={(
								e: React.ChangeEvent<HTMLInputElement>,
							) => setEditValue(e.target.value)}
							onKeyDown={(
								e: React.KeyboardEvent<HTMLInputElement>,
							) => {
								if (e.key === "Enter") {
									handleSave();
									(e.target as HTMLInputElement).blur();
								} else if (e.key === "Escape") {
									setEditValue(componentName);
									setIsEditing(false);
								}
							}}
							autoFocus
							className="flex-1"
						/>
					) : (
						<span className="flex-1 text-sm">{componentName}</span>
					)}
				</div>
				{showRename && !isEditing && (
					<div className="flex items-center gap-0">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="icon-sm"
									variant="ghost"
									onClick={(
										e: React.MouseEvent<HTMLButtonElement>,
									) => {
										e.stopPropagation();
										onPIIChange?.(!hasPII);
									}}
								>
									<Shield
										className={`size-4 ${hasPII ? "text-destructive" : "text-muted-foreground"}`}
									/>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								Mark as containing PII
							</TooltipContent>
						</Tooltip>
						<Button
							size="icon-sm"
							variant="ghost"
							onClick={() => {
								setEditValue(componentName);
								setIsEditing(true);
							}}
						>
							<Pencil className="size-4" />
						</Button>
					</div>
				)}
			</Card>
		</div>
	);
};

// Sortable Sheet Card
// This reprsents the flexlayout tab sheets that will host the component tabs.
// It can be renamed and sorted as desired.
// We have no limit on how many sheets can be created.
const SortableSheetCard = ({
	sheet,
	components,
	componentNames,
	componentHasPII,
	canDelete,
	onDelete,
	onRenameSheet,
	onRenameComponent,
	onPIIChange,
	isHovered,
}: {
	sheet: Sheet;
	components: SavedComponent[];
	componentNames: Record<string, string>;
	componentHasPII: Record<string, boolean>;
	canDelete: boolean;
	onDelete: () => void;
	onRenameSheet: (newName: string) => void;
	onRenameComponent: (componentId: string, newName: string) => void;
	onPIIChange: (componentId: string, hasPII: boolean) => void;
	isHovered: boolean;
}) => {
	const [isEditingName, setIsEditingName] = useState(false);
	const [editValue, setEditValue] = useState(sheet.name);

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: sheet.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const handleSaveSheetName = () => {
		if (editValue.trim()) {
			onRenameSheet(editValue.trim());
		}
		setIsEditingName(false);
	};

	// Get components for this sheet
	const sheetComponents = components.filter((c) =>
		sheet.componentIds.includes(c.blockId || c.id),
	);

	// Sort components according to the order in sheet.componentIds
	sheetComponents.sort((a, b) => {
		const aId = a.blockId || a.id;
		const bId = b.blockId || b.id;
		const aIndex = sheet.componentIds.indexOf(aId);
		const bIndex = sheet.componentIds.indexOf(bId);
		return aIndex - bIndex;
	});

	return (
		<div ref={setNodeRef} style={style}>
			<Card
				className={`mb-4 border p-4 transition-all ${
					isHovered
						? "border-primary bg-accent"
						: "border-neutral-300 bg-card"
				}`}
			>
				<div className="mb-4 flex items-center gap-2 border-neutral-300 border-b pb-2">
					<div {...attributes} {...listeners} className="cursor-grab">
						<GripVertical className="size-5 text-muted-foreground" />
					</div>
					{isEditingName ? (
						<Input
							value={editValue}
							onChange={(
								e: React.ChangeEvent<HTMLInputElement>,
							) => setEditValue(e.target.value)}
							onKeyDown={(
								e: React.KeyboardEvent<HTMLInputElement>,
							) => {
								if (e.key === "Enter") {
									handleSaveSheetName();
									(e.target as HTMLInputElement).blur();
								} else if (e.key === "Escape") {
									setEditValue(sheet.name);
									setIsEditingName(false);
								}
							}}
							autoFocus
							className="flex-1"
						/>
					) : (
						<h3 className="flex-1 font-semibold text-lg">
							{sheet.name}
						</h3>
					)}
					<Button
						size="icon-sm"
						variant="ghost"
						onClick={() => {
							setEditValue(sheet.name);
							setIsEditingName(true);
						}}
					>
						<Pencil className="size-4" />
					</Button>
					<Button
						size="icon-sm"
						variant="ghost"
						onClick={onDelete}
						disabled={!canDelete}
						className={
							!canDelete
								? ""
								: "text-destructive hover:text-destructive"
						}
					>
						<Trash2 className="size-4" />
					</Button>
				</div>

				<SortableContext
					items={sheet.componentIds}
					strategy={verticalListSortingStrategy}
				>
					{sheetComponents.length > 0 ? (
						sheetComponents.map((component) => {
							const componentId =
								component.blockId || component.id;
							const customName =
								componentNames[componentId] || componentId;
							const hasPII =
								componentHasPII[componentId] || false;
							return (
								<SortableComponentItem
									key={componentId}
									componentId={componentId}
									componentName={customName}
									showRename={true}
									hasPII={hasPII}
									onRename={(newName) =>
										onRenameComponent(componentId, newName)
									}
									onPIIChange={(hasPII) =>
										onPIIChange(componentId, hasPII)
									}
								/>
							);
						})
					) : (
						<div className="min-h-[100px] rounded-lg border-2 border-neutral-300 border-dashed bg-muted p-2 transition-all">
							<p className="text-center text-muted-foreground text-sm">
								Drag components here
							</p>
						</div>
					)}
				</SortableContext>
			</Card>
		</div>
	);
};

export const LayoutBuilderStep = (props: LayoutBuilderStepProps) => {
	const { savedComponents, savedQueries, existingLayout, onLayoutChange } =
		props;

	const [layoutState, setLayoutState] = useState<LayoutState>(() =>
		initializeLayoutState(savedComponents, existingLayout),
	);

	const [activeId, setActiveId] = useState<string | null>(null);
	const [overId, setOverId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(MouseSensor),
		useSensor(TouchSensor),
	);

	// Initialize layout state from existing layout or create default
	function initializeLayoutState(
		components: SavedComponent[],
		existing?: FlexLayout.IJsonModel | null,
	): LayoutState {
		const componentIds = components.map((c) => c.blockId || c.id);

		if (existing) {
			// Parse existing layout to extract sheets and component assignments
			return parseExistingLayout(existing, componentIds);
		}

		// Default: Create one sheet and make all components available
		return {
			sheets: [
				{
					id: "sheet-1",
					name: "Sheet 1",
					componentIds: [],
				},
			],
			availableComponentIds: [...componentIds],
			componentNames: {},
			componentHasPII: {},
		};
	}

	// Parse existing FlexLayout.IJsonModel to extract sheets and components
	function parseExistingLayout(
		layout: FlexLayout.IJsonModel,
		allComponentIds: string[],
	): LayoutState {
		const sheets: Sheet[] = [];
		const assignedComponentIds = new Set<string>();
		const componentNames: Record<string, string> = {};
		const componentHasPII: Record<string, boolean> = {};

		// Find the sheets-tabset in the layout
		const findSheetsTabset = (obj: unknown): unknown => {
			if (!obj || typeof obj !== "object") return null;

			const node = obj as {
				id?: string;
				type?: string;
				children?: unknown[];
				layout?: unknown;
			};

			if (node.id === "sheets-tabset" && node.type === "tabset") {
				return node;
			}

			if (node.children && Array.isArray(node.children)) {
				for (const child of node.children) {
					const found = findSheetsTabset(child);
					if (found) return found;
				}
			}

			if (node.layout) {
				return findSheetsTabset(node.layout);
			}

			return null;
		};

		const sheetsTabset = findSheetsTabset(layout) as {
			children?: Array<{
				id?: string;
				name?: string;
				type?: string;
				component?: string;
				config?: {
					componentTabs?: Array<{ id?: string; name?: string }>;
				};
			}>;
		} | null;

		if (sheetsTabset?.children) {
			for (const sheetTab of sheetsTabset.children) {
				if (
					sheetTab.type === "tab" &&
					sheetTab.component === "sheet-container"
				) {
					const sheetId = sheetTab.id || `sheet-${sheets.length + 1}`;
					const sheetName =
						sheetTab.name || `Sheet ${sheets.length + 1}`;
					const componentTabs = sheetTab.config?.componentTabs || [];

					const componentIds: string[] = [];

					for (const compTab of componentTabs) {
						if (compTab.id) {
							componentIds.push(compTab.id);
							assignedComponentIds.add(compTab.id);
							if (compTab.name) {
								componentNames[compTab.id] = compTab.name;
							}
							// Extract PII flag from config if available
							const tabConfig = compTab as {
								config?: { hasPII?: boolean };
							};
							if (tabConfig.config?.hasPII) {
								componentHasPII[compTab.id] = true;
							}
						}
					}

					sheets.push({
						id: sheetId,
						name: sheetName,
						componentIds,
					});
				}
			}
		}

		// Components not assigned to any sheet go to available
		const availableComponentIds = allComponentIds.filter(
			(id) => !assignedComponentIds.has(id),
		);

		// If no sheets were found, create default
		if (sheets.length === 0) {
			sheets.push({
				id: "sheet-1",
				name: "Sheet 1",
				componentIds: [...allComponentIds],
			});
			return {
				sheets,
				availableComponentIds: [],
				componentNames,
				componentHasPII,
			};
		}

		return {
			sheets,
			availableComponentIds,
			componentNames,
			componentHasPII,
		};
	}

	// Memoize the built layout config to avoid expensive recalculations
	const layoutConfig = useMemo<FlexLayout.IJsonModel>(() => {
		const componentMap = new Map(
			savedComponents.map((c) => [c.blockId || c.id, c]),
		);

		const sheetTabs: FlexLayout.IJsonTabNode[] = layoutState.sheets.map(
			(sheet) => {
				const componentTabs: FlexLayout.IJsonTabNode[] = [];

				for (const componentId of sheet.componentIds) {
					const component = componentMap.get(componentId);
					if (!component) continue;

					// HTML and filter blocks don't have queries
					const needsQuery =
						component.componentType !== "html-block" &&
						component.componentType !==
							"visualization-filter-block";

					const query = savedQueries.find(
						(q) => q.id === component.queryId,
					);

					// Skip only query-dependent components without a query
					if (needsQuery && !query) continue;

					const customName =
						layoutState.componentNames[componentId] ||
						(query
							? `${query.frameVariableName}-${component.id}`
							: componentId);

					componentTabs.push({
						type: "tab",
						id: componentId,
						name: customName,
						component: "insight-component",
						enableClose: false,
						enableRename: true,
						config: {
							blockId: component.blockId,
							componentId: component.id,
							queryId: component.queryId,
							frameVariableName: query?.frameVariableName || "",
							hasPII:
								layoutState.componentHasPII[componentId] ||
								false,
						},
					});
				}

				return {
					type: "tab",
					id: sheet.id,
					name: sheet.name,
					component: "sheet-container",
					enableClose: false,
					enableRename: true,
					enableDrag: false,
					config: {
						sheetId: sheet.id,
						sheetName: sheet.name,
						componentTabs: componentTabs,
						innerLayout: null,
					},
				};
			},
		);

		return {
			global: {
				tabEnableClose: false,
				tabEnableRename: true,
				tabSetEnableTabStrip: true,
				tabSetEnableMaximize: false,
				tabSetEnableDrop: true,
				tabSetEnableDrag: false,
				tabSetEnableDivide: false,
			},
			borders: [],
			layout: {
				type: "row",
				weight: 100,
				children: [
					{
						type: "tabset",
						id: "sheets-tabset",
						weight: 100,
						selected: 0,
						enableTabStrip: true,
						enableDrag: false,
						enableDrop: false,
						tabLocation: "bottom",
						children: sheetTabs,
					},
				],
			},
		};
	}, [layoutState, savedComponents, savedQueries]);

	// Memoize validity check to avoid recalculating on unrelated state changes
	const isLayoutValid = useMemo(
		() => layoutState.availableComponentIds.length === 0,
		[layoutState.availableComponentIds.length],
	);

	// Notify parent component of layout changes
	useEffect(() => {
		onLayoutChange?.(layoutConfig, isLayoutValid);
	}, [layoutConfig, isLayoutValid, onLayoutChange]);

	// Add new sheet
	const handleAddSheet = () => {
		const newSheetId = `sheet-${layoutState.sheets.length + 1}`;
		const newSheet: Sheet = {
			id: newSheetId,
			name: `Sheet ${layoutState.sheets.length + 1}`,
			componentIds: [],
		};

		setLayoutState((prev) => ({
			...prev,
			sheets: [...prev.sheets, newSheet],
		}));
	};

	// Delete sheet
	const handleDeleteSheet = (sheetId: string) => {
		setLayoutState((prev) => {
			const sheetToDelete = prev.sheets.find((s) => s.id === sheetId);
			if (!sheetToDelete) return prev;

			// Move components from deleted sheet to available
			const updatedAvailable = [
				...prev.availableComponentIds,
				...sheetToDelete.componentIds,
			];

			return {
				...prev,
				sheets: prev.sheets.filter((s) => s.id !== sheetId),
				availableComponentIds: updatedAvailable,
			};
		});
	};

	// Rename sheet
	const handleRenameSheet = (sheetId: string, newName: string) => {
		setLayoutState((prev) => ({
			...prev,
			sheets: prev.sheets.map((s) =>
				s.id === sheetId ? { ...s, name: newName } : s,
			),
		}));
	};

	// Rename component (globally, not per-sheet)
	const handleRenameComponent = (componentId: string, newName: string) => {
		setLayoutState((prev) => ({
			...prev,
			componentNames: {
				...prev.componentNames,
				[componentId]: newName,
			},
		}));
	};

	// Handle PII flag change
	const handlePIIChange = (componentId: string, hasPII: boolean) => {
		setLayoutState((prev) => ({
			...prev,
			componentHasPII: {
				...prev.componentHasPII,
				[componentId]: hasPII,
			},
		}));
	};

	// Handle drag start
	const handleDragStart = (event: DragEndEvent) => {
		setActiveId(event.active.id as string);
	};

	// Handle drag over (for previewing drop zones)
	const handleDragOver = (event: DragOverEvent) => {
		setOverId(event.over?.id as string | null);
	};

	// Handle drag end
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);
		setOverId(null);

		if (!over) return;

		const activeId = active.id as string;
		const overId = over.id as string;

		// Check if dragging a sheet (for reordering sheets)
		const isActiveSheet = layoutState.sheets.some((s) => s.id === activeId);
		const isOverSheet = layoutState.sheets.some((s) => s.id === overId);

		if (isActiveSheet && isOverSheet) {
			// Reorder sheets
			setLayoutState((prev) => {
				const oldIndex = prev.sheets.findIndex(
					(s) => s.id === activeId,
				);
				const newIndex = prev.sheets.findIndex((s) => s.id === overId);
				return {
					...prev,
					sheets: arrayMove(prev.sheets, oldIndex, newIndex),
				};
			});
			return;
		}

		// Check if dragging a component
		const activeComponent = savedComponents.find(
			(c) => (c.blockId || c.id) === activeId,
		);
		if (!activeComponent) return;

		// Find which sheet (if any) the component is currently in
		const sourceSheet = layoutState.sheets.find((s) =>
			s.componentIds.includes(activeId),
		);
		const sourceSheetId = sourceSheet?.id;

		// Check if dropping on a component within a sheet (for reordering)
		const targetSheet = layoutState.sheets.find((s) =>
			s.componentIds.includes(overId),
		);

		// Reordering within the same sheet
		if (targetSheet && sourceSheet && targetSheet.id === sourceSheet.id) {
			setLayoutState((prev) => ({
				...prev,
				sheets: prev.sheets.map((s) =>
					s.id === targetSheet.id
						? {
								...s,
								componentIds: arrayMove(
									s.componentIds,
									s.componentIds.indexOf(activeId),
									s.componentIds.indexOf(overId),
								),
							}
						: s,
				),
			}));
			return;
		}

		// Determine target: either a sheet ID or "available"
		const targetSheetId = layoutState.sheets.find(
			(s) => s.id === overId,
		)?.id;
		const targetIsAvailable = overId === "available-components";

		// Moving between sheets or to/from available
		if (targetSheetId && targetSheetId !== sourceSheetId) {
			// Move component to a different sheet
			setLayoutState((prev) => {
				const updatedSheets = prev.sheets.map((s) => {
					if (s.id === sourceSheetId) {
						// Remove from source sheet
						return {
							...s,
							componentIds: s.componentIds.filter(
								(id) => id !== activeId,
							),
						};
					}
					if (s.id === targetSheetId) {
						// Add to target sheet
						return {
							...s,
							componentIds: [...s.componentIds, activeId],
						};
					}
					return s;
				});

				let updatedAvailable = prev.availableComponentIds;
				if (
					sourceSheetId === undefined &&
					prev.availableComponentIds.includes(activeId)
				) {
					// Remove from available
					updatedAvailable = updatedAvailable.filter(
						(id) => id !== activeId,
					);
				}

				return {
					sheets: updatedSheets,
					availableComponentIds: updatedAvailable,
					componentNames: prev.componentNames,
					componentHasPII: prev.componentHasPII,
				};
			});
		} else if (targetIsAvailable) {
			// Move component to available
			setLayoutState((prev) => ({
				sheets: prev.sheets.map((s) =>
					s.id === sourceSheetId
						? {
								...s,
								componentIds: s.componentIds.filter(
									(id) => id !== activeId,
								),
							}
						: s,
				),
				availableComponentIds: prev.availableComponentIds.includes(
					activeId,
				)
					? prev.availableComponentIds
					: [...prev.availableComponentIds, activeId],
				componentNames: prev.componentNames,
				componentHasPII: prev.componentHasPII,
			}));
		}
	};

	// Get available components (not assigned to any sheet)
	const availableComponents = savedComponents.filter((c) =>
		layoutState.availableComponentIds.includes(c.blockId || c.id),
	);

	// Get active component for drag overlay
	const activeComponent = activeId
		? savedComponents.find((c) => (c.blockId || c.id) === activeId)
		: null;

	const canDeleteSheet = layoutState.sheets.length > 1;

	return (
		<Card className="flex h-full flex-col overflow-auto p-6 shadow-md">
			<div className="mb-4 flex items-center gap-2">
				<h2 className="font-bold text-2xl">Layout Builder</h2>
				<Grid3x3 className="size-6" />
			</div>
			<p className="mb-6 text-muted-foreground text-sm">
				Organize your {savedComponents.length} component
				{savedComponents.length !== 1 ? "s" : ""} across sheets. Drag
				components between sheets to customize your layout.
			</p>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
			>
				{/* Available Components Section */}
				{layoutState.availableComponentIds.length > 0 && (
					<div className="mb-6">
						<div className="mb-2 flex items-center gap-2">
							<AlertTriangle className="size-4 text-amber-500" />
							<h3 className="font-medium text-amber-600 text-base">
								Available Components (
								{availableComponents.length})
							</h3>
						</div>
						<p className="mb-2 block text-muted-foreground text-xs">
							These components are not assigned to any sheet. Drag
							them to a sheet below.
						</p>
						<Card className="min-h-[120px] border-2 border-neutral-300 border-dashed bg-neutral-50 p-4 dark:bg-neutral-950">
							<SortableContext
								items={layoutState.availableComponentIds}
								strategy={verticalListSortingStrategy}
							>
								{availableComponents.map((component) => {
									const componentId =
										component.blockId || component.id;
									const query = savedQueries.find(
										(q) => q.id === component.queryId,
									);
									const displayName = query
										? `${query.frameVariableName}-${component.id}`
										: component.id;

									return (
										<SortableComponentItem
											key={componentId}
											componentId={componentId}
											componentName={displayName}
											showRename={false}
										/>
									);
								})}
							</SortableContext>
						</Card>
					</div>
				)}

				{/* Sheets Section */}
				<div className="mb-6">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="font-medium text-base">
							Sheets ({layoutState.sheets.length})
						</h3>
						<Button
							variant="outline"
							size="sm"
							onClick={handleAddSheet}
						>
							<Plus className="mr-2 size-4" />
							Add Sheet
						</Button>
					</div>
					<div className="max-h-[50vh] overflow-y-auto overflow-x-hidden pr-1 [&::-webkit-scrollbar-thumb:hover]:bg-neutral-500 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-neutral-400 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-track]:bg-neutral-200 [&::-webkit-scrollbar]:w-2">
						<SortableContext
							items={layoutState.sheets.map((s) => s.id)}
							strategy={verticalListSortingStrategy}
						>
							{layoutState.sheets.map((sheet) => (
								<SortableSheetCard
									key={sheet.id}
									sheet={sheet}
									components={savedComponents}
									componentNames={layoutState.componentNames}
									componentHasPII={
										layoutState.componentHasPII
									}
									canDelete={canDeleteSheet}
									isHovered={overId === sheet.id}
									onDelete={() => handleDeleteSheet(sheet.id)}
									onRenameSheet={(newName) =>
										handleRenameSheet(sheet.id, newName)
									}
									onRenameComponent={(componentId, newName) =>
										handleRenameComponent(
											componentId,
											newName,
										)
									}
									onPIIChange={handlePIIChange}
								/>
							))}
						</SortableContext>
					</div>
				</div>

				{/* Drag Overlay */}
				<DragOverlay>
					{activeId && activeComponent ? (
						<Card className="flex cursor-grabbing items-center justify-between border border-neutral-300 bg-card p-2 px-4 shadow-lg">
							<div className="flex items-center gap-2">
								<GripVertical className="size-4 text-muted-foreground" />
							</div>
						</Card>
					) : null}
				</DragOverlay>
			</DndContext>
		</Card>
	);
};
