import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import {
	Input,
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
import type { NotebookImportCellDef } from "../notebook-import-cell";
import {
	type ColumnInfo,
	ColumnTransformationField,
	type operation,
	operations,
	type Transformation,
	type TransformationCellDef,
	TransformationCellInput,
	type TransformationDef,
	Transformations,
	type TransformationTargetCell,
} from "../shared";

export interface UpdateRowTransformationDef
	extends TransformationDef<"update-row"> {
	key: "update-row";
	parameters: {
		compareColumn: ColumnInfo;
		compareOperation: operation;
		compareValue: string;
		targetColumn: ColumnInfo;
		targetValue: string;
	};
}

export interface UpdateRowTransformationCellDef
	extends TransformationCellDef<"update-row-transformation"> {
	widget: "update-row-transformation";
	parameters: {
		transformation: Transformation<UpdateRowTransformationDef>;
		targetCell: TransformationTargetCell;
	};
}

export const UpdateRowTransformationCell: CellComponent<UpdateRowTransformationCellDef> =
	observer((props) => {
		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const targetCell: CellState<NotebookImportCellDef> = computed(() => {
			return cell.query.cells[
				cell.parameters.targetCell.id
			] as CellState<NotebookImportCellDef>;
		}).get();

		const cellTransformation: Transformation<UpdateRowTransformationDef> =
			computed(() => {
				return cell.parameters
					.transformation as Transformation<UpdateRowTransformationDef>;
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

		const getTextFieldType = (dataType: string): string => {
			switch (dataType) {
				case "INT":
				case "DOUBLE":
				case "DECIMAL":
				case "NUMBER":
					return "number";
				case "DATE":
					return "date";
				case "TIME":
					return "time";
				default:
					return "text";
			}
		};

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
			!doesFrameExist &&
			!cellTransformation.parameters.compareColumn.name
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
							"Replace values of a column by defining a conditional statement"
						)}
					</span>
					<div className="flex w-full flex-row gap-4">
						<ColumnTransformationField
							disabled={!doesFrameExist}
							cell={cell}
							selectedColumns={
								cellTransformation.parameters.compareColumn ?? {
									name: "",
									dataType: "",
								}
							}
							onChange={(newColumn: ColumnInfo) => {
								dispatch(
									"parameters.transformation.parameters.compareColumn",
									newColumn,
								);
							}}
							label="Compare Column"
						/>
						<Select
							disabled={!doesFrameExist}
							value={
								cellTransformation.parameters
									.compareOperation as string
							}
							onValueChange={(val) =>
								dispatch(
									"parameters.transformation.parameters.compareOperation",
									val,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Operation" />
							</SelectTrigger>
							<SelectContent>
								{operations.map((op) => (
									<SelectItem
										key={String(op)}
										value={String(op)}
									>
										{String(op)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="flex flex-1 flex-col gap-1.5">
							{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
							<label className="text-muted-foreground text-xs">
								Compare Value
							</label>
							<Input
								disabled={!doesFrameExist}
								type={getTextFieldType(
									cellTransformation.parameters.compareColumn
										.dataType,
								)}
								value={
									cellTransformation.parameters.compareValue
								}
								onChange={(e) =>
									dispatch(
										"parameters.transformation.parameters.compareValue",
										e.target.value,
									)
								}
							/>
						</div>
					</div>
					<div className="flex w-full flex-row gap-4">
						<ColumnTransformationField
							disabled={!doesFrameExist}
							cell={cell}
							selectedColumns={
								cellTransformation.parameters.targetColumn ?? {
									name: "",
									dataType: "",
								}
							}
							onChange={(newColumn: ColumnInfo) => {
								dispatch(
									"parameters.transformation.parameters.targetColumn",
									newColumn,
								);
							}}
							label="Update Column"
						/>
						<div className="flex flex-1 flex-col gap-1.5">
							{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
							<label className="text-muted-foreground text-xs">
								Update Value
							</label>
							<Input
								disabled={!doesFrameExist}
								type={getTextFieldType(
									cellTransformation.parameters.targetColumn
										.dataType,
								)}
								value={
									cellTransformation.parameters.targetValue
								}
								onChange={(e) =>
									dispatch(
										"parameters.transformation.parameters.targetValue",
										e.target.value,
									)
								}
							/>
						</div>
					</div>
				</div>
			</TransformationCellInput>
		);
	});
