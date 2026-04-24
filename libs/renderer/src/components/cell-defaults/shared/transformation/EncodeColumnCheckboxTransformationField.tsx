import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";
import { Checkbox, Input } from "@semoss/ui/next";
import { useBlocksPixel } from "../../../../hooks";
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

type ColumnStateType<T> = {
	[key: string]: T;
};

export type ColumnCheckboxTransformationFieldComponent = (props: {
	cell: CellState;
	columnTypes?: string[];
	disabled?: boolean;
	onChange: (newColumns: ColumnInfo[] | ColumnInfo) => void;
}) => JSX.Element;

export const EncodeColumnCheckboxTransformationField: ColumnCheckboxTransformationFieldComponent =
	observer((props) => {
		const { cell, disabled, onChange } = props;

		const [search, setSearch] = React.useState<string>("");
		const [columnState, setColumnState] = React.useState([]);
		const [selectAll, setSelectAll] = React.useState(false);

		const handleChange = (
			checked: boolean,
			name: string,
			index: number,
		) => {
			if (selectAll) setSelectAll(false);
			columnState[index][name] = checked;
			setColumnState([...columnState]);
		};

		const handleSelectAll = () => {
			const newSelectAll = !selectAll;
			setSelectAll(newSelectAll);
			for (const key of columnState) {
				const firstKey = Object.keys(key)[0];
				key[firstKey] = newSelectAll;
			}
			setColumnState([...columnState]);
		};

		const frameVariableName = computed(() => {
			return (cell.parameters.targetCell as TransformationTargetCell)
				.frameVariableName;
		}).get();

		const targetCell: CellState = computed(() => {
			return cell.query.cells[
				(cell.parameters.targetCell as TransformationTargetCell).id
			];
		}).get();

		const [frameHeaders, setFrameHeaders] = React.useState<{
			loading: boolean;
			columns: ColumnInfo[];
		}>({ loading: true, columns: [] });

		const frameHeaderPixelReturn = useBlocksPixel<{
			headerInfo: FrameHeaderInfo;
		}>(`META | ${frameVariableName} | FrameHeaders ();`);

		React.useEffect(() => {
			if (frameHeaderPixelReturn.status !== "SUCCESS") return;
			const columns = frameHeaderPixelReturn.data.headerInfo.headers.map(
				(h) => ({ name: h.alias, dataType: h.dataType }),
			);
			setFrameHeaders({ loading: false, columns });

			const obj = columns.map((col) => ({
				[col.name]: false,
				column: col,
			}));
			setColumnState(obj);
		}, [frameHeaderPixelReturn.status, frameHeaderPixelReturn.data]);

		React.useEffect(() => {
			if (targetCell?.output) {
				frameHeaderPixelReturn.refresh();
			}
		}, [targetCell ? targetCell.output : null]);

		React.useEffect(() => {
			if (columnState.length) {
				const allFalse = columnState.every((key) => {
					const firstKey = Object.keys(key)[0];
					return key[firstKey] === false;
				});
				if (allFalse) setSelectAll(false);
			}
		}, [columnState]);

		const filteredResults = React.useMemo(() => {
			return frameHeaders.columns.filter((val) =>
				val.name.toLowerCase().includes(search.toLowerCase()),
			);
		}, [search, frameHeaders.columns]);

		const assignColumns = () => {
			const arr: ColumnInfo[] = [];
			columnState.forEach((column: ColumnStateType<boolean>) => {
				if (Object.values(column)[0] === true) {
					arr.push(column.column);
				}
			});
			onChange(arr);
		};

		return (
			<React.Fragment>
				<Input
					disabled={disabled}
					placeholder="Search for column name"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="mb-2"
				/>
				<div className="h-[210px] max-h-[210px] overflow-y-auto rounded-lg border border-input p-0">
					{filteredResults && (
						<div className="ml-3 flex flex-col">
							{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
							<label className="flex cursor-pointer items-center gap-2 py-1">
								<Checkbox
									checked={selectAll}
									onCheckedChange={() => {
										handleSelectAll();
										assignColumns();
									}}
								/>
								<span className="text-sm">
									{selectAll ? "deselect all" : "select all"}
								</span>
							</label>
							{filteredResults.map((col, idx) => (
								// biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input
								<label
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									key={idx}
									className="flex cursor-pointer items-center gap-2 py-1"
								>
									<Checkbox
										checked={Boolean(
											columnState[idx]?.[col.name],
										)}
										onCheckedChange={(checked) => {
											handleChange(
												Boolean(checked),
												col.name,
												idx,
											);
											assignColumns();
										}}
									/>
									<span className="text-sm">{col.name}</span>
								</label>
							))}
						</div>
					)}
				</div>
			</React.Fragment>
		);
	});
