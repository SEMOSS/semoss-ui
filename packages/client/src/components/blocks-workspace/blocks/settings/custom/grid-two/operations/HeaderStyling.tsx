import { Check, ChevronsUpDown } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type {
	Block,
	BlockDef,
	GridBlockColumn,
	GridBlockDef,
	HeaderBackgroundSettings,
	Paths,
	PathValue,
} from "@semoss/renderer";
import {
	Button,
	Checkbox,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { ColorPickerSettingsNew } from "../../../shared/ColorPickerSettingsNew";

export interface HeaderStylingProps<D extends BlockDef = GridBlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const HeaderStyling = observer(
	<D extends BlockDef = GridBlockDef>({
		id,
		// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
		path,
	}: HeaderStylingProps<D>) => {
		const { data, setData } = useBlockSettings<GridBlockDef>(id);

		const [gridStyle, setGridStyle] = useState<HeaderBackgroundSettings>({
			backgroundColor: "#ffffff",
			fontSize: "14",
			fontColor: "#000000",
			selectedColumn: [] as string[],
		});
		const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);

		useEffect(() => {
			if (data.option?.headerBackgroundSettings) {
				setGridStyle(data.option.headerBackgroundSettings);
			}
		}, [data.option]);

		const handleColumnToggle = (col: GridBlockColumn) => {
			const currentSelected = gridStyle.selectedColumn ?? [];
			const newSelected = currentSelected.includes(col.name)
				? currentSelected.filter((name) => name !== col.name)
				: [...currentSelected, col.name];

			const newOption = {
				...data.option,
				headerBackgroundSettings: {
					...gridStyle,
					selectedColumn: newSelected,
				},
			};
			setGridStyle((prev) => ({
				...prev,
				selectedColumn: newSelected,
			}));
			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const handleColorChange = (newColor: string) => {
			const newOption = {
				...data.option,
				headerBackgroundSettings: {
					...gridStyle,
					backgroundColor: newColor,
				},
			};
			setGridStyle((prev) => ({
				...prev,
				backgroundColor: newColor,
			}));

			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const handleFontColorChange = (newColor: string) => {
			const newOption = {
				...data.option,
				headerBackgroundSettings: {
					...gridStyle,
					fontColor: newColor,
				},
			};
			setGridStyle((prev) => ({
				...prev,
				fontColor: newColor,
			}));

			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const handleFontSizeChange = (
			e: React.ChangeEvent<HTMLInputElement>,
		) => {
			const newFontSize = e.target.value;
			const newOption = {
				...data.option,
				headerBackgroundSettings: {
					...gridStyle,
					fontSize: newFontSize,
				},
			};
			setGridStyle((prev) => ({
				...prev,
				fontSize: newFontSize,
			}));

			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const resetToInitialState = () => {
			const defaultState = {
				backgroundColor: "#ffffff",
				fontSize: "16",
				fontColor: "#000000",
				selectedColumn: [] as string[],
			};
			setGridStyle(defaultState);
			const newOption = {
				...data.option,
				headerBackgroundSettings: defaultState,
			};
			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const selectedColumn = gridStyle.selectedColumn ?? [];
		const columns = data.columns || [];
		const selectedLabel =
			selectedColumn.length === 0
				? "Select column"
				: selectedColumn.length === 1
					? selectedColumn[0]
					: `${selectedColumn.length} columns selected`;

		return (
			<div className="flex flex-col gap-2">
				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Select Column
						</p>
					</label>
					<Popover
						open={columnPopoverOpen}
						onOpenChange={setColumnPopoverOpen}
					>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={columnPopoverOpen}
								className="w-full justify-between font-normal"
							>
								<span className="truncate">
									{selectedLabel}
								</span>
								<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
							<Command>
								<CommandInput placeholder="Search columns..." />
								<CommandList>
									<CommandEmpty>
										No columns found.
									</CommandEmpty>
									<CommandGroup>
										{columns.map((col) => (
											<CommandItem
												key={col.name}
												value={col.name}
												onSelect={() =>
													handleColumnToggle(col)
												}
											>
												<Checkbox
													checked={selectedColumn.includes(
														col.name,
													)}
													className="mr-2"
												/>
												{col.name}
												{selectedColumn.includes(
													col.name,
												) && (
													<Check className="ml-auto size-4" />
												)}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Header Font Size
						</p>
					</label>
					<Input
						value={gridStyle?.fontSize}
						onChange={handleFontSizeChange}
					/>
				</div>

				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Header Font Color
						</p>
					</label>
					<ColorPickerSettingsNew
						id={id}
						path="option.headerBackgroundSettings.fontColor"
						colorValue={gridStyle.fontColor}
						onChange={handleFontColorChange}
					/>
				</div>

				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Header Background Color
						</p>
					</label>
					<ColorPickerSettingsNew
						id={id}
						path="option.headerBackgroundSettings.backgroundColor"
						colorValue={gridStyle.backgroundColor}
						onChange={handleColorChange}
					/>
				</div>

				<div className="flex flex-row items-center justify-end py-2">
					<Button size="sm" onClick={resetToInitialState}>
						Reset
					</Button>
				</div>
			</div>
		);
	},
);
