import { Calendar, Table } from "lucide-react";
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
	ToggleGroup,
	ToggleGroupItem,
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
	type dateType,
	type dateUnit,
	dateUnitTypes,
	type Transformation,
	type TransformationCellDef,
	TransformationCellInput,
	type TransformationDef,
	Transformations,
	type TransformationTargetCell,
} from "../shared";

export interface DateDifferenceTransformationDef
	extends TransformationDef<"date-difference"> {
	key: "date-difference";
	parameters: {
		startType: dateType;
		startCustomDate: string;
		startColumn: ColumnInfo;
		endType: "column" | "custom";
		endCustomDate: string;
		endColumn: ColumnInfo;
		unit: dateUnit;
		columnName: string;
	};
}

export interface DateDifferenceTransformationCellDef
	extends TransformationCellDef<"date-difference-transformation"> {
	widget: "date-difference-transformation";
	parameters: {
		transformation: Transformation<DateDifferenceTransformationDef>;
		targetCell: TransformationTargetCell;
	};
}

export const DateDifferenceTransformationCell: CellComponent<DateDifferenceTransformationCellDef> =
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

		const cellTransformation: Transformation<DateDifferenceTransformationDef> =
			computed(() => {
				return cell.parameters
					.transformation as Transformation<DateDifferenceTransformationDef>;
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
			(!doesFrameExist && !cellTransformation.parameters.columnName) ||
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
							"Compute the difference between dates and add the computed value as a new column"
						)}
					</span>
					<div className="flex w-full flex-row gap-4">
						{/* Start date */}
						<div className="flex min-w-[40%] flex-row gap-2">
							<ToggleGroup
								type="single"
								size="sm"
								value={cellTransformation.parameters.startType}
								disabled={
									cellTransformation.parameters.endType ===
									"custom"
								}
								onValueChange={(val) => {
									if (val)
										dispatch(
											"parameters.transformation.parameters.startType",
											val,
										);
								}}
							>
								<ToggleGroupItem value="column">
									<Table className="size-4" />
								</ToggleGroupItem>
								<ToggleGroupItem value="custom">
									<Calendar className="size-4" />
								</ToggleGroupItem>
							</ToggleGroup>
							{cellTransformation.parameters.startType ===
							"column" ? (
								<ColumnTransformationField
									disabled={!doesFrameExist}
									label="Start Date Column"
									cell={cell}
									selectedColumns={
										cellTransformation.parameters
											.startColumn
									}
									columnTypes={["DATE"]}
									onChange={(newColumn: ColumnInfo) => {
										dispatch(
											"parameters.transformation.parameters.startColumn",
											newColumn,
										);
									}}
								/>
							) : (
								<div className="flex flex-1 flex-col gap-1.5">
									{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
									<label className="text-muted-foreground text-xs">
										Custom Start Date
									</label>
									<Input
										type="date"
										value={
											cellTransformation.parameters
												.startCustomDate
										}
										onChange={(e) =>
											dispatch(
												"parameters.transformation.parameters.startCustomDate",
												e.target.value,
											)
										}
									/>
								</div>
							)}
						</div>

						{/* End date */}
						<div className="flex min-w-[40%] flex-row gap-2">
							<ToggleGroup
								type="single"
								size="sm"
								value={cellTransformation.parameters.endType}
								disabled={
									cellTransformation.parameters.startType ===
									"custom"
								}
								onValueChange={(val) => {
									if (val)
										dispatch(
											"parameters.transformation.parameters.endType",
											val,
										);
								}}
							>
								<ToggleGroupItem value="column">
									<Table className="size-4" />
								</ToggleGroupItem>
								<ToggleGroupItem value="custom">
									<Calendar className="size-4" />
								</ToggleGroupItem>
							</ToggleGroup>
							{cellTransformation.parameters.endType ===
							"column" ? (
								<ColumnTransformationField
									disabled={!doesFrameExist}
									label="End Date Column"
									cell={cell}
									selectedColumns={
										cellTransformation.parameters.endColumn
									}
									columnTypes={["DATE"]}
									onChange={(newColumn: ColumnInfo) => {
										dispatch(
											"parameters.transformation.parameters.endColumn",
											newColumn,
										);
									}}
								/>
							) : (
								<div className="flex flex-1 flex-col gap-1.5">
									{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
									<label className="text-muted-foreground text-xs">
										Custom End Date
									</label>
									<Input
										type="date"
										value={
											cellTransformation.parameters
												.endCustomDate
										}
										onChange={(e) =>
											dispatch(
												"parameters.transformation.parameters.endCustomDate",
												e.target.value,
											)
										}
									/>
								</div>
							)}
						</div>

						{/* Unit */}
						<Select
							disabled={!doesFrameExist}
							value={cellTransformation.parameters.unit as string}
							onValueChange={(val) =>
								dispatch(
									"parameters.transformation.parameters.unit",
									val,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Unit of Measure" />
							</SelectTrigger>
							<SelectContent>
								{dateUnitTypes.map((u) => (
									<SelectItem
										key={String(u)}
										value={String(u)}
									>
										{String(u)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-1.5">
						{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
						<label className="text-muted-foreground text-xs">
							Column Name
						</label>
						<Input
							value={cellTransformation.parameters.columnName}
							onChange={(e) =>
								dispatch(
									"parameters.transformation.parameters.columnName",
									e.target.value,
								)
							}
						/>
					</div>
				</div>
			</TransformationCellInput>
		);
	});
