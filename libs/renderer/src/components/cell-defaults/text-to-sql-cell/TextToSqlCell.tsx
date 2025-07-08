import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
    CropFree,
    DriveFileRenameOutlineRounded,
    KeyboardArrowDown,
} from "@mui/icons-material";
import {
    styled,
    Select,
    Stack,
    TextField,
    InputAdornment,
    Typography,
} from "@semoss/ui";
import { ActionMessages, CellComponent, CellDef } from "../../../store";
import { TransformationTargetCell } from "../shared";
import { useBlocks } from "../../../hooks";

const StyledContent = styled("div")(({ theme }) => ({
    position: "relative",
    width: "100%",
}));
/**
 * Styled select component for the database selection
 */
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
/**
 * Styled select Item component for the database selection
 */
const StyledSelectItem = styled(Select.Item)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(1),
    color: theme.palette.text.secondary,
}));
/**
 * Styled text field component for the frame variable
 */
const StyledTextField = styled(TextField)(({ theme }) => ({
    "& .MuiInputBase-root": {
        color: theme.palette.text.secondary,
        display: "flex",
        gap: theme.spacing(1),
        height: "40px",
        padding: "0px 12px",
    },
}));
/**
 * Styled text field component for the SQL query input
 */
const StyledSQLTextField = styled(TextField)(({ theme }) => ({
    "& .MuiInputBase-root": {
        color: theme.palette.text.secondary,
        display: "flex",
        gap: theme.spacing(1),
        padding: "0px 12px",
        borderRadius: "8px",
        border: "1px solid  #C4C4C4",
    },
    "& .MuiInputBase-root > textarea": {
        padding: "8px 0px",
        background: theme.palette.background.paper,
    },
}));
/**
 * Styled text field component for user defined input text
 */
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
            border: `1px solid  ${theme.palette.info.light}`,
            background: theme.palette.background.paper,
        },
        "> .MuiInputBase-root:hover": {
            border: `1px solid  ${theme.palette.info.main}`,
            background: theme.palette.background.paper,
        },
        " > .MuiInputBase-root > textarea": {
            padding: "8px 0px",
        },
    },
}));
/**
 * Styled typography component for displaying text with custom styling
 */
const StyledTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontFeatureettings: "'liga' off, 'clig' off",
}));
/**
 * Wrapper for typography field
 */
const StyledTypographySection = styled("div")(({}) => ({
    display: "flex",
    gap: "4px",
    alignItems: "center",
    justifyContent: "flex-start",
}));
/**
 * Styled number section
 */
const StyledNumberSection = styled("div")(({}) => ({
    display: "flex",
    gap: "4px",
    alignItems: "center",
    justifyContent: "flex-start",
}));

/**
 * A text fields icon, used for the text-to-sql cell.
 */
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
        /** Database ID associated with the cell */
        databaseId: string;

        /** User query for the SQL generation */
        userQuery: string;

        /** Output variable name for the frame */
        frameVariableName: string;

        /** Identifier for the data frame */
        dataFrameId: string;

        /** Query for the data frame */
        dataFrameQuery: string;

        /** Model used for generating SQL */
        model: string;

        /** Target cell for storing the output */
        targetCell: TransformationTargetCell;
    };
}
/** Text to sql cell takes databases list and runs the user defined input and returns result of the user query with Generated SQL */
const TextToSqlCell: CellComponent<TextToSqlCellDef> = observer((props) => {
    const { cell, isExpanded } = props;
    const { state } = useBlocks();
    const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
        loading: true,
        ids: [],
        display: {},
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
    /**
     * Fetches the list of databases from the user's engine list
     */
    const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
        `MyEngines(engineTypes=['DATABASE']);`,
    );
    /**
     * Runs the frame creation query when the database list is loaded
     * and sets the database list in the state.
     * If no database is selected, it selects the first available database.
     */
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
        }
        // Run the frame creation query with the first/selected database when the component mounts
        runFrameCreationQuery({
            dbId: dbIds[0],
            dbName:
                dbDisplay?.[cell.parameters.databaseId] || dbDisplay[dbIds[0]],
        });
        /**
         * Retrieves a list of models from the user's engine list
         * and populates the model detail state with the first model's id
         */
        const getMyModels = async () => {
            const myModels = await state.runSideEffect(
                `MyEngines(engineTypes=['MODEL']);`,
            );
            const modelsData: any = myModels.pixelReturn[0].output;
            setModelDetail({
                loading: false,
                modelData: modelsData,
                selectedModel: modelsData[0].app_id,
            });
        };
        getMyModels();
    }, [myDbs.status, myDbs.data]);
    /**
     * Runs the frame creation query with the selected database
     * Retrieves the column names and data types for the selected database
     * and creates a query to create a frame with the column names for the frame variable name
     * @param {Object} databaseDetails - an object containing the selected database's id and name
     */
    const runFrameCreationQuery = async (databaseDetails) => {
        if (!databaseDetails.dbId || !databaseDetails.dbName) {
            return;
        }
        removeDynamicFrameAndQuery();
        let columnNames = [],
            columnAlias = [];
        await runPixel(
            `META|GetDatabaseTableStructure(database=["${databaseDetails.dbId}"]);META|GetDatabaseMetamodel( database=[ "${databaseDetails.dbId}" ], options=["dataTypes","positions"])`,
        ).then((res) => {
            let output: any = res.pixelReturn[0]?.output || [];
            output.forEach((item, index) => {
                columnAlias.push(item[4]);
            });
            let metaModelOutput: any = res.pixelReturn[1]?.output || [];
            if (metaModelOutput.hasOwnProperty("dataTypes")) {
                columnNames = Object.keys(metaModelOutput.dataTypes) || [];
            }
        });
        let gridQuery =
            columnNames.length > 0
                ? "Select (" +
                  columnNames.join(",") +
                  ") .as ([" +
                  columnAlias.join(",") +
                  "])"
                : `Query("<encode>SELECT * FROM ${databaseDetails.dbName}</encode>")`;
        const insightId = state.insightId;
        let query = `Database( database=["${databaseDetails.dbId}"] ) | ${gridQuery} | Import ( frame = [ CreateFrame ( frameType = [ GRID ] , override = [ true ] ) .as ( [ "${cell.parameters.frameVariableName}" ] ) ] )`;
        runPixel(query, insightId).then((res) => {});
    };
    /**
     * When NLPQuery3 query run and is successful, this use effect will trigger new Run cell to fetch the data from frame
     */
    useEffect(() => {
        if (cell.isSuccessful) {
            let output = (cell.output as any)?.output || {};
            if (output.hasOwnProperty("Query")) {
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
    }, [cell.isExecuted, cell.isLoading, cell.isSuccessful]);
    /**
     * Remove dynamic frame and query from the cell parameters
     * when the frame creation process is started which is when the user tries to run cell
     * @function
     */
    function removeDynamicFrameAndQuery() {
        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cell.query.id,
                cellId: cell.id,
                path: "parameters.dataFrameId",
                value: "",
            },
        });
        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cell.query.id,
                cellId: cell.id,
                path: "parameters.dataFrameQuery",
                value: "",
            },
        });
    }
    return (
        <StyledContent>
            <Stack direction="column" spacing={1}>
                <Stack direction={"column"}>
                    <Stack direction="row" justifyContent={"space-between"}>
                        <StyledSelect
                            size={"small"}
                            variant="standard"
                            disabled={cell.isLoading}
                            title={"Select Database"}
                            value={cell.parameters.databaseId}
                            data-testid={'user-databaseid-'+cell.id}
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
                                        data-testid={`user-database-${cell.id}-${i}`}
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
                {
                /*
                Show fields when the cell is expanded
                */
                isExpanded && (
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
                                data-testid={`user-query-${cell.id}`}
                                multiline
                                rows={4}
                                onChange={(e) => {
                                    if (
                                        cell.parameters.dataFrameId !== "" &&
                                        cell.parameters.dataFrameQuery !== ""
                                    ) {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: "parameters.dataFrameId",
                                                value: "",
                                            },
                                        });
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: "parameters.dataFrameQuery",
                                                value: "",
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
                {
                /* show fields when the cell is expanded */
                isExpanded && (
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
                            data-testid={`frame-variable-${cell.id}`}
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
                            data-testid={`model-user-${cell.id}`}
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
                                        data-testid={`model-user-item-${cell.id}-${key}`}
                                        value={model.database_id}
                                    >
                                        {model.app_name}
                                    </StyledSelectItem>
                                ))}
                        </StyledSelect>
                    </Stack>
                )}
                {
                /*
                * If the cell is not generated with query yet, then generated SQL text field will not be shown
                */
                isExpanded && cell.parameters.dataFrameQuery && (
                    <Stack>
                        <StyledTypographySection>
                            <StyledTypography variant="body2">
                                Generated SQL
                            </StyledTypography>
                        </StyledTypographySection>
                        <StyledSQLTextField
                            fullWidth
                            size={"small"}
                            variant={"outlined"}
                            placeholder={"Enter SQL query"}
                            value={cell.parameters.dataFrameQuery}
                            data-testid={`generated-sql-${cell.id}`}
                            multiline
                            rows={4}
                            disabled
                        />
                    </Stack>
                )}
            </Stack>
        </StyledContent>
    );
});

export default TextToSqlCell;