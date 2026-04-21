import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	MouseSensor,
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
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Collapsible, CollapsibleContent } from "@semoss/ui/next";
import { BlockSettingsRegistry } from "../blocks-workspace/blocks";

type WidgetItem = {
	widget: string;
	// biome-ignore lint/suspicious/noExplicitAny: block data is untyped
	data: any;
	slots?: {
		[slotName: string]: {
			name: string;
			children?: WidgetItem[];
		};
	};
};

type Props = {
	// biome-ignore lint/suspicious/noExplicitAny: item shape varies
	item: any;
	onJsonUpdate?: (updated: WidgetItem) => void;
};

const SortableLeaf: React.FC<{
	id: string;
	block: WidgetItem;
}> = ({ id, block }) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const WidgetIcon = BlockSettingsRegistry[block?.widget]?.icon;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="my-1 ml-10 flex h-[70px] cursor-grab items-center justify-between gap-2 rounded-lg p-2"
			{...attributes}
			{...listeners}
		>
			<div className="flex items-center gap-2">
				{WidgetIcon && (
					<WidgetIcon className="size-4 text-muted-foreground" />
				)}
				<div className="flex flex-col justify-center">
					<span className="text-sm">{block?.widget}</span>
					<span className="text-muted-foreground text-sm">
						{`${block?.widget}11`}
					</span>
				</div>
			</div>
			<button
				type="button"
				className="flex size-8 items-center justify-center rounded hover:bg-accent"
			>
				<GripVertical className="size-4" />
			</button>
		</div>
	);
};

const RecursiveRenderer: React.FC<{
	block: WidgetItem;
	path: string;
	onUpdate: (updatedBlock: WidgetItem) => void;
	hasParent?: boolean;
}> = ({ block, path, onUpdate, hasParent = false }) => {
	const isParent =
		block?.slots &&
		Object.values(block?.slots).some((slot) => slot.children?.length);

	const [expanded, setExpanded] = useState(false);
	const toggleExpand = () => setExpanded((prev) => !prev);

	const WidgetIcon = BlockSettingsRegistry[block?.widget]?.icon;

	const handleReorder = (
		slotKey: string,
		oldIndex: number,
		newIndex: number,
	) => {
		const updated = { ...block };
		const slot = updated.slots?.[slotKey];
		if (!slot?.children) return;
		slot.children = arrayMove(slot.children, oldIndex, newIndex);
		onUpdate(updated);
	};

	// suppress unused variable warning — handleReorder used by DnD context
	void handleReorder;

	return (
		<div
			className="w-full rounded-lg border border-border"
			style={{ marginLeft: hasParent ? "20px" : 0, marginBottom: "4px" }}
		>
			<div className="flex h-[70px] items-center gap-2 rounded-lg p-2 shadow-none">
				{isParent && (
					<button
						type="button"
						className="flex size-8 items-center justify-center rounded hover:bg-accent"
						onClick={toggleExpand}
					>
						{expanded ? (
							<ChevronDown className="size-4" />
						) : (
							<ChevronRight className="size-4" />
						)}
					</button>
				)}
				<div className="flex items-center gap-2">
					{WidgetIcon && (
						<WidgetIcon className="size-4 text-muted-foreground" />
					)}
					<div className="flex flex-col justify-center">
						<span className="text-sm">{block?.widget}</span>
						<span className="text-muted-foreground text-sm">
							{`${block?.widget}11`}
						</span>
					</div>
				</div>
			</div>

			{isParent && (
				<Collapsible open={expanded}>
					<CollapsibleContent>
						{Object.entries(block?.slots || {}).map(
							([slotKey, slotValue]) => {
								const children = slotValue.children ?? [];
								const ids = children.map(
									(_, i) => `${path}-${slotKey}-${i}`,
								);

								return (
									<SortableContext
										key={slotKey}
										items={ids}
										strategy={verticalListSortingStrategy}
									>
										{children.map((child, index) => {
											const isLeaf =
												!child.slots ||
												!Object.values(
													child.slots,
												).some(
													(s) => s.children?.length,
												);
											const childPath = `${path}-${slotKey}-${index}`;

											return isLeaf ? (
												<SortableLeaf
													key={childPath}
													id={childPath}
													block={child}
												/>
											) : (
												<RecursiveRenderer
													key={childPath}
													block={child}
													path={childPath}
													onUpdate={(
														updatedChild,
													) => {
														const updated = {
															...block,
														};
														// biome-ignore lint/style/noNonNullAssertion: slot exists since we're iterating
														updated.slots![slotKey]
															.children![index] =
															updatedChild;
														onUpdate(updated);
													}}
													hasParent={true}
												/>
											);
										})}
									</SortableContext>
								);
							},
						)}
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
};

export const CommunityLayers: React.FC<Props> = ({ item, onJsonUpdate }) => {
	const [json, setJson] = useState<WidgetItem>(item.json);
	// biome-ignore lint/suspicious/noExplicitAny: item shape varies
	const [localItem, setLocalItem] = useState<any>(item);
	const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

	const handleUpdate = (updatedJson: WidgetItem) => {
		setJson(updatedJson);
		const updatedItem = { ...localItem, json: updatedJson };
		setLocalItem(updatedItem);
		if (onJsonUpdate) onJsonUpdate(updatedItem);
	};

	// suppress unused variable warning
	void json;

	const handleDragEnd = (event: DragEndEvent) => {
		const activeId = String(event.active.id);
		const overId = String(event.over?.id);
		if (!activeId || !overId || activeId === overId) return;

		const pathParts = activeId.split("-");
		const slotKey = pathParts[pathParts.length - 2];
		const fromIndex = Number.parseInt(pathParts[pathParts.length - 1], 10);
		const toIndex = Number.parseInt(overId.split("-").pop() || "0", 10);

		const updated = { ...localItem.json };

		const parentPath = pathParts.slice(0, -2);
		// biome-ignore lint/suspicious/noExplicitAny: recursive traversal of untyped structure
		let parent: any = updated;

		for (const p of parentPath) {
			const slot = Object.values(parent.slots || {}).find(
				// biome-ignore lint/suspicious/noExplicitAny: untyped slot traversal
				(s: any) =>
					Array.isArray(s.children) &&
					s.children.length > Number.parseInt(p, 10),
			) as { children?: WidgetItem[] } | undefined;

			if (!slot || !slot.children) break;

			parent = slot.children[Number.parseInt(p, 10)];
		}

		const slot = parent.slots?.[slotKey];
		if (slot?.children) {
			slot.children = arrayMove(slot.children, fromIndex, toIndex);
			handleUpdate(updated);
		}
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<div>
				<RecursiveRenderer
					block={localItem.json}
					path="root"
					onUpdate={handleUpdate}
					hasParent={false}
				/>
			</div>
		</DndContext>
	);
};
