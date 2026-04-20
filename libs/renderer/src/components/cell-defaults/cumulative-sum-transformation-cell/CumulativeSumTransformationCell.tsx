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

export interface CumulativeSumTransformationDef
	extends TransformationDef<"cumulative-sum"> {
	key: "cumulative-sum";
	parameters: {
		newColumn: string;
		valueColumn: ColumnInfo;
		sortColumns?: ColumnInfo[];
		groupByColumns?: ColumnInfo[];
	};
}

export interface CumulativeSumTransformationCellDef
	extends TransformationCellDef<"cumulative-sum-transformation"> {
	widget: "cumulative-sum-transformation";
	parameters: {
		transformation: Transformation<CumulativeSumTransformationDef>;
		targetCell: TransformationTargetCell;
	};
}

export const CumulativeSumTransformationCell: CellComponent<CumulativeSumTransformationCellDef> =
	observer((props) => {
		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const targetCell: CellState<QueryImportCellDef> = computed(() => {
			let c: CellState<QueryImportCellDef> | undefined;
			Object.values(state.queries).forEach((query) => {
				if (query.cells[cell.parameters.targetCell.id]) {
					c = query.cells[
						cell.parameters.targetCell.id
					] as CellState<QueryImportCellDef>;
				}
			});
			return c;
		}).get();

		const cellTransformation: Transformation<CumulativeSumTransformationDef> =
			computed(() => {
				return cell.parameters
					.transformation as Transformation<CumulativeSumTransformationDef>;
			}).get();

		const doesFrameExist: boolean = computed(() => {
			return (
				!!targetCell && (targetCell.isExecuted || !!targetCell.output)
			);
		}).get();

		const frames = useMemo(() => {
			const frameList = [];
			Object.keys(state.queries).forEach((queryKey) => {
				const query = state.queries[queryKey];
				Object.values(query.cells).forEach((cell) => {
					if (
						cell.widget === "query-import" ||
						cell.widget === "data-import"
					)
						frameList.push(cell);
				});
			});
			return frameList;
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

		if (
			(!doesFrameExist && !cellTransformation.parameters.newColumn) ||
			!targetCell.isExecuted
		) {
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
							"Add a new column for the cumulative sum of another column's values"
						)}
					</span>
					<div className="flex flex-col gap-1.5">
						{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
						<label className="text-muted-foreground text-xs">
							Column Name
						</label>
						<Input
							disabled={!doesFrameExist}
							value={cellTransformation.parameters.newColumn}
							onChange={(e) =>
								dispatch(
									"parameters.transformation.parameters.newColumn",
									e.target.value,
								)
							}
						/>
					</div>
					<ColumnTransformationField
						label="Aggregate Value"
						disabled={!doesFrameExist}
						cell={cell}
						selectedColumns={
							cellTransformation.parameters.valueColumn
						}
						onChange={(newColumn: ColumnInfo) =>
							dispatch(
								"parameters.transformation.parameters.valueColumn",
								newColumn,
							)
						}
					/>
					<ColumnTransformationField
						label="Sort by Column(s)"
						disabled={!doesFrameExist}
						cell={cell}
						selectedColumns={
							cellTransformation.parameters.sortColumns
						}
						multiple
						onChange={(newColumn: ColumnInfo) =>
							dispatch(
								"parameters.transformation.parameters.sortColumns",
								newColumn,
							)
						}
					/>
					<ColumnTransformationField
						label="Group by Column(s)"
						disabled={!doesFrameExist}
						cell={cell}
						selectedColumns={
							cellTransformation.parameters.groupByColumns
						}
						multiple
						onChange={(newColumn: ColumnInfo) =>
							dispatch(
								"parameters.transformation.parameters.groupByColumns",
								newColumn,
							)
						}
					/>
				</div>
			</TransformationCellInput>
		);
	});
