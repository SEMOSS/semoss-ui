import { Check, ChevronsUpDown } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
} from "@semoss/ui/next";
import { useBlocksPixel } from "../../../../hooks/useBlocksPixel";
import type { CellState } from "../../../../store";
import type {
	ColumnInfo,
	TransformationTargetCell,
} from "./transformation.types";

interface FrameHeaderInfo {
	headers: {
		alias: string;
		dataType: string;
	}[];
}

export type ColumnTransformationFieldComponent = (props: {
	cell: CellState;
	selectedColumns: ColumnInfo[] | ColumnInfo;
	columnTypes?: string[];
	multiple?: boolean;
	label?: string;
	disabled?: boolean;
	onChange: (newColumns: ColumnInfo[] | ColumnInfo) => void;
}) => JSX.Element;

export const ColumnTransformationField: ColumnTransformationFieldComponent =
	observer((props) => {
		const {
			cell,
			selectedColumns,
			columnTypes = undefined,
			multiple = false,
			label = undefined,
			disabled = false,
			onChange,
		} = props;
		const [open, setOpen] = useState(false);

		const frameVariableName = computed(() => {
			return (cell.parameters.targetCell as TransformationTargetCell)
				.frameVariableName;
		}).get();

		const targetCell: CellState = computed(() => {
			return cell.query.cells[
				(cell.parameters.targetCell as TransformationTargetCell).id
			];
		}).get();

		const [frameHeaders, setFrameHeaders] = useState<{
			loading: boolean;
			columns: ColumnInfo[];
		}>({ loading: true, columns: [] });

		const frameHeaderPixelReturn = useBlocksPixel<{
			headerInfo: FrameHeaderInfo;
		}>(
			`META | ${frameVariableName} | FrameHeaders (${
				columnTypes
					? `headerTypes = ${JSON.stringify(columnTypes)}`
					: ""
			});`,
		);

		useEffect(() => {
			if (frameHeaderPixelReturn.status !== "SUCCESS") return;
			const columns = frameHeaderPixelReturn.data.headerInfo.headers.map(
				(h) => ({ name: h.alias, dataType: h.dataType }),
			);
			setFrameHeaders({ loading: false, columns });
		}, [frameHeaderPixelReturn.status, frameHeaderPixelReturn.data]);

		useEffect(() => {
			if (targetCell?.output) {
				frameHeaderPixelReturn.refresh();
			}
		}, [targetCell ? targetCell.output : null]);

		const displayLabel = label ?? `Column${multiple ? "s" : ""}`;

		if (multiple) {
			const selected = (selectedColumns as ColumnInfo[]) ?? [];
			const toggleColumn = (col: ColumnInfo) => {
				const exists = selected.some((c) => c.name === col.name);
				onChange(
					exists
						? selected.filter((c) => c.name !== col.name)
						: [...selected, col],
				);
			};
			return (
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							aria-expanded={open}
							disabled={disabled}
							className="w-full justify-between"
						>
							<span className="truncate">
								{selected.length > 0
									? selected.map((c) => c.name).join(", ")
									: displayLabel}
							</span>
							{frameHeaders.loading ? (
								<Spinner className="ml-2 size-4 shrink-0" />
							) : (
								<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
						<Command>
							<CommandInput placeholder="Search columns..." />
							<CommandEmpty>No columns found.</CommandEmpty>
							<CommandGroup>
								{frameHeaders.columns.map((col) => {
									const isSelected = selected.some(
										(c) => c.name === col.name,
									);
									return (
										<CommandItem
											key={col.name}
											value={col.name}
											onSelect={() => toggleColumn(col)}
										>
											<Check
												className={`mr-2 size-4 ${isSelected ? "opacity-100" : "opacity-0"}`}
											/>
											{col.name}
										</CommandItem>
									);
								})}
							</CommandGroup>
						</Command>
					</PopoverContent>
				</Popover>
			);
		}

		const singleSelected = selectedColumns as ColumnInfo;
		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className="w-full justify-between"
					>
						<span className="truncate">
							{singleSelected?.name ?? displayLabel}
						</span>
						{frameHeaders.loading ? (
							<Spinner className="ml-2 size-4 shrink-0" />
						) : (
							<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
					<Command>
						<CommandInput placeholder="Search columns..." />
						<CommandEmpty>No columns found.</CommandEmpty>
						<CommandGroup>
							{frameHeaders.columns.map((col) => (
								<CommandItem
									key={col.name}
									value={col.name}
									onSelect={() => {
										onChange(col);
										setOpen(false);
									}}
								>
									<Check
										className={`mr-2 size-4 ${singleSelected?.name === col.name ? "opacity-100" : "opacity-0"}`}
									/>
									{col.name}
								</CommandItem>
							))}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>
		);
	});
