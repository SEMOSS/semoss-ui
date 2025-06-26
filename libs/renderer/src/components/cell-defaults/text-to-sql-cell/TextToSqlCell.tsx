import {useState, useEffect} from 'react';
import { observer } from 'mobx-react-lite';
import { ActionMessages, CellComponent, CellDef } from '../../../store';
import { TransformationTargetCell } from '../shared';
import { styled, Button, Select, Stack, Autocomplete, TextField, InputAdornment } from '@semoss/ui';
import { useBlocks } from '../../../hooks';
import { CropFree, DriveFileRenameOutlineRounded, KeyboardArrowDown } from '@mui/icons-material';
import { usePixel } from '@semoss/sdk/react';
import { BaseSettingSection } from '../../../components/block-settings';

const StyledContent = styled("div")(({ theme }) => ({
    position: "relative",
    width: "100%",
}));

const StyledSelect = styled(Select)(({ theme }) => ({
    "& .MuiInputBase-root":{
        padding: "0px 12px",
        height:'40px',
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

export interface TextToSqlCellDef extends CellDef<"text-to-sql"> {
    widget: "text-to-sql";
    parameters: {
        /** Database associated with the cell */
        databaseId: string;

        /** Output frame type */
        userQuery: string;

        /** Ouput variable name */
        frameVariableName: string;

        /** Select query rendered in the cell */
        model: string;
        targetCell: TransformationTargetCell;
    };
}

const TextToSqlCell: CellComponent<TextToSqlCellDef> = observer((props)=>{

    const { cell, isExpanded } = props;
    const { state} = useBlocks();
    const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
                loading: true,
                ids: [],
                display: {},
            });
    const [framelist, setFramelist] = useState([]);
    const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
    const [modelDetail, setModelDetail] = useState<{loading: boolean, modelData: any[], selectedModel: string}>({
        loading:true,
        modelData: [],
        selectedModel: "",
    });
    const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
        `MyEngines(engineTypes=['DATABASE']);`,
    );

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
        const getMyModels = async ()=>{
            const myModels = await state.runSideEffect(`MyEngines(engineTypes=['MODEL']);`,);
            const modelsData :any = myModels.pixelReturn[0].output;
            console.log(modelsData, 'ModelsData');
            setModelDetail({
                loading: false,
                modelData: modelsData,
                selectedModel: modelsData[0].app_id,
            });
        };
        getMyModels();
    }, [myDbs.status, myDbs.data]);


    return (
        <StyledContent>
            <Stack direction='column' spacing={1}>
                {
                    isExpanded && (
                        <Stack direction={"column"}>
                            <Stack
                                direction="row"
                                justifyContent={"space-between"}
                            >
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
                    )
                }
                <BaseSettingSection label="">
                    <TextField 
                        fullWidth
                        placeholder='Type your question or request for data'
                        value={cell.parameters.userQuery}
                        disabled={cell.isLoading}
                        onChange={(e) => {
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
                </BaseSettingSection>
                {
                    isExpanded && (
                        <Stack
                            direction="row"
                            alignItems={"center"}
                            justifyContent={"flex-start"}
                            borderColor={"red"}
                            gap={'16px'}
                            width={'100%'}
                        >
                            <StyledTextField
                                title="Set Frame Variable Name"
                                size='medium'
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
                                {
                                    modelDetail.modelData.length > 0 && modelDetail.modelData.map((model, key)=>(
                                        <StyledSelectItem
                                            key={ model.database_id?.split('-')?.length > 0 ? model.database_id.split('-').reverse().slice(0,2).join("-")+key : key }
                                            value={model.database_id}
                                        >
                                            {model.app_name}
                                        </StyledSelectItem>
                                    ))
                                }
                            </StyledSelect>
                        </Stack>
                    )
                }
            </Stack>
        </StyledContent>
    );
});

export default TextToSqlCell;