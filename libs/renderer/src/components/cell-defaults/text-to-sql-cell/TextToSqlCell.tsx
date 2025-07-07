import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { ActionMessages, CellComponent, CellDef } from "../../../store";
import { TransformationTargetCell } from "../shared";
import {
    styled,
    Button,
    Select,
    Stack,
    Autocomplete,
    TextField,
    InputAdornment,
    Typography,
} from "@semoss/ui";
import { useBlocks } from "../../../hooks";
import {
    CropFree,
    DriveFileRenameOutlineRounded,
    KeyboardArrowDown,
} from "@mui/icons-material";
import { runPixel, runPixelAsync, usePixel } from "@semoss/sdk/react";
import { BaseSettingSection } from "../../../components/block-settings";

const StyledContent = styled("div")(({ theme }) => ({
    position: "relative",
    width: "100%",
}));

const StyledSelect = styled(Select)(({ theme }) => ({
    "& .MuiInputBase-root": {
        padding: "0px 12px",
        height: "40px",
    },
    "& .MuiSelect-select": {
        color: theme.palette.text.secondary,
        display: "flex",
        gap: theme.spacing(1),
        alignItems: "center",
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        "&:focus": {
            backgroundColor: "inherit !important",
        },
    },
}));

const StyledSelectItem = styled(Select.Item)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(1),
    color: theme.palette.text.secondary,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    "& .MuiInputBase-root": {
        color: theme.palette.text.secondary,
        display: "flex",
        gap: theme.spacing(1),
        height: "40px",
        // width: "200px",
        padding: "0px 12px",
    },
}));

const StyledUserTextField = styled(TextField)(({ theme }) => ({
    "&.MuiFormControl-root": {
        overflow: "scroll",
        height: "auto",
        "> .MuiInputBase-root": {
            display: "flex",
            padding: "0px 12px",
            alignItems: "flex-start",
            flex: "1 0 0",
            alignSelf: "stretch",
            borderRadius: "8px",
            border: "1px solid  #22A4FF",
            background: "#fff",
        },
        "> .MuiInputBase-root:hover": {
            border: "1px solid  #22A4FF",
            background: "#fff",
        },
        " > .MuiInputBase-root > textarea": {
            padding: "8px 0px",
        },
    },
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontFeatureettings: "'liga' off, 'clig' off",
}));
const StyledTypographySection = styled("div")(({}) => ({
    display: "flex",
    gap: "4px",
    alignItems: "center",
    justifyContent: "flex-start",
}));
const StyledNumberSection = styled("div")(({}) => ({
    display: "flex",
    gap: "4px",
    alignItems: "center",
    justifyContent: "flex-start",
}));

const SvgTextFieldsIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
        >
            <path
                d="M2.08594 4.58594C2.08594 5.2776 2.64427 5.83594 3.33594 5.83594H6.2526V14.5859C6.2526 15.2776 6.81094 15.8359 7.5026 15.8359C8.19427 15.8359 8.7526 15.2776 8.7526 14.5859V5.83594H11.6693C12.3609 5.83594 12.9193 5.2776 12.9193 4.58594C12.9193 3.89427 12.3609 3.33594 11.6693 3.33594H3.33594C2.64427 3.33594 2.08594 3.89427 2.08594 4.58594ZM16.6693 7.5026H11.6693C10.9776 7.5026 10.4193 8.06094 10.4193 8.7526C10.4193 9.44427 10.9776 10.0026 11.6693 10.0026H12.9193V14.5859C12.9193 15.2776 13.4776 15.8359 14.1693 15.8359C14.8609 15.8359 15.4193 15.2776 15.4193 14.5859V10.0026H16.6693C17.3609 10.0026 17.9193 9.44427 17.9193 8.7526C17.9193 8.06094 17.3609 7.5026 16.6693 7.5026Z"
                fill="black"
                fill-opacity="0.54"
            />
        </svg>
    );
};

export interface TextToSqlCellDef extends CellDef<"text-to-sql"> {
    widget: "text-to-sql";
    parameters: {
        /** Database associated with the cell */
        databaseId: string;

        /** Output frame type */
        userQuery: string;

        /** Ouput variable name */
        frameVariableName: string;
        /* Data frame with values */
        dataFrameId: string;
        /** Data frame query */
        dataFrameQuery: string;

        /** Select query rendered in the cell */
        model: string;
        targetCell: TransformationTargetCell;
    };
}

const TextToSqlCell: CellComponent<TextToSqlCellDef> = observer((props) => {
    const { cell, isExpanded } = props;
    const { state } = useBlocks();
    const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
        loading: true,
        ids: [],
        display: {},
    });
    const [framelist, setFramelist] = useState([]);
    const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
    const [databaseDetails, setDatabaseDetails] = useState({
        dbName: "",
        dbId: "",
    });
    const [modelDetail, setModelDetail] = useState<{
        loading: boolean;
        modelData: any[];
        selectedModel: string;
    }>({
        loading: true,
        modelData: [],
        selectedModel: "",
    });
    const [generatedSQL, setGeneratedSQL] = useState("");
    const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
        `MyEngines(engineTypes=['DATABASE']);`,
    );
    const [cellIdData, setCellIdData] = useState(cell.id);
    console.log(cellIdData, cell.id, 'cellIdData');
    useEffect(() => {
        if (myDbs.status !== "SUCCESS") {
            return;
        }

        const dbIds: string[] = [];
        const dbDisplay = {};
        myDbs.data.forEach((db) => {
            dbIds.push(db.app_id);
            dbDisplay[db.app_id] = db.app_name;
        });
        setCfgLibraryDatabases({
            loading: false,
            ids: dbIds,
            display: dbDisplay,
        });
        if (!cell.parameters.databaseId && dbIds.length) {
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: "parameters.databaseId",
                    value: dbIds[0],
                },
            });
            setDatabaseDetails((prev) => {
                return {
                    dbId: dbIds[0],
                    dbName: dbDisplay[dbIds[0]],
                };
            });
            setDatabaseDetails((prevDatabaseDetails)=>{
                return {
                    ...prevDatabaseDetails,
                    dbId: dbIds[0],
                    dbName: dbDisplay[dbIds[0]],
                };
            });
            runFrameCreationQuery({
                    dbId: dbIds[0],
                    dbName: dbDisplay[dbIds[0]],
                });
        }
        const getMyModels = async () => {
            const myModels = await state.runSideEffect(
                `MyEngines(engineTypes=['MODEL']);`,
            );
            const modelsData: any = myModels.pixelReturn[0].output;
            console.log(modelsData, "ModelsData");
            setModelDetail({
                loading: false,
                modelData: modelsData,
                selectedModel: modelsData[0].app_id,
            });
        };
        getMyModels();
    }, [myDbs.status, myDbs.data]);
    const runFrameCreationQuery = async (databaseDetails)=>{
            if (!databaseDetails.dbId || !databaseDetails.dbName) {
                return;
            }
            let columnNames = [],
                columnAlias = [];
            let dataCols = await runPixel(
                `META|GetDatabaseTableStructure(database=["${databaseDetails.dbId}"]);META|GetDatabaseMetamodel( database=[ "${databaseDetails.dbId}" ], options=["dataTypes","positions"])`,
            ).then((res) => {
                let output: any = res.pixelReturn[0]?.output || [];
                output.forEach((item, index) => {
                    columnAlias.push(item[4]);
                });
                let metaModelOutput :any = res.pixelReturn[1]?.output || [];
                if(metaModelOutput.hasOwnProperty('dataTypes')){
                    columnNames = Object.keys(metaModelOutput.dataTypes) || [];
                }
            });
            let gridQuery = cell.parameters.dataFrameQuery ? `Query("<encode>${cell.parameters.dataFrameQuery}</encode>")` : (
                columnNames.length > 0 ? ( "Select ("+columnNames.join(",")+") .as (["+columnAlias.join(",")+"])" ): `Query("<encode>SELECT * FROM ${databaseDetails.dbName}</encode>")`
            );
            const insightId = state.insightId;
            let query = `Database( database=["${databaseDetails.dbId}"] ) | ${gridQuery} | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "${cell.parameters.frameVariableName}" ] ) ] )`;
            runPixel(query, insightId).then((res) => {
                let query1 = `Frame(frame=[${cell.parameters.frameVariableName}]) | QueryAll()|Limit(20)|CollectAll();`;
                runPixel(query1, insightId).then((res1) => {
                    console.log("queryresult", res1);
                });
            });
    };
    useEffect(()=>{
        // runFrameCreationQuery(databaseDetails);
    }, [cell.parameters.dataFrameQuery, cell.parameters.dataFrameId]);
    useEffect(()=>{
        if(cell.isSuccessful){
            let output = (cell.output as any)?.output || {};
            if(output.hasOwnProperty('Query')){
                state.dispatch({
                    message: ActionMessages.UPDATE_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                        path: "parameters.dataFrameId",
                        value: output.frame,
                    },
                });
                state.dispatch({
                    message: ActionMessages.UPDATE_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                        path: "parameters.dataFrameQuery",
                        value: output.Query,
                    },
                });
                state.dispatch({
                    message: ActionMessages.RUN_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                    },
                });
            }
        }
    },[cell.isExecuted, cell.isLoading, cell.isSuccessful]);

    return (
        <StyledContent>
            <Stack direction="column" spacing={1}>
                {isExpanded && (
                    <Stack direction={"column"}>
                        <Stack direction="row" justifyContent={"space-between"}>
                            <StyledSelect
                                size={"small"}
                                variant="standard"
                                disabled={cell.isLoading}
                                title={"Select Database"}
                                value={cell.parameters.databaseId}
                                SelectProps={{
                                    IconComponent: KeyboardArrowDown,
                                }}
                                InputProps={{
                                    disableUnderline: true,
                                }}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    state.dispatch({
                                        message: ActionMessages.UPDATE_CELL,
                                        payload: {
                                            queryId: cell.query.id,
                                            cellId: cell.id,
                                            path: "parameters.databaseId",
                                            value: value,
                                        },
                                    });
                                }}
                            >
                                {Array.from(
                                    cfgLibraryDatabases.ids,
                                    (databaseId, i) => (
                                        <StyledSelectItem
                                            key={`${i}-${cell.id}-${databaseId}`}
                                            value={databaseId}
                                        >
                                            {cfgLibraryDatabases.display[
                                                databaseId
                                            ] ?? ""}
                                        </StyledSelectItem>
                                    ),
                                )}
                            </StyledSelect>
                        </Stack>
                    </Stack>
                )}
                {isExpanded && (
                    <Stack
                        display={"flex"}
                        flexDirection={"row"}
                        gap={"8px"}
                        style={{
                            background: " #EBF4FE",
                        }}
                    >
                        <StyledNumberSection>1</StyledNumberSection>
                        <Stack
                            display={"flex"}
                            flexDirection={"column"}
                            gap={"8px"}
                            width={"100%"}
                        >
                            <StyledTypographySection>
                                <StyledTypography variant="body2">
                                    Type your query in natural language
                                </StyledTypography>
                                <SvgTextFieldsIcon />
                            </StyledTypographySection>
                            <StyledUserTextField
                                fullWidth
                                placeholder="Type your question or request for data"
                                value={cell.parameters.userQuery}
                                disabled={cell.isLoading}
                                multiline
                                rows={4}
                                onChange={(e) => {
                                    if(cell.parameters.dataFrameId !== '' && cell.parameters.dataFrameQuery !== ''){
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: "parameters.dataFrameId",
                                                value: '',
                                            },
                                        });
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: "parameters.dataFrameQuery",
                                                value: '',
                                            },
                                        });
                                    }
                                    state.dispatch({
                                        message: ActionMessages.UPDATE_CELL,
                                        payload: {
                                            queryId: cell.query.id,
                                            cellId: cell.id,
                                            path: "parameters.userQuery",
                                            value: e.target.value,
                                        },
                                    });
                                }}
                            />
                        </Stack>
                    </Stack>
                )}
                {isExpanded && (
                    <Stack
                        direction="row"
                        alignItems={"center"}
                        justifyContent={"flex-start"}
                        gap={"16px"}
                        padding={"0px 16px"}
                    >
                        <StyledTextField
                            title="Set Frame Variable Name"
                            size="medium"
                            value={cell.parameters.frameVariableName}
                            disabled={cell.isLoading}
                            InputProps={{
                                startAdornment: (
                                    <DriveFileRenameOutlineRounded />
                                ),
                            }}
                            onChange={(e) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: "parameters.frameVariableName",
                                        value: e.target.value,
                                    },
                                });
                            }}
                        />
                        <StyledSelect
                            fullWidth
                            size={"medium"}
                            disabled={cell.isLoading}
                            title={"Select Model"}
                            value={cell.parameters.model}
                            SelectProps={{
                                IconComponent: KeyboardArrowDown,
                                style: {
                                    height: "40px",
                                    width: "240px",
                                },
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CropFree />
                                    </InputAdornment>
                                ),
                            }}
                            onChange={(e) => {
                                const value = e.target.value;
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: "parameters.model",
                                        value: value,
                                    },
                                });
                            }}
                        >
                            {modelDetail.modelData.length > 0 &&
                                modelDetail.modelData.map((model, key) => (
                                    <StyledSelectItem
                                        key={
                                            model.database_id?.split("-")
                                                ?.length > 0
                                                ? model.database_id
                                                      .split("-")
                                                      .reverse()
                                                      .slice(0, 2)
                                                      .join("-") + key
                                                : key
                                        }
                                        value={model.database_id}
                                    >
                                        {model.app_name}
                                    </StyledSelectItem>
                                ))}
                        </StyledSelect>
                    </Stack>
                )}
            </Stack>
        </StyledContent>
    );
});

export default TextToSqlCell;