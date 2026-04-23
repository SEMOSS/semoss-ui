import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
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

export interface UppercaseTransformationDef
	extends TransformationDef<"uppercase"> {
	key: "uppercase";
	parameters: {
		columns: ColumnInfo[];
	};
}

export interface UppercaseTransformationCellDef
	extends TransformationCellDef<"uppercase-transformation"> {
	widget: "uppercase-transformation";
	parameters: {
		transformation: Transformation<UppercaseTransformationDef>;
		targetCell: TransformationTargetCell;
	};
}

export const UppercaseTransformationCell: CellComponent<UppercaseTransformationCellDef> =
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

		const cellTransformation: Transformation<UppercaseTransformationDef> =
			computed(() => {
				return cell.parameters
					.transformation as Transformation<UppercaseTransformationDef>;
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

		if (
			(!doesFrameExist &&
				!cellTransformation.parameters.columns.length) ||
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
							"Change the values of the selected columns to uppercase"
						)}
					</span>
					<ColumnTransformationField
						disabled={!doesFrameExist}
						cell={cell}
						selectedColumns={
							cellTransformation.parameters.columns ?? []
						}
						multiple
						columnTypes={["STRING"]}
						onChange={(newColumns: ColumnInfo[]) => {
							state.dispatch({
								message: ActionMessages.UPDATE_CELL,
								payload: {
									queryId: cell.query.id,
									cellId: cell.id,
									path: "parameters.transformation.parameters.columns",
									value: newColumns,
								},
							});
						}}
					/>
				</div>
			</TransformationCellInput>
		);
	});
