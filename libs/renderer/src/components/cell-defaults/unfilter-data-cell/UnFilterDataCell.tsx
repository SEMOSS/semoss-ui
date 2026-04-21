import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
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
	type CellDef,
	type CellState,
} from "../../../store";
import type { QueryImportCellDef } from "../query-import-cell";
import type { TransformationTargetCell } from "../shared";

export interface UnFilterDataCellDef extends CellDef<"unfilter-data"> {
	widget: "unfilter-data";
	parameters: {
		frameName: string;
		unfilterQuery: string;
		targetCell: TransformationTargetCell;
	};
}

export const UnFilterDataCell: CellComponent<UnFilterDataCellDef> = observer(
	(props) => {
		const { cell } = props;
		const { state } = useBlocks();
		const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
		const [framelist, setFramelist] = useState([]);
		const myDbs =
			usePixel<{ app_id: string; app_name: string }[]>(`GetFrames();`);

		useEffect(() => {
			if (myDbs.status !== "SUCCESS") return;
			handleFrame();
			setSelectedFrame(cell.parameters.frameName);
		}, [myDbs.status]);

		const targetCell: CellState<QueryImportCellDef> = computed(() => {
			let c: CellState<QueryImportCellDef> | undefined;
			let cellId: number | null = null;

			Object.values(state.queries).forEach((query) => {
				Object.entries(query.cells).forEach(([key, value]) => {
					const parsedId =
						value.parameters?.frameVariableName || null;
					if (cellId || parsedId === null) return;

					const target = (parsedId as string)?.match(/\d+/);
					const targetID = target ? target[0] : null;
					if (
						targetID &&
						Number(targetID) ===
							Number(cell.parameters.targetCell.id) &&
						cellId === null
					) {
						cellId = parseInt(key, 10);
					}
				});

				if (query.cells[cell.parameters.targetCell.id]) {
					c = query.cells[
						cell.parameters.targetCell.id
					] as CellState<QueryImportCellDef>;
				}

				if (!query.cells[cell.parameters.targetCell.id] && cellId) {
					c = query.cells[cellId] as CellState<QueryImportCellDef>;
				}
				cellId = null;
			});

			return c;
		}).get();

		const doesFrameExist: boolean = computed(() => {
			return (
				!!targetCell && (targetCell.isExecuted || !!targetCell.output)
			);
		}).get();

		useEffect(() => {
			if (doesFrameExist && targetCell.isExecuted !== undefined) {
				handleFrame();
			}
		}, [targetCell?.isExecuted, doesFrameExist, selectedFrame]);

		async function handleFrame() {
			const getFrames = await state.runSideEffect("GetFrames();");
			const list = getFrames.pixelReturn[0].output as string[];
			if (list.length > 0) {
				setFramelist((_prev) => [...list]);
			}
		}

		async function handleFrameSelected(frameSelected: string) {
			setSelectedFrame(frameSelected);
			const target = frameSelected.match(/\d+/);
			const targetID = target ? parseInt(target[0], 10) : null;
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.frameName",
					value: frameSelected,
				},
			});
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.targetCell",
					value: {
						id: targetID,
						frameVariableName: frameSelected,
					},
				},
			});
		}

		const helpText =
			!doesFrameExist && cell.parameters.targetCell.id
				? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying filter.`
				: "";

		return (
			<div className="relative flex w-full flex-col gap-2">
				<div className="pr-2.5 pb-5 pl-5">
					<Select
						disabled={cell.isLoading}
						value={selectedFrame ?? ""}
						onValueChange={(val) => handleFrameSelected(val)}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select Frame" />
						</SelectTrigger>
						<SelectContent>
							{framelist.map((f) => (
								<SelectItem key={f} value={f}>
									{f}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{helpText && (
					<div className="w-full py-1.5">
						<span className="text-xs italic">{helpText}</span>
					</div>
				)}
			</div>
		);
	},
);
