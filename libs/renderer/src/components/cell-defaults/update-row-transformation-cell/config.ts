import type { CellConfig } from "../../../store";
import {
	UpdateRowTransformationCell,
	type UpdateRowTransformationCellDef,
} from "./update-row-transformation-cell";

export const UpdateRowTransformationCellConfig: CellConfig<UpdateRowTransformationCellDef> =
	{
		name: "Update Row",
		widget: "update-row-transformation",
		view: UpdateRowTransformationCell,
		parameters: {
			transformation: {
				key: "update-row",
				parameters: {
					compareColumn: {
						name: "",
						dataType: "",
					},
					compareOperation: "==",
					compareValue: "",
					targetColumn: {
						name: "",
						dataType: "",
					},
					targetValue: "",
				},
			},
			targetCell: {
				id: "",
				frameVariableName: "",
			},
		},

		toPixel: ({ transformation, targetCell }) => {
			return `${targetCell.frameVariableName} | UpdateRowValues (${transformation.parameters.targetColumn?.name}, ${transformation.parameters.targetValue}, Filter (${transformation.parameters.compareColumn?.name} ${transformation.parameters.compareOperation} ${transformation.parameters.compareValue}))`;
		},
	};
