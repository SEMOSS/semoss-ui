import { PlayCircle } from "lucide-react";
import { computed } from "mobx";
import { Button } from "@semoss/ui/next";
import { useBlocks } from "../../../../hooks";
import { ActionMessages, type CellState } from "../../../../store";
import type { QueryImportCellDef } from "../../query-import-cell";
import type { TransformationCellDef } from "./transformation.types";

export const TransformationCellRunActionButton = (props: {
	cell: CellState<TransformationCellDef>;
	isExpanded?: boolean;
}) => {
	const { cell } = props;
	const { state } = useBlocks();

	const targetCell: CellState<QueryImportCellDef> = computed(() => {
		return cell.query.cells[
			cell.parameters.targetCell.id
		] as CellState<QueryImportCellDef>;
	}).get();

	const doesFrameExist: boolean = computed(() => {
		return !!targetCell && (targetCell.isExecuted || !!targetCell.output);
	}).get();

	const checkFieldsValid = (object: object): undefined | boolean => {
		for (const value of Object.values(object)) {
			console.log(object);
			if (!Array.isArray(value) && typeof value === "object") {
				return checkFieldsValid(value);
			} else if (!value || (Array.isArray(value) && !value.length)) {
				return false;
			}
		}
	};

	const hasRequiredFields: boolean = computed(() => {
		return (
			checkFieldsValid(cell.parameters.transformation.parameters) !==
			false
		);
	}).get();

	return (
		<Button
			title="Run cell"
			variant="ghost"
			size="icon-sm"
			disabled={cell.isLoading || !doesFrameExist || !hasRequiredFields}
			onClick={() =>
				state.dispatch({
					message: ActionMessages.RUN_CELL,
					payload: {
						queryId: cell.query.id,
						cellId: cell.id,
					},
				})
			}
		>
			<PlayCircle className="size-4" />
		</Button>
	);
};
