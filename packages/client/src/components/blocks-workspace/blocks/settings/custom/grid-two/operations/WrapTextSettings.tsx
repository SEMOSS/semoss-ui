import { Check, ChevronsUpDown } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type {
	Block,
	BlockDef,
	GridBlockColumn,
	GridBlockDef,
	Paths,
	PathValue,
	WrapTextSettings,
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
	Popover,
	PopoverContent,
	PopoverTrigger,
	Switch,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

export interface TitleStylingProps<D extends BlockDef = GridBlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const ColumnTextWrap = observer(
	// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
	<D extends BlockDef = GridBlockDef>({ id, path }: TitleStylingProps<D>) => {
		const { data, setData } = useBlockSettings<GridBlockDef>(id);
		const [wrapTextSettings, setWrapTextSettings] =
			useState<WrapTextSettings>({
				selectedColumn: [] as string[],
				textWrap: false,
			});
		const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);

		useEffect(() => {
			if (data.option?.wrapTextSettings) {
				setWrapTextSettings(data.option.wrapTextSettings);
			}
		}, [data.option]);

		const handleColumnToggle = (col: GridBlockColumn) => {
			const currentSelected = wrapTextSettings.selectedColumn ?? [];
			const newSelected = currentSelected.includes(col.name)
				? currentSelected.filter((name) => name !== col.name)
				: [...currentSelected, col.name];

			const newOption = {
				...data.option,
				wrapTextSettings: {
					...wrapTextSettings,
					selectedColumn: newSelected,
				},
			};
			setWrapTextSettings((prev) => ({
				...prev,
				selectedColumn: newSelected,
			}));
			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const handleInputChange = (checked: boolean) => {
			const newOption = {
				...data.option,
				wrapTextSettings: {
					...wrapTextSettings,
					textWrap: checked,
				},
			};
			setWrapTextSettings((prev) => ({
				...prev,
				textWrap: checked,
			}));
			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const resetToInitialState = () => {
			const defaultState = {
				selectedColumn: [] as string[],
				textWrap: false,
			};
			setWrapTextSettings(defaultState);
			const newOption = {
				...data.option,
				wrapTextSettings: defaultState,
			};
			setData(
				"option",
				newOption as PathValue<GridBlockDef["data"], "option">,
			);
		};

		const selectedColumn = wrapTextSettings.selectedColumn ?? [];
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
				<div
					className="flex flex-row items-center gap-2 py-2"
					style={{ marginTop: "8px" }}
				>
					<Switch
						checked={wrapTextSettings.textWrap}
						onCheckedChange={handleInputChange}
						title="Wrap Text"
					/>
					<p className="text-muted-foreground text-sm">Wrap Text</p>
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
