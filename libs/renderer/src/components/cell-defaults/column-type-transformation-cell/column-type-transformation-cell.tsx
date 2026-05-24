import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellState,
} from "../../../store";
import type { QueryImportCellDef } from "../query-import-cell";
import {
	type ColumnInfo,
	ColumnTransformationField,
	type columnTypes,
	type Transformation,
	type TransformationCellDef,
	TransformationCellInput,
	type TransformationDef,
	Transformations,
	type TransformationTargetCell,
	transformationColumnTypes,
} from "../shared";

export interface ColumnTypeTransformationDef
	extends TransformationDef<"column-type"> {
	key: "column-type";
	parameters: {
		column: ColumnInfo;
		columnType: columnTypes;
	};
}

export interface ColumnTypeTransformationCellDef
	extends TransformationCellDef<"column-type-transformation"> {
	widget: "column-type-transformation";
	parameters: {
		transformation: Transformation<ColumnTypeTransformationDef>;
		targetCell: TransformationTargetCell;
	};
}

export const ColumnTypeTransformationCell: CellComponent<ColumnTypeTransformationCellDef> =
	observer((props) => {
		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const targetCell: CellState<QueryImportCellDef> = computed(() => {
			return cell.query.cells[
				cell.parameters.targetCell.id
			] as CellState<QueryImportCellDef>;
		}).get();

		const cellTransformation: Transformation<ColumnTypeTransformationDef> =
			computed(() => {
				return cell.parameters
					.transformation as Transformation<ColumnTypeTransformationDef>;
			}).get();

		const doesFrameExist: boolean = computed(() => {
			return (
				!!targetCell && (targetCell.isExecuted || !!targetCell.output)
			);
		}).get();

		const frames = useMemo(() => {
			return Object.values(cell.query.cells).filter(
				(c) =>
					c.widget === "query-import" || c.widget === "data-import",
			);
		}, []);

		const helpText = cell.parameters.targetCell.id
			? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
			: "A Python or R target frame variable must be defined in order to apply a transformation.";

		if (!doesFrameExist && !cellTransformation.parameters.column) {
			return (
				<TransformationCellInput
					isExpanded={isExpanded}
					display={Transformations[cellTransformation.key].display}
					Icon={Transformations[cellTransformation.key].icon}
					frame={{ cell, options: frames }}
				>
					<div className="w-full py-1.5">
						<span className="text-xs italic">{helpText}</span>
					</div>
				</TransformationCellInput>
			);
		}

		return (
			<TransformationCellInput
				isExpanded={isExpanded}
				display={Transformations[cellTransformation.key].display}
				Icon={Transformations[cellTransformation.key].icon}
				frame={{ cell, options: frames }}
			>
				<div className="flex flex-col gap-4">
					<span className="text-xs">
						{!doesFrameExist ? (
							<em>{helpText}</em>
						) : (
							"Change the type of the selected column"
						)}
					</span>
					<ColumnTransformationField
						disabled={!doesFrameExist}
						cell={cell}
						selectedColumns={cellTransformation.parameters.column}
						onChange={(newColumn: ColumnInfo) => {
							state.dispatch({
								message: ActionMessages.UPDATE_CELL,
								payload: {
									queryId: cell.query.id,
									cellId: cell.id,
									path: "parameters.transformation.parameters.column",
									value: newColumn,
								},
							});
						}}
					/>
					<Select
						disabled={!doesFrameExist}
						value={cellTransformation.parameters.columnType}
						onValueChange={(val) => {
							state.dispatch({
								message: ActionMessages.UPDATE_CELL,
								payload: {
									queryId: cell.query.id,
									cellId: cell.id,
									path: "parameters.transformation.parameters.columnType",
									value: val,
								},
							});
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Operation" />
						</SelectTrigger>
						<SelectContent>
							{transformationColumnTypes.map((type) => (
								<SelectItem key={type} value={type}>
									{type}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</TransformationCellInput>
		);
	});
