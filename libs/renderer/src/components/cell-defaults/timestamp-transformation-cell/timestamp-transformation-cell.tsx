import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { Checkbox, Input } from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellState,
} from "../../../store";
import type { QueryImportCellDef } from "../query-import-cell";
import {
	type Transformation,
	type TransformationCellDef,
	TransformationCellInput,
	type TransformationDef,
	Transformations,
	type TransformationTargetCell,
} from "../shared";

export interface TimestampTransformationDef
	extends TransformationDef<"timestamp"> {
	key: "timestamp";
	parameters: {
		columnName: string;
		includeTime: boolean;
	};
}

export interface TimestampTransformationCellDef
	extends TransformationCellDef<"timestamp-transformation"> {
	widget: "timestamp-transformation";
	parameters: {
		transformation: Transformation<TimestampTransformationDef>;
		targetCell: TransformationTargetCell;
	};
}

export const TimestampTransformationCell: CellComponent<TimestampTransformationCellDef> =
	observer((props) => {
		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const targetCell: CellState<QueryImportCellDef> = computed(() => {
			return cell.query.cells[
				cell.parameters.targetCell.id
			] as CellState<QueryImportCellDef>;
		}).get();

		const cellTransformation: Transformation<TimestampTransformationDef> =
			computed(() => {
				return cell.parameters
					.transformation as Transformation<TimestampTransformationDef>;
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

		if (!doesFrameExist && !cellTransformation.parameters.columnName) {
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
							"Add a new column with today's date as the column value"
						)}
					</span>
					<div className="flex w-full flex-row items-end gap-4">
						<div className="flex flex-1 flex-col gap-1.5">
							{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
							<label className="text-muted-foreground text-xs">
								Column Name
							</label>
							<Input
								disabled={!doesFrameExist}
								value={cellTransformation.parameters.columnName}
								onChange={(e) =>
									dispatch(
										"parameters.transformation.parameters.columnName",
										e.target.value,
									)
								}
							/>
						</div>
						{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
						<label className="flex cursor-pointer items-center gap-2 pb-2">
							<Checkbox
								checked={
									cellTransformation.parameters.includeTime
								}
								onCheckedChange={() =>
									dispatch(
										"parameters.transformation.parameters.includeTime",
										!cellTransformation.parameters
											.includeTime,
									)
								}
							/>
							<span className="whitespace-nowrap text-sm">
								Include time
							</span>
						</label>
					</div>
				</div>
			</TransformationCellInput>
		);
	});
