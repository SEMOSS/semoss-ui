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
	EncodeColumnCheckboxTransformationField,
	type Transformation,
	type TransformationCellDef,
	TransformationCellInput,
	type TransformationDef,
	Transformations,
	type TransformationTargetCell,
} from "../shared";

export interface EncodeColumnTransformationDef
	extends TransformationDef<"encode-column"> {
	key: "encode-column";
	parameters: {
		columns: ColumnInfo[];
	};
}

export interface EncodeColumnTransformationCellDef
	extends TransformationCellDef<"encode-column-transformation"> {
	widget: "encode-column-transformation";
	parameters: {
		transformation: Transformation<EncodeColumnTransformationDef>;
		targetCell: TransformationTargetCell;
	};
}

export const EncodeColumnTransformationCell: CellComponent<EncodeColumnTransformationCellDef> =
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

		const cellTransformation: Transformation<EncodeColumnTransformationDef> =
			computed(() => {
				return cell.parameters
					.transformation as Transformation<EncodeColumnTransformationDef>;
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
					if (cell.widget === "query-import") frameList.push(cell);
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
							"Obfuscate the values of a column"
						)}
					</span>
					<EncodeColumnCheckboxTransformationField
						disabled={!doesFrameExist}
						cell={cell}
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
