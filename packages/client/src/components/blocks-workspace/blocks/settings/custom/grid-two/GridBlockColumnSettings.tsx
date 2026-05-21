import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RefreshCw } from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	type GridBlockColumn,
	type GridBlockDef,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../../../settings/BaseSettingSection";
import { GridBlockColumnSettingsItem } from "./GridBlockColumnSettingsItem";

interface GridBlockColumnSettingsProps {
	/** Id of the block */
	id: string;
}

export const GridBlockColumnSettings = observer(
	({ id }: GridBlockColumnSettingsProps) => {
		const { data, setData } = useBlockSettings<GridBlockDef>(id);
		// get all of the frames
		const getFrames = useBlocksPixel<string[]>("GetFrames();", {
			data: [],
		});

		// get headers associated with the selected frames
		const frameHeaders = useFrameHeaders(data.frame.name);

		console.log(getFrames, "getFrames", frameHeaders, "frameHeaders");
		/**
		 * Sync the columns with the frame headers
		 */
		const syncFrameHeaders = () => {
			try {
				// get the columns by selector
				const columnMap: Record<string, GridBlockColumn> =
					data.columns.reduce<Record<string, GridBlockColumn>>(
						(acc, val) => {
							acc[val.name] = val;

							return acc;
						},
						{},
					);

				// get the frameHeaders as columns
				const columns: GridBlockColumn[] = frameHeaders.data.list.map(
					(h: { alias: string; header: string }) => {
						return {
							name: h.alias,
							width: undefined,
							// add the previous if it exists
							...JSON.parse(
								JSON.stringify(columnMap[h.alias] || {}),
							),
							selector: h.header,
						};
					},
				);

				// update the data
				setData("columns", columns);

				console.log(columns, "columns");

				toast.success("Successfully synchronized headers");
			} catch (e) {
				toast.error((e as Error).message);
			}
		};

		/**
		 * Reorder columns
		 * @param startDragIndex
		 * @param stopDragIndex
		 */
		const handleDragEnd = ({ active, over }: DragEndEvent) => {
			if (!active || !over) {
				console.error("Invalid item!");
				return;
			}

			// If the active item is over a different item, swap them
			if (over && active.id !== over.id) {
				const oldIndex = Number(
					columns.findIndex(
						(column) => column.selector === active.id,
					),
				);
				const newIndex = Number(
					columns.findIndex((column) => column.selector === over.id),
				);
				// get the columns
				const gridColumns = [...data.columns];

				// remove it
				const [removed] = gridColumns.splice(oldIndex, 1);

				// add it at the new location
				gridColumns.splice(newIndex, 0, removed);

				// update the data
				setData("columns", gridColumns);
			}
		};

		// options for the select
		const options = getFrames.status === "SUCCESS" ? getFrames.data : [];

		// columns to render
		const columns = data.columns || [];

		return (
			<>
				<BaseSettingSection label="Frame">
					<Select
						disabled={getFrames.status !== "SUCCESS"}
						value={data.frame.name}
						onValueChange={(value) => {
							// update the frame
							setData("frame.name", value);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select frame" />
						</SelectTrigger>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => syncFrameHeaders()}
					>
						<RefreshCw className="size-4" />
					</Button>
				</BaseSettingSection>
				<div className="flex w-full flex-col overflow-hidden">
					<DndContext
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
						modifiers={[restrictToParentElement]}
					>
						<SortableContext
							items={columns?.map((item) => item.selector)}
							strategy={verticalListSortingStrategy}
						>
							<div className="flex w-full flex-col">
								{columns.map((c, cIdx) => {
									return (
										<SortableItems
											key={c.selector}
											id={c.selector}
										>
											<GridBlockColumnSettingsItem
												id={id}
												// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
												key={cIdx}
												column={c}
												index={cIdx}
											/>
										</SortableItems>
									);
								})}
							</div>
						</SortableContext>
					</DndContext>
				</div>
			</>
		);
	},
);

const SortableItems = ({
	id,
	children,
}: {
	id: string;
	children: React.ReactNode;
}) => {
	// Use the sortable context
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id });

	// Apply styles to the list items based on their state
	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		cursor: "grab",
	};

	return (
		<div
			key={`action-${id}`}
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			style={style}
		>
			{children}
		</div>
	);
};
