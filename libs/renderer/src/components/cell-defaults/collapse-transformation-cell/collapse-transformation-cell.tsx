import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Input } from "@semoss/ui/next";
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
	type Transformation,
	type TransformationCellDef,
	TransformationCellInput,
	type TransformationDef,
	Transformations,
	type TransformationTargetCell,
} from "../shared";

export interface CollapseTransformationDef
	extends TransformationDef<"collapse"> {
	key: "collapse";
	parameters: {
		columns: ColumnInfo[];
		value: ColumnInfo;
		delimiter: string;
		maintainColumns?: ColumnInfo[];
	};
}

export interface CollapseTransformationCellDef
	extends TransformationCellDef<"collapse-transformation"> {
	widget: "collapse-transformation";
	parameters: {
		transformation: Transformation<CollapseTransformationDef>;
		targetCell: TransformationTargetCell;
	};
}

export const CollapseTransformationCell: CellComponent<CollapseTransformationCellDef> =
	observer((props) => {
		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const targetCell: CellState<QueryImportCellDef> = computed(() => {
			return cell.query.cells[
				cell.parameters.targetCell.id
			] as CellState<QueryImportCellDef>;
		}).get();

		const cellTransformation: Transformation<CollapseTransformationDef> =
			computed(() => {
				return cell.parameters
					.transformation as Transformation<CollapseTransformationDef>;
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

		const dispatch = (path: string, value: unknown) =>
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path,
					value,
				},
			});

		if (!doesFrameExist && !cellTransformation.parameters.columns.length) {
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
							"Aggregate data for a group based on the delimiter"
						)}
					</span>
					<ColumnTransformationField
						label="Group by Column(s)"
						disabled={!doesFrameExist}
						cell={cell}
						selectedColumns={cellTransformation.parameters.columns}
						multiple
						onChange={(newColumn: ColumnInfo) =>
							dispatch(
								"parameters.transformation.parameters.columns",
								newColumn,
							)
						}
					/>
					<ColumnTransformationField
						label="Value Column"
						disabled={!doesFrameExist}
						cell={cell}
						selectedColumns={cellTransformation.parameters.value}
						onChange={(newColumn: ColumnInfo) =>
							dispatch(
								"parameters.transformation.parameters.value",
								newColumn,
							)
						}
					/>
					<div className="flex flex-col gap-1.5">
						{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
						<label className="text-muted-foreground text-xs">
							String Separator
						</label>
						<Input
							disabled={!doesFrameExist}
							value={cellTransformation.parameters.delimiter}
							onChange={(e) =>
								dispatch(
									"parameters.transformation.parameters.delimiter",
									e.target.value,
								)
							}
						/>
					</div>
					<ColumnTransformationField
						label="Other Column(s) to Maintain"
						disabled={!doesFrameExist}
						cell={cell}
						selectedColumns={
							cellTransformation.parameters.maintainColumns
						}
						multiple
						onChange={(newColumn: ColumnInfo) =>
							dispatch(
								"parameters.transformation.parameters.maintainColumns",
								newColumn,
							)
						}
					/>
				</div>
			</TransformationCellInput>
		);
	});
