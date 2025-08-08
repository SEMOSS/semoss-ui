import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { Autocomplete, Stack, styled, TextField, Typography } from "@semoss/ui";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
	type CellState,
} from "../../../store";
import type { QueryImportCellDef } from "../query-import-cell";
import type { TransformationTargetCell } from "../shared";

const StyledContent = styled("div")(({ theme }) => ({
	position: "relative",
	width: "100%",
}));
const EmptyContainer = styled("div")(() => ({
	paddingBottom: "20px",
	paddingLeft: "20px",
	paddingRight: "10px",
}));
export interface UnFilterDataCellDef extends CellDef<"unfilter-data"> {
	widget: "unfilter-data";
	parameters: {
		/** Ouput variable name */
		frameName: string;
		/** Select query rendered in the cell */
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
			if (myDbs.status !== "SUCCESS") {
				return;
			}
			handleFrame();
			setSelectedFrame(cell.parameters.frameName);
		}, [myDbs.status]);

		/**
		 *
		 */
		const targetCell: CellState<QueryImportCellDef> = computed(() => {
			let c;
			let cellId: number | null = null;

			Object.values(state.queries).forEach((query) => {
				Object.entries(query.cells).forEach(
					([key, value], cellIndex) => {
						const parsedId =
							value["parameters"]?.["frameVariableName"] || null;
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
					},
				);

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

		/**
		 * Determines if Target Cell is a frame and is executed
		 */
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
			const list = getFrames["pixelReturn"][0]["output"] as string[];
			if (list.length > 0) {
				setFramelist((prev) => [...list]);
			}
		}
		async function handleFrameSelected(frameSelected) {
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
			<StyledContent>
				<Stack direction="column" spacing={1}>
					<EmptyContainer>
						<Autocomplete
							label="Frame"
							fullWidth
							multiple={false}
							disabled={cell.isLoading}
							value={selectedFrame}
							options={framelist}
							getOptionLabel={(option) => {
								return option;
							}}
							onChange={(e, value) => {
								handleFrameSelected(value);
							}}
							freeSolo={false}
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder="Select Frame"
									size="small"
									variant="outlined"
								/>
							)}
						/>
					</EmptyContainer>
					<Stack width="100%" paddingY={0.75}>
						<Typography variant="caption">
							<em>{helpText}</em>
						</Typography>
					</Stack>
				</Stack>
			</StyledContent>
		);
	},
);
