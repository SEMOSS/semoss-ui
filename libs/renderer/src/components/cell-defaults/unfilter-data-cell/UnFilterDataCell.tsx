import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";
import { styled, TextField, Stack, Autocomplete, Typography } from "@semoss/ui";
import { usePixel } from "@semoss/sdk/react";
import { QueryImportCellDef } from "../query-import-cell";
import { TransformationTargetCell } from "../shared";
import { BaseSettingSection } from "../../../components/block-settings/BaseSettingSection";
import {
    ActionMessages,
    CellComponent,
    CellDef,
    CellState,
} from "../../../store";
import { useBlocks } from "../../../hooks";

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
        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            let c;
            Object.values(state.queries).forEach((query) => {
                if (query.cells[cell.parameters.targetCell.id]) {
                    c = query.cells[
                        cell.parameters.targetCell.id
                    ] as CellState<QueryImportCellDef>;
                }
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
        }, [targetCell?.isExecuted, doesFrameExist]);
        async function handleFrame() {
            const getFrames = await state.runSideEffect("GetFrames();");
            let list = getFrames["pixelReturn"][0]["output"] as string[];
            if (list.length > 0) {
                setFramelist((prev) => [...list]);
            }
        }
        async function handleFrameSelected(frameSelected) {
            setSelectedFrame(frameSelected);
            let target = frameSelected.match(/\d+/);
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
                        <BaseSettingSection label="Frame">
                            <Autocomplete
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
                        </BaseSettingSection>
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
