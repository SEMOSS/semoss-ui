import {
    CropFree,
    DriveFileRenameOutlineRounded,
    ExpandMore,
    KeyboardArrowDown,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
    Accordion,
    Icon,
    InputAdornment,
    Select,
    Stack,
    styled,
    TextField,
    Typography,
} from "@semoss/ui";
import { TextFields } from "../../../assets/TextFields";
import { useBlocks } from "../../../hooks";
import { ActionMessages, type CellComponent, type CellDef } from "../../../store";
import type { TransformationTargetCell } from "../shared";

const StyledContent = styled("div")(() => ({
    position: "relative",
    width: "100%",
}));
/**
 * Styled select component for the database selection
 */
const StyledDatabaseSelect = styled(Select)(({ theme }) => ({
    "& .MuiInputBase-root": {
        padding: theme.spacing(0,1.5),
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

const StyledModelSelect = styled(Select)<{ required?: boolean }>(({ theme, required }) => ({
    "&.MuiFormControl-root": {
        margin: 0,
        minWidth: "200px",
        maxWidth: "300px",
    },
    "& .MuiInputBase-root": {
        padding: theme.spacing(0,1.5),
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
        padding: theme.spacing(0, 1.5),
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
            padding: theme.spacing(0, 1.5),
            alignItems: "flex-start",
            flex: "1 0 0",
            alignSelf: "stretch",
            borderRadius: theme.spacing(1),
            border: `1px solid  ${theme.palette.info.light}`,
            background: theme.palette.background.paper,
        },
        "> .MuiInputBase-root:hover": {
            border: `1px solid  ${theme.palette.info.main}`,
            background: theme.palette.background.paper,
        },
        " > .MuiInputBase-root > textarea": {
            padding: theme.spacing(1, 0),
        },
    },
}));
/**
 * Styled typography component for displaying text with custom styling
 */
const StyledTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontFeatureSettings: "'liga' off, 'clig' off",
}));
/**
 * Styled typography component for displaying generated sql with custom styling
 */
const StyledGenSQLTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.primary,
    fontFeatureSettings: "'liga' off, 'clig' off",
}));
/**
 * Wrapper for typography field
 */
const StyledTypographySection = styled("div")(({theme}) => ({
    display: "flex",
    gap: theme.spacing(0.5),
    alignItems: "center",
    justifyContent: "flex-start",
}));
/**
 * Styled number section
 */
const StyledNumberSection = styled("div")(({theme}) => ({
    display: "flex",
    gap: theme.spacing(0.5),
    alignItems: "center",
    justifyContent: "flex-start",
}));
/**
 * Styled user input section
 */
const StackUserInputSection = styled(Stack)(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    gap: theme.spacing(1),
    background: theme.palette.primary.selected,
}));
/**
 * Styled user input component
 */
const StackUserInput = styled(Stack)(({theme}) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    width: "100%",
}));
/**
 * Styled stack component for frame and model section
 */
const StackFrameModel = styled(Stack)(({theme}) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: theme.spacing(2),
    padding: theme.spacing(0,2),
}));

const StyledIcon = styled(Icon)(()=>({
    width: "20px", 
    height: "20px"
}));

const StyledExpandMore = styled(ExpandMore)(({theme})=>({
    color: theme.palette.text.secondary,
}));

interface Model{
    database_date_created: string;
    app_type: string;
    app_subtype: string;
    database_name: string;
    low_database_name: string;
    database_favorite: number;
    permission: number;
    database_type: string;
    app_name: string;
    database_id: string;
    database_cost: string;
    domain: string;
    database_discoverable: boolean;
    user_permission: number;
    tag: string[];
    database_global: boolean;
    database_created_by: string;
    app_favorite: number;
    app_id: string;
    database_subtype: string;
    database_created_by_type: string;
    app_cost: string;
};
interface MetaModel{
    edges: string[];
    physicalTypes: Record<string, string>;
    dataTypes: Record<string, string>;
    positions: Record<string, unknown>;
    nodes: unknown[];
    additionalDataTypes: Record<string, unknown>;
}

interface OutputQueryResponse{
  SAMPLE: string;
  Query: string;
  COLUMN_CHANGE: string;
  frameType?: string;
  frame?: string;
};

interface TextToSQLQueryResponse {
  output: OutputQueryResponse;
  operationType: string[];
}

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
        modelData: Model[];
        selectedModel: string;
    }>({
        loading: true,
        modelData: [],
        selectedModel: "",
    });
    /**
     * Fetches the list of databases from the user's engine list
     */
    const dbsList = usePixel<{ app_id: string; app_name: string }[]>(
        `MyEngines(engineTypes=['DATABASE']);`,
    );
    /**
     * Runs the frame creation query when the database list is loaded
     * and sets the database list in the state.
     * If no database is selected, it selects the first available database.
     */
    useEffect(() => {
        if (dbsList.status !== "SUCCESS") {
            return;
        }

        // Prepare database IDs and display mapping
        const dbIds = dbsList.data?.map((db) => db.app_id);
        const dbDisplay = Object.fromEntries(
            dbsList.data?.map((db) => [db.app_id, db.app_name]),
        );

        setCfgLibraryDatabases({
            loading: false,
            ids: dbIds,
            display: dbDisplay,
        });
        if (!cell.parameters.databaseId && dbIds.length) {
            runStateDispatch([{
                path: "parameters.databaseId",
                value: dbIds[0],
            }]);
        }
        // Run the frame creation query with the first/selected database when the component mounts
        runFrameCreationQuery({
            dbId: dbIds[0],
            dbName:
                dbDisplay?.[cell.parameters.databaseId] || dbDisplay[dbIds[0]],
        });
        getMyModels();
    }, [dbsList.status, dbsList.data, cell.parameters.frameVariableName]);
    /**
     * Retrieves a list of models from the user's engine list
     * and populates the model detail state with the first model's id
     */
    const getMyModels = async () => {
        const myModels = await state.runSideEffect(
            `MyEngines(engineTypes=['MODEL']);`,
        );
        const modelsData = myModels.pixelReturn?.[0].output;
        setModelDetail({
            loading: false,
            modelData: modelsData as Model[],
            selectedModel: modelsData?.[0]?.app_id,
        });
    };
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
        let columnNames: string[] = [],
            columnAlias: string[] = [];
        try {
          const res = await runPixel(
            `META|GetDatabaseTableStructure(database=["${databaseDetails.dbId}"]);
             META|GetDatabaseMetamodel(database=["${databaseDetails.dbId}"], options=["dataTypes","positions"])`
          );
          const output = res.pixelReturn[0]?.output || [];
          columnAlias = (output as unknown[]).map((item) => item[4]);

          const metaModelOutput = res.pixelReturn[1]?.output;
          if (
            (metaModelOutput as MetaModel).dataTypes &&
            typeof (metaModelOutput as MetaModel).dataTypes === "object"
          ) {
            columnNames = Object.keys((metaModelOutput as MetaModel).dataTypes);
          }
          //final query to create a frame
          const gridQuery =
            columnNames.length > 0
              ? sanitizeQuery(
                  `Select (${columnNames.join(",")}) .as ([${columnAlias.join(
                    ","
                  )}])`
                )
              : `Query("${sanitizeQuery(
                  `SELECT * FROM ${databaseDetails.dbName}`
                )}")`;

          const insightId = state.insightId;
          const query = `Database(database=["${databaseDetails.dbId}"]) | ${gridQuery} | Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["${cell.parameters.frameVariableName}"])])`;
          await runPixel(query, insightId);
        } catch (error) {
            // Optionally handle/log error
            console.error("Error in runFrameCreationQuery:", error);
        }
    };
    /**
     * When NLPQuery3 query run and is successful, this use effect will trigger new Run cell to fetch the data from frame
     */
    useEffect(() => {
        if (!cell.isSuccessful) return;

        const output = (cell.output as TextToSQLQueryResponse)?.output as OutputQueryResponse || {};
        if (
            !output ||
            typeof output !== "object" ||
            !Object.hasOwn(output, "Query")
        )
            return;

        // Update dataFrameId if present
        if ((output as OutputQueryResponse).frame) {
            runStateDispatch([{
                path: "parameters.dataFrameId",
                value: (output as OutputQueryResponse).frame,
            }]);
        }

        // Update dataFrameQuery if present and valid
        if (typeof (output as OutputQueryResponse).Query === "string") {
            runStateDispatch([{
                path: "parameters.dataFrameQuery",
                value: sanitizeQuery((output as OutputQueryResponse).Query),
            }]);
        }

    }, [cell.isExecuted, cell.isLoading, cell.isSuccessful]);
    /**
     * Remove dynamic frame and query from the cell parameters
     * when the frame creation process is started which is when the user tries to run cell
     * @function
     */
    function removeDynamicFrameAndQuery() {
        const payloadProp = [
            {
                path: "parameters.dataFrameId",
                value: "",
            },
            {
                path: "parameters.dataFrameQuery",
                value: "",
            },
        ]
        runStateDispatch(payloadProp);
    }
    /**
     * Dispatches state updates for multiple cell parameters.
     *
     * @param payloadProps - An array of objects, each containing:
     *   @param queryId - (Optional) The ID of the query associated with the cell. Defaults to the cell's query ID.
     *   @param cellId - (Optional) The ID of the cell to be updated. Defaults to the current cell ID.
     *   @param path - The parameter path within the cell to update.
     *   @param value - The new value to set for the specified parameter path.
     */
    const runStateDispatch = (payloadProps: {queryId?: string; cellId?: string; path: string; value: unknown}[]) => {
        payloadProps.forEach(({ queryId = cell.query.id, cellId = cell.id, path, value }) => {
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: queryId,
                    cellId: cellId,
                    path: path,
                    value: value,
                },
            });
        });
    }

    // Remove script tags and encode angle brackets
    function sanitizeQuery(query: string): string {
        return query
            .replace(/<script.*?>.*?<\/script>/gi, "") // Remove script tags
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, '\\"'); // Escape double quotes
    }
    //update dataFrameId and dataFrameQuery to "" when user tries to type something
    const updateUserInputChange = (e) => {
        let paramsToBeUpdated = [];
        if (
          cell.parameters.dataFrameId !== "" &&
          cell.parameters.dataFrameQuery !== ""
        ) {
          paramsToBeUpdated = [
            {
              queryId: cell.query.id,
              cellId: cell.id,
              path: "parameters.dataFrameId",
              value: "",
            },
            {
              queryId: cell.query.id,
              cellId: cell.id,
              path: "parameters.dataFrameQuery",
              value: "",
            },
          ];
        }
        paramsToBeUpdated.push({
          queryId: cell.query.id,
          cellId: cell.id,
          path: "parameters.userQuery",
          value: e.target.value,
        });
        runStateDispatch(paramsToBeUpdated);
    };
            
    //update databaseId when user tries to change database id
    const updateDatabaseId = (e) => {
        const value = e.target.value;
        runStateDispatch([{
                path: "parameters.databaseId",
                value: value,
            },
        ]);
    };
    //update frameVariableName when user tries to change
    const updateFrameVariableName = (e) => {
        runStateDispatch([{
                path: "parameters.frameVariableName",
                value: e.target.value,
            },
        ]);
    };
    //update model when changes model select field
    const updateModel = (e) => {
        const value = e.target.value;
        runStateDispatch([{
                path: "parameters.model",
                value: value,
            },
        ]);
    };

    return (
      <StyledContent>
        <Stack direction={"column"} spacing={1}>
          <Stack direction={"column"}>
            <Stack direction={"row"} justifyContent={"space-between"}>
              <StyledDatabaseSelect
                size={"small"}
                variant={"standard"}
                disabled={cell.isLoading}
                title={"Select Database"}
                value={cell.parameters.databaseId}
                data-testid={`user-databaseid-${cell.id}`}
                SelectProps={{
                  IconComponent: KeyboardArrowDown,
                }}
                InputProps={{
                  disableUnderline: true,
                }}
                onChange={updateDatabaseId}
              >
                {Array.from(cfgLibraryDatabases.ids, (databaseId, i) => (
                  <StyledSelectItem
                    key={`${i}-${cell.id}-${databaseId}`}
                    data-testid={`user-database-${cell.id}-${i}`}
                    value={databaseId}
                  >
                    {cfgLibraryDatabases.display[databaseId] ?? ""}
                  </StyledSelectItem>
                ))}
              </StyledDatabaseSelect>
            </Stack>
          </Stack>
          {
            /*
                Show fields when the cell is expanded
                */
            isExpanded && (
              <StackUserInputSection>
                <StyledNumberSection>1</StyledNumberSection>
                <StackUserInput>
                  <StyledTypographySection>
                    <StyledTypography variant="body2">
                      Type your query in natural language
                    </StyledTypography>
                    <StyledIcon>
                      <TextFields />
                    </StyledIcon>
                  </StyledTypographySection>
                  <StyledUserTextField
                    fullWidth
                    placeholder="Type your question or request for data"
                    value={cell.parameters.userQuery}
                    disabled={cell.isLoading}
                    data-testid={`user-query-${cell.id}`}
                    multiline
                    rows={4}
                    onChange={updateUserInputChange}
                  />
                </StackUserInput>
              </StackUserInputSection>
            )
          }
          {
            /* show fields when the cell is expanded */
            isExpanded && (
              <StackFrameModel>
                <StyledTextField
                  title="Set Frame Variable Name"
                  size="medium"
                  value={cell.parameters.frameVariableName}
                  disabled={cell.isLoading}
                  data-testid={`frame-variable-${cell.id}`}
                  InputProps={{
                    startAdornment: <DriveFileRenameOutlineRounded />,
                  }}
                  onChange={updateFrameVariableName}
                />
                <StyledModelSelect
                  size={"medium"}
                  disabled={cell.isLoading}
                  title={"Select Model"}
                  value={cell.parameters.model}
                  data-testid={`model-user-${cell.id}`}
                  SelectProps={{
                    IconComponent: KeyboardArrowDown,
                    startAdornment: (
                      <InputAdornment position="start">
                        <CropFree />
                      </InputAdornment>
                    ),
                  }}
                  required={cell.parameters.userQuery !== "" && !cell.parameters.model}
                  error={cell.parameters.userQuery !== "" && !cell.parameters.model}
                  onChange={updateModel}
                >
                  {modelDetail.modelData.length > 0 &&
                    modelDetail.modelData.map((model, key) => (
                      <StyledSelectItem
                        key={
                          model.database_id?.split("-")?.length > 0
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
                </StyledModelSelect>
              </StackFrameModel>
            )
          }
          {
            /*
             * If the cell is not generated with query yet, then generated SQL text field will not be shown
             */
            isExpanded && cell.parameters.dataFrameQuery && (
              <Stack>
                <Accordion>
                  <Accordion.Trigger expandIcon={<StyledExpandMore />} data-testid={`generated-sql-${cell.id}`}>
                    <StyledGenSQLTypography variant="body1">
                      Generated SQL
                    </StyledGenSQLTypography>
                  </Accordion.Trigger>
                  <Accordion.Content>
                    {cell.parameters.dataFrameQuery}
                  </Accordion.Content>
                </Accordion>
              </Stack>
            )
          }
        </Stack>
      </StyledContent>
    );
});

export default TextToSqlCell;
