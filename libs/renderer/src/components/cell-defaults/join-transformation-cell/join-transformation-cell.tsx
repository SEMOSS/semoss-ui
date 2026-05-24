import { ArrowLeftFromLine, ArrowRightFromLine, Merge } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import type React from "react";
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
	type comparator,
	comparators,
	type joinType,
	joinTypes,
	MultiCellColumnTransformationField,
	type Transformation,
	type TransformationDef,
	type TransformationMultiCellDef,
	TransformationMultiCellInput,
	Transformations,
	type TransformationTargetCell,
} from "../shared";

export interface JoinTransformationDef extends TransformationDef<"join"> {
	key: "join";
	parameters: {
		fromNameColumn: ColumnInfo;
		toNameColumn: ColumnInfo;
		joinType: joinType;
		compareOperation: comparator;
	};
}

export interface JoinTransformationCellDef
	extends TransformationMultiCellDef<"join-transformation"> {
	widget: "join-transformation";
	parameters: {
		transformation: Transformation<JoinTransformationDef>;
		fromTargetCell: TransformationTargetCell;
		toTargetCell: TransformationTargetCell;
	};
}

const iconMapping: { [key: string]: React.ReactNode } = {
	"Full Join": <Merge className="size-4" />,
	"Inner Join": <Merge className="size-4" />,
	"Left Join": <ArrowLeftFromLine className="size-4" />,
	"Right Join": <ArrowRightFromLine className="size-4" />,
};

export const JoinTransformationCell: CellComponent<JoinTransformationCellDef> =
	observer((props) => {
		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const cellTransformation: Transformation<JoinTransformationDef> =
			computed(() => {
				return cell.parameters
					.transformation as Transformation<JoinTransformationDef>;
			}).get();

		const frames = useMemo(() => {
			return Object.values(cell.query.cells).filter(
				(c) =>
					c.widget === "query-import" || c.widget === "data-import",
			);
		}, []);

		const targetCells: CellState<QueryImportCellDef>[] = computed(() => {
			return frames.filter(
				(item) =>
					item.widget === "query-import" ||
					item.widget === "data-import",
			) as CellState<QueryImportCellDef>[];
		}).get();

		const doFramesExist: boolean = computed(() => {
			let count = 0;
			for (const item of targetCells) {
				if (!!item && (item.isExecuted || !!item.output)) count++;
			}
			return count >= 2;
		}).get();

		const helpText =
			frames.length < 2
				? "Run at least two Query import Cells to define the target frame variables before applying a transformation."
				: "At least two Python / R target frame variables must be defined in order to apply the join transformation.";

		if (!doFramesExist && cellTransformation.parameters.fromNameColumn) {
			return (
				<TransformationMultiCellInput
					isExpanded={isExpanded}
					display={Transformations[cellTransformation.key].display}
					Icon={Transformations[cellTransformation.key].icon}
					frame={{ cell, options: frames }}
				>
					<div className="w-full py-1.5">
						<span className="text-xs italic">{helpText}</span>
					</div>
				</TransformationMultiCellInput>
			);
		}

		const currentJoinType = cellTransformation.parameters.joinType;
		const currentJoinName = currentJoinType?.name ?? "";

		return (
			<TransformationMultiCellInput
				isExpanded={isExpanded}
				display={Transformations[cellTransformation.key].display}
				Icon={Transformations[cellTransformation.key].icon}
				frame={{ cell, options: frames }}
			>
				<div className="flex flex-col gap-4">
					<span className="text-xs">
						{!doFramesExist ? (
							<em>{helpText}</em>
						) : (
							"Select columns from each table. Specify how you want to join the columns."
						)}
					</span>

					<div className="flex w-full flex-col gap-4">
						<p className="font-medium text-sm">
							From:{" "}
							{cell.parameters.fromTargetCell.frameVariableName}
						</p>
						<MultiCellColumnTransformationField
							disabled={!doFramesExist}
							cell={cell}
							cellTarget={cell.parameters.fromTargetCell}
							selectedColumns={
								cellTransformation.parameters
									.fromNameColumn ?? {
									name: "",
									dataType: "",
								}
							}
							onChange={(newColumn: ColumnInfo) => {
								state.dispatch({
									message: ActionMessages.UPDATE_CELL,
									payload: {
										queryId: cell.query.id,
										cellId: cell.id,
										path: "parameters.transformation.parameters.fromNameColumn",
										value: newColumn,
									},
								});
							}}
							label="Name of Columns"
						/>
						<p className="font-medium text-sm">
							To: {cell.parameters.toTargetCell.frameVariableName}
						</p>
						<MultiCellColumnTransformationField
							disabled={!doFramesExist}
							cell={cell}
							cellTarget={cell.parameters.toTargetCell}
							selectedColumns={
								cellTransformation.parameters.toNameColumn ?? {
									name: "",
									dataType: "",
								}
							}
							onChange={(newColumn: ColumnInfo) => {
								state.dispatch({
									message: ActionMessages.UPDATE_CELL,
									payload: {
										queryId: cell.query.id,
										cellId: cell.id,
										path: "parameters.transformation.parameters.toNameColumn",
										value: newColumn,
									},
								});
							}}
							label="Name of Columns"
						/>
						<p className="font-medium text-sm">Type of Join:</p>
						<Select
							disabled={!doFramesExist}
							value={currentJoinName}
							onValueChange={(val) => {
								const found = joinTypes.find(
									(j) => j.name === val,
								);
								state.dispatch({
									message: ActionMessages.UPDATE_CELL,
									payload: {
										queryId: cell.query.id,
										cellId: cell.id,
										path: "parameters.transformation.parameters.joinType",
										value: found,
									},
								});
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Join Type" />
							</SelectTrigger>
							<SelectContent>
								{joinTypes.map((jt) => (
									<SelectItem key={jt.name} value={jt.name}>
										<div className="flex items-center gap-2">
											{iconMapping[jt.name]}
											<span>{jt.name}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="font-medium text-sm">Comparator:</p>
						<Select
							disabled={!doFramesExist}
							value={
								cellTransformation.parameters
									.compareOperation as string
							}
							onValueChange={(val) => {
								state.dispatch({
									message: ActionMessages.UPDATE_CELL,
									payload: {
										queryId: cell.query.id,
										cellId: cell.id,
										path: "parameters.transformation.parameters.compareOperation",
										value: val,
									},
								});
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Operation" />
							</SelectTrigger>
							<SelectContent>
								{comparators.map((c) => (
									<SelectItem
										key={String(c)}
										value={String(c)}
									>
										{String(c)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</TransformationMultiCellInput>
		);
	});
