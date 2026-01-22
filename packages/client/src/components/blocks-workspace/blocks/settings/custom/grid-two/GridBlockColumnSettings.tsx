import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Sync } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import {
	type GridBlockColumn,
	type GridBlockDef,
	useBlocks,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import {
	Autocomplete,
	Box,
	IconButton,
	List,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	useNotification,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { BaseSettingSection } from "../../../settings/BaseSettingSection";
import { GridBlockColumnSettingsItem } from "./GridBlockColumnSettingsItem";

interface GridBlockColumnSettingsProps {
	/** Id of the block */
	id: string;
}

export const GridBlockColumnSettings = observer(
	({ id }: GridBlockColumnSettingsProps) => {
		const [frameMode, setFrameMode] = useState<"direct" | "variable">(
			"direct",
		);
		const notification = useNotification();
		const { data, setData } = useBlockSettings<GridBlockDef>(id);
		const { state } = useBlocks();
		// get all of the frames
		const getFrames = useBlocksPixel<string[]>("GetFrames();", {
			data: [],
		});

		// get headers associated with the selected frames
		const frameHeaders = useFrameHeaders(data.frame.name);

		// get variables of type 'cell'
		const queryVariables = useMemo(() => {
			return Object.entries(state.variables)
				.filter(([, variable]) => variable.type === "cell")
				.map(([variableId]) => {
					const parsedValue = state.parseVariable(
						`{{${variableId}}}`,
					) as { name: string; value: string } | null | undefined;
					const value = parsedValue;

					return {
						label: variableId,
						value: value?.name,
					};
				});
		}, [state.variables]);

		/**
		 * Sync the columns with the frame headers
		 */
		const syncFrameHeaders = () => {
			try {
				// get the columns by selector
				const columnMap: Record<string, GridBlockColumn> =
					data.columns.reduce((acc, val) => {
						acc[val.name] = acc;

						return acc;
					}, {});

				// get the frameHeaders as columns
				const columns: GridBlockColumn[] = frameHeaders.data.list.map(
					(h) => {
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

				notification.add({
					color: "success",
					message: "Successfully synchronized headers",
				});
			} catch (e) {
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		};

		/**
		 * Reorder columns
		 * @param startDragIndex
		 * @param stopDragIndex
		 */
		const handleDragEnd = ({ active, over }) => {
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

		// options for the autocomplete based on selected mode
		const frameOptions = useMemo(() => {
			if (frameMode === "direct") {
				return getFrames.status === "SUCCESS"
					? getFrames.data.map((frame) => ({
							label: frame,
							value: frame,
						}))
					: [];
			} else {
				return queryVariables.map((v) => ({
					label: v.label,
					value: v.value,
				}));
			}
		}, [frameMode, getFrames, queryVariables]);

		// columns to render
		const columns = data.columns || [];

		return (
			<>
				<BaseSettingSection label="Frame">
					<Stack direction="column" gap={1} width="100%">
						<ToggleButtonGroup
							value={frameMode}
							exclusive
							size="small"
							fullWidth
						>
							<ToggleButton
								value="direct"
								onClick={() => {
									setFrameMode("direct");
									setData("frame.name", "");
								}}
							>
								Direct
							</ToggleButton>
							<ToggleButton
								value="variable"
								onClick={() => {
									setFrameMode("variable");
									setData("frame.name", "");
								}}
							>
								Variable
							</ToggleButton>
						</ToggleButtonGroup>
						<Stack direction="row" gap={1} width="100%">
							<Autocomplete
								fullWidth
								multiple={false}
								disabled={getFrames.status !== "SUCCESS"}
								value={
									frameOptions.find(
										(opt) => opt.value === data.frame.name,
									) || null
								}
								options={frameOptions}
								getOptionLabel={(option) => {
									const label =
										typeof option === "string"
											? option
											: option.label;
									return label;
								}}
								onChange={(_, selectedOption) => {
									// update the frame
									const value =
										typeof selectedOption === "string"
											? selectedOption
											: selectedOption?.value || "";

									// Check if value is empty/null when using variable mode
									if (
										frameMode === "variable" &&
										selectedOption !== null &&
										(!value || value.trim() === "")
									) {
										notification.add({
											color: "warning",
											message:
												"Warning: No value found for this variable",
										});
									}
									setData("frame.name", value);
								}}
								freeSolo={false}
								renderInput={(params) => (
									<TextField
										{...params}
										placeholder={`Select ${frameMode === "direct" ? "frame" : "variable"}`}
										size="small"
										variant="outlined"
									/>
								)}
							/>

							<IconButton
								size="small"
								onClick={() => syncFrameHeaders()}
							>
								<Sync />
							</IconButton>
						</Stack>
					</Stack>
				</BaseSettingSection>
				<Stack direction={"column"} width={"100%"} overflow={"hidden"}>
					<DndContext
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
						modifiers={[restrictToParentElement]}
					>
						<SortableContext
							items={columns?.map((item) => item.selector)}
							strategy={verticalListSortingStrategy}
						>
							<List
								sx={{
									width: "100%",
								}}
							>
								{columns.map((c, cIdx) => {
									return (
										<SortableItems
											key={c.selector}
											id={c.selector}
										>
											<GridBlockColumnSettingsItem
												id={id}
												column={c}
												index={cIdx}
											/>
										</SortableItems>
									);
								})}
							</List>
						</SortableContext>
					</DndContext>
				</Stack>
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
		<Box
			key={`action-${id}`}
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			sx={style}
		>
			{children}
		</Box>
	);
};
