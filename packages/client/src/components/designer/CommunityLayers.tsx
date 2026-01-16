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
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type React from "react";
import { useState } from "react";
import {
	Box,
	Collapse,
	IconButton,
	Paper,
	styled,
	Typography,
} from "@semoss/ui";
import { BlockSettingsRegistry } from "../blocks-workspace/blocks";

type WidgetItem = {
	widget: string;
	data: any;
	slots?: {
		[slotName: string]: {
			name: string;
			children?: WidgetItem[];
		};
	};
};

type Props = {
	item: any;
	onJsonUpdate?: (updated: WidgetItem) => void; // optional callback for parent
};
const StyledLabelTitle = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 8,
	padding: 8,
	margin: "4px 0",
	marginLeft: 40,
	cursor: "grab",
	borderRadius: 8,
	height: "70px",
}));

const StyledContent = styled(Box)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: "8px",
}));

const StyledChildContent = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: "7px",
	my: 0.5,
	height: "70px",
	boxShadow: "none",
	padding: theme.spacing(1),
}));

const StyledBox = styled(Box)(({ theme }) => ({
	border: "1px solid #e0e0e0",
	borderRadius: "8px",
	mb: 1,
	width: "100%",
}));
// === DRAGGABLE SORTABLE BLOCK (for leaf nodes only) ===
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
		<StyledLabelTitle
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
		>
			<StyledContent>
				{WidgetIcon && (
					<WidgetIcon
						fontSize="small"
						sx={{ color: "text.secondary" }}
					/>
				)}
				<StyledChildContent>
					<Typography
						variant="body1"
						fontWeight={400}
						sx={{ fontSize: "14px" }}
					>
						{block?.widget}
					</Typography>
					<Typography
						variant="body1"
						fontWeight={400}
						sx={{ fontSize: "14px" }}
						color="text.secondary"
					>
						{block?.widget + "11"}
					</Typography>
				</StyledChildContent>
			</StyledContent>
			<IconButton size="small">
				<DragIndicatorIcon />
			</IconButton>
		</StyledLabelTitle>
	);
};

// === RECURSIVE RENDERING ===
const RecursiveRenderer: React.FC<{
	block: WidgetItem;
	path: string;
	onUpdate: (updatedBlock: WidgetItem) => void;
	hasParent?: boolean;
}> = ({ block, path, onUpdate, hasParent = false }) => {
	const isParent =
		block?.slots &&
		Object.values(block?.slots).some((slot) => slot.children?.length);

	const [expanded, setExpanded] = useState(false); // collapsed by default
	const toggleExpand = () => setExpanded((prev) => !prev);

	const WidgetIcon = BlockSettingsRegistry[block?.widget]?.icon;

	// handle reorder inside each slot
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

	return (
		<StyledBox sx={{ ml: hasParent ? 5 : 0 }}>
			<StyledPaper elevation={1}>
				{isParent && (
					<IconButton size="small" onClick={toggleExpand}>
						{expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
					</IconButton>
				)}
				<StyledContent>
					{WidgetIcon && (
						<WidgetIcon
							fontSize="small"
							sx={{ color: "text.secondary" }}
						/>
					)}
					<StyledChildContent>
						<Typography
							variant="body1"
							fontWeight={400}
							sx={{ fontSize: "14px" }}
						>
							{block?.widget}
						</Typography>
						<Typography
							variant="body1"
							fontWeight={400}
							sx={{ fontSize: "14px" }}
							color="text.secondary"
						>
							{block?.widget + "11"}
						</Typography>
					</StyledChildContent>
				</StyledContent>
			</StyledPaper>

			{isParent && (
				<Collapse in={expanded}>
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
											!Object.values(child.slots).some(
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
												onUpdate={(updatedChild) => {
													const updated = {
														...block,
													};
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
				</Collapse>
			)}
		</StyledBox>
	);
};

// === ROOT COMPONENT ===
export const CommunityLayers: React.FC<Props> = ({ item, onJsonUpdate }) => {
	const [json, setJson] = useState<WidgetItem>(item.json);
	const [localItem, setLocalItem] = useState<any>(item);
	const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

	const handleUpdate = (updatedJson: WidgetItem) => {
		setJson(updatedJson);
		const updatedItem = { ...localItem, json: updatedJson };
		setLocalItem(updatedItem);
		if (onJsonUpdate) onJsonUpdate(updatedItem);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const activeId = String(event.active.id);
		const overId = String(event.over?.id);
		if (!activeId || !overId || activeId === overId) return;

		const pathParts = activeId.split("-");
		const slotKey = pathParts[pathParts.length - 2];
		const fromIndex = parseInt(pathParts[pathParts.length - 1]);
		const toIndex = parseInt(overId.split("-").pop() || "0");

		const updated = { ...localItem.json };

		const parentPath = pathParts.slice(0, -2);
		let parent: any = updated;

		for (const p of parentPath) {
			const slot = Object.values(parent.slots || {}).find(
				(s: any) =>
					Array.isArray(s.children) &&
					s.children.length > parseInt(p),
			) as { children?: WidgetItem[] } | undefined;

			if (!slot || !slot.children) break;

			parent = slot.children[parseInt(p)];
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
			<Box>
				<RecursiveRenderer
					block={json}
					path="root"
					onUpdate={handleUpdate}
					hasParent={false}
				/>
			</Box>
		</DndContext>
	);
};
