import React, { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useBlock, useTypeWriter, useBlocks} from "../../../hooks";
import { BlockDef, BlockComponent,ActionMessages,ListenerActions,Block} from "../../../store";
import { showBlock } from "../../blocks/RendererEngine";
import { useForm } from 'react-hook-form';
import { runPixel } from "@semoss/sdk/react";
import {
    Button,
    Modal,
    Typography,
    useNotification,
} from '@semoss/ui';
import { PathValue,Paths } from "../../../types";
import {SpreadsheetForm} from "./SpreadsheetForm";
import { useRootStore } from '@semoss/ui/hooks';
import { Add } from '@mui/icons-material';
import { useCallback } from "react";

type showSpreadSheetForm = {
    TITLE_SHEET_NAME: string;
};

type showCreateSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
};

type showUpdateSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
};

interface useBlockSettingsReturn<D extends BlockDef = BlockDef> {
    setData: <P extends Paths<Block<D>["data"], 4>>(
        path: P,
        value: PathValue<D["data"], P>,
    ) => void;
}

export interface SpreadsheetBlockDef extends BlockDef<"spreadsheet"> {
    widget: "spreadsheet";
    data: {
        style: CSSProperties;
        text: string;
        variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
        isStreaming: boolean;
        show: string;
        showSpreadSheetForm: boolean;
        showCreateSheetForm: boolean;
        showUpdateSheetForm: boolean;
        deleteTitleSheet: boolean;
        showListedSheets: boolean;
        titleSheetName: string;
        sheetName: string;
    };
    slots: never;
    listeners: never;
}

const useBlockSettings = <D extends BlockDef = BlockDef>(
    id: string,
): useBlockSettingsReturn<D> => {
    const { state } = useBlocks();
    const block = state.getBlock(id);
    if (!block) {
        throw Error(`Cannot find block ${id}`);
    }
    const setData = useCallback(
        <P extends Paths<Block<D>["data"], 4>>(
            path: P | null,
            value: PathValue<Block<D>["data"], P>,
        ): void => {
            state.dispatch({
                message: ActionMessages.SET_BLOCK_DATA,
                payload: {
                    id: id,
                    path: path,
                    value: value,
                },
            });
        },
        [id],
    );
    return {
        setData: setData,
    };
};


function SpreadsheetBlockComponent ({ id }) {
    const block = useBlock<SpreadsheetBlockDef>(id);
    const state = useBlocks();
    const { data} = block;
    const { setData } = useBlockSettings(id);
    const { monolithStore,configStore } = useRootStore();
    const [isDelete, setIsDelete] = useState(false);
    const [allListedSheets, setAllListedSheets] = useState([]);
    const notification = useNotification();
    const [loggedInUser,setLoggedInUser]= useState('');
    const [updateSheet, setUpdateSheet] = useState([]);
    const [createSheet, setCreateSheet] = useState([]);
    const [refreshSheets, setRefreshSheets] = useState(0);
    const allSections: Paths<SpreadsheetBlockDef["data"], 4>[] = [
        "showSpreadSheetForm",
        "showCreateSheetForm",
        "showUpdateSheetForm",
        "deleteTitleSheet",
        "showListedSheets"
    ];
    const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");
    
    const escapePixelString = (str: string) => {
        if (typeof str !== 'string') return '';
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\"/g, '\\"');
    }

    useEffect(() => {
        const fetchSheetData = async () => {
            try {
                const response = await runPixel<[string[]]>(
                    `META | GetAllGoogleSheets();`
                );
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1 && output) {
                    setAllListedSheets(output);
                } else {
                    throw new Error('error');
                }
            } catch (error) {
                console.error("Error fetching sheet options:", error);
            }
        };
        if(loggedInUser){
            fetchSheetData();
        }
    },[loggedInUser, refreshSheets]);

    useEffect(() => {
        (async () => {
            await configStore.initialize();
            if (configStore.store.config.loginDetails['GOOGLE'] && configStore.store.config.loginDetails['GOOGLE'].name) {
                setLoggedInUser(configStore.store.config.loginDetails['GOOGLE'].name);
            }
        })();
        setData("showListedSheets", true as PathValue<SpreadsheetBlockDef["data"], "showListedSheets">);
    },[configStore]);

    useEffect(() => {
        if (data.showUpdateSheetForm) {
            resetUpdate({
            TITLE_SHEET_NAME: data.titleSheetName,
            SHEET_NAME: data.sheetName,
            });
        }

        if (data.showCreateSheetForm) {
            resetCreate({
            TITLE_SHEET_NAME: data.titleSheetName,
            });
        }       
    }, [data.titleSheetName,data.sheetName]);
    
    if (!data.isStreaming) displayTxt = textContent;
    const { getValues:getSpreadValues, handleSubmit:handleSpreadSubmit, control:controlSpread,reset:resetSpread } = useForm<showSpreadSheetForm>({
            defaultValues: {
                TITLE_SHEET_NAME: '',
            },
        });

    const { getValues : getCreateValues, handleSubmit : handleCreateSubmit, control : controlCreate, reset: resetCreate} = useForm<showCreateSheetForm>({
        defaultValues: {
            TITLE_SHEET_NAME: '',
            SHEET_NAME: '',
        },
    });

    const { getValues : getUpdateValues, handleSubmit : handleUpdateSubmit, control : controlUpdate, reset: resetUpdate } = useForm<showUpdateSheetForm>({
        defaultValues: {
            TITLE_SHEET_NAME: '',
            SHEET_NAME: '',
        },
    });

    const onSpreadSubmit = handleSpreadSubmit(async (spreadData: showSpreadSheetForm) => {
        const safeTitleSheetName = escapePixelString(spreadData.TITLE_SHEET_NAME);
        try{
            const response = await runPixel<[string]>(
                `META | GoogleNewSpreadSheet(titleSheetName="${safeTitleSheetName}");`,
            );
            const outputCreate = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1  && outputCreate.includes("Spreadsheet created")) {
                setData("showSpreadSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showSpreadSheetForm">);
                setData("showListedSheets", true as PathValue<SpreadsheetBlockDef["data"], "showListedSheets">);
                resetSpread();
                setRefreshSheets(refreshSheets + 1);
            }else {
                throw new Error(outputCreate);
            }
        }
        catch (error) {
            console.error("Error reading sheet data:", error);
        }
    });

    const onCreateSubmit = async (createData: showCreateSheetForm) => {
        try{
            const safeSheetName = escapePixelString(createData.SHEET_NAME);
            const safeTitleSheetName = escapePixelString(createData.TITLE_SHEET_NAME);
            const response = await runPixel<[string]>(
                `META | GoogleSpreadSheetCreate(titleSheetName='${safeTitleSheetName}',sheetName='${safeSheetName}',data='${JSON.stringify(createSheet)}');`,
            );
            const outputCreateSheet = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && outputCreateSheet.includes("Data added successfully to new sheet")) {
                setData("showCreateSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showCreateSheetForm">);
                setData("showListedSheets", true as PathValue<SpreadsheetBlockDef["data"], "showListedSheets">);
                setRefreshSheets(refreshSheets + 1);
                resetCreate();
            }else {
                throw new Error(outputCreateSheet);
            }
        }
        catch (error) {
            console.error("Error writing sheet data:", error);
        }
    };

    const onUpdateSubmit = handleUpdateSubmit(async (updateData: showUpdateSheetForm) => {
        const maxCols = updateSheet.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
        let processedSheet = updateSheet;
        if (!updateSheet.length) {
            processedSheet = [Array(maxCols || 1).fill("")];
        } else {
            processedSheet = updateSheet.map(row =>
                Array.isArray(row)
                    ? [...row, ...Array(maxCols - row.length).fill("")]
                    : Array(maxCols).fill("")
            );
        }
        try{
            const safeSheetName = escapePixelString(updateData.SHEET_NAME);
            const safeTitleSheetName = escapePixelString(updateData.TITLE_SHEET_NAME);
            const response = await runPixel<[string]>(
                `META | GoogleSpreadSheetUpdate(titleSheetName='${safeTitleSheetName}',sheetName='${safeSheetName}',data='${JSON.stringify(processedSheet)}');`,
            );
            const outputUpdate = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && outputUpdate === "All data replaced successfully"){
                setShowUpdateSuccessModal(true);
                setData("showUpdateSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showUpdateSheetForm">);
                setUpdateSheet([]);
                resetUpdate();
            }else {
                throw new Error(outputUpdate);
            }
        }
        catch (error) {
            console.error("Error updating the sheet:", error);
        }
    });

    const deleteSheet = async () => {
        try{
            let pixelCall ;
            if(data.deleteTitleSheet) {
                pixelCall = `META | GoogleDeleteSpreadSheet(titleSheetName="${data.titleSheetName}");`;
            }
            else {
                pixelCall = `META | GoogleDeleteSheet(titleSheetName="${data.titleSheetName}",sheetName="${data.sheetName}");`;
            }
            const response = await runPixel<[string]>(pixelCall);
            const outputDelete = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && outputDelete.includes("deleted successfully")) {
                setData("showListedSheets", true as PathValue<SpreadsheetBlockDef["data"], "showListedSheets">);
                setIsDelete(false);
                setRefreshSheets(refreshSheets + 1);
            }else {
                throw new Error(outputDelete);
            }
        }
        catch (error) {
            console.error("Error creating Jira issue:", error);
        }
    }

    const oauth = async (provider: string) => {
        await configStore
            .oauth(provider)
            .then(async () => {
                notification.add({
                    color: 'success',
                    message: `Successfully logged in`,
                });
                await configStore.initialize();
                setLoggedInUser(configStore.store.config.loginDetails['GOOGLE'].name);
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error.message,
                });
            });
    };

    const handleUpdateSheetDropdownChange= async (titleSheetName,sheetName) =>{
        const safeSheetName = escapePixelString(sheetName);
        const safeTitleSheetName = escapePixelString(titleSheetName);
        try{
            const response = await runPixel<[string[]]>(
                `META | GoogleSpreadSheetRead(titleSheetName="${safeTitleSheetName}",sheetName="${safeSheetName}");`,
            );
            const outputRead = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setUpdateSheet(outputRead);
            }else {
                throw new Error("error reading sheet data");
            }
        }
        catch (error) {
            console.error("Error reading sheet data:", error);
        }
    }

    const setCurrentSection = (section: Paths<SpreadsheetBlockDef["data"], 4>,titleSheetName,sheetName) => {
        if(section === 'showUpdateSheetForm') {
            handleUpdateSheetDropdownChange(titleSheetName,sheetName);
        }
        allSections.forEach(path => {
            const value = path === section ? true : false;
            setData(path, value as PathValue<SpreadsheetBlockDef["data"], typeof path>);
        });
    };

    return (
        <div data-block = {id} style={{ position: "relative", ...data.style }}>
            {showBlock(block, state) ? (
                <div
                    style={{
                        ...data.style,
                        marginBlockStart: "0px",
                        marginBlockEnd: "0px",
                    }}
                >
                    {displayTxt}
                    {!configStore.store.config.loginDetails['GOOGLE'] && (
                        <div>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => {oauth('google')}}
                                style={{ marginTop: '10px' }}
                                data-testid={'my-jira-profile-new-key-btn'}
                            >
                                Login google
                            </Button>
                        </div>
                    )}
                    {loggedInUser && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '600px', margin: '0 auto', marginBottom: '16px' }}>
                            <div>
                                <span>Logged in as: </span>
                                <h4 style={{ display: 'inline', marginLeft: '8px' }}>{loggedInUser}</h4>
                            </div>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={()=>setCurrentSection('showSpreadSheetForm','','')}
                            >
                                Create
                            </Button>
                        </div>
                    )}
                    {data.showListedSheets && (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '100%',
                            }}
                        >
                            <div
                                style={{
                                    width: '600px', // or use maxWidth: '90vw'
                                    margin: '0 auto',
                                }}
                            >
                                <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>Listed Sheets:</div>
                                {allListedSheets.map((sheet, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            margin: '16px 0',
                                            borderBottom: '1px solid #eee',
                                            paddingBottom: '8px',
                                            background: '#fafafa',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                        }}
                                    >
                                        {/* Title and Create button row */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                width: '100%',
                                                padding: '8px 0',
                                            }}
                                        >
                                            <h3 style={{ margin: 0 }}>{sheet['spreadsheetTitle']}</h3>
                                            <Button 
                                                variant="contained" 
                                                style={{ marginLeft: 'auto' }}
                                                onClick={()=>{
                                                    setData("titleSheetName", sheet['spreadsheetTitle'] as PathValue<SpreadsheetBlockDef["data"], "titleSheetName">);
                                                    setCurrentSection('showCreateSheetForm','','');
                                                }}
                                            >
                                                Create New Sheet
                                            </Button>
                                            <Button 
                                                variant="outlined" 
                                                color="error"
                                                onClick={()=>{
                                                    setData("titleSheetName", sheet['spreadsheetTitle'] as PathValue<SpreadsheetBlockDef["data"], "titleSheetName">);
                                                    setData("deleteTitleSheet", true as PathValue<SpreadsheetBlockDef["data"], "deleteTitleSheet">);
                                                    setIsDelete(true);
                                                }}
                                            >
                                                Delete Title Sheet
                                            </Button>
                                        </div>
                                        {/* Sheet names list below the title */}
                                        <div style={{ width: '100%', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {sheet['sheetNames'].map((sheetName, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '4px 0',
                                                    }}
                                                >
                                                    <span>{sheetName}</span>
                                                    <div>
                                                        <Button 
                                                            variant="outlined" 
                                                            style={{ marginRight: '8px' }}
                                                            onClick={()=>{
                                                                setData("titleSheetName", sheet['spreadsheetTitle'] as PathValue<SpreadsheetBlockDef["data"], "titleSheetName">);
                                                                setData("sheetName", sheetName as PathValue<SpreadsheetBlockDef["data"], "sheetName">);
                                                                setCurrentSection('showUpdateSheetForm',sheet['spreadsheetTitle'],sheetName);
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button 
                                                            variant="outlined" 
                                                            color="error"
                                                            onClick={()=>{
                                                                setData("titleSheetName", sheet['spreadsheetTitle'] as PathValue<SpreadsheetBlockDef["data"], "titleSheetName">);
                                                                setData("sheetName", sheetName as PathValue<SpreadsheetBlockDef["data"], "sheetName">);
                                                                setIsDelete(true);
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {data.showSpreadSheetForm && (
                        <SpreadsheetForm
                            control={controlSpread}
                            fields={[
                            { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true},
                            ]}
                            onSubmit={onSpreadSubmit}
                            handleSubmit={handleSpreadSubmit}
                            cancel={()=>setCurrentSection('showListedSheets','','')}
                            formType="read"
                            tableData={null}
                            setTableData={null}
                        />
                    )}
                    {data.showCreateSheetForm && (
                        <SpreadsheetForm
                            control={controlCreate}
                            fields={[
                            { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true},
                            { name: "SHEET_NAME", label: "Sheet Name", required: true},
                            ]}
                            onSubmit={onCreateSubmit}
                            handleSubmit={handleCreateSubmit}
                            cancel={()=>setCurrentSection('showListedSheets','','')}
                            formType="create"
                            tableData={createSheet}
                            setTableData={setCreateSheet}
                        />
                    )}
                    {data.showUpdateSheetForm && (
                        <SpreadsheetForm
                            control={controlUpdate}
                            fields={[
                            { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true},
                            { name: "SHEET_NAME", label: "Sheet Name", required: true},
                            ]}
                            onSubmit={onUpdateSubmit}
                            handleSubmit={handleUpdateSubmit}
                            cancel={()=>setCurrentSection('showListedSheets','','')}
                            formType="update"
                            tableData={updateSheet}
                            setTableData={setUpdateSheet}
                        />
                    )}
                    {showUpdateSuccessModal && (
                       <Modal open={showUpdateSuccessModal} onClose={() => setShowUpdateSuccessModal(false)}>
                            <Modal.Content>
                                <Modal.Title>Sheet Updated</Modal.Title>
                                <Modal.Content>
                                    <Typography variant="body1">
                                        Sheet updated successfully.
                                    </Typography>
                                </Modal.Content>
                                <Modal.Actions>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setShowUpdateSuccessModal(false);
                                            setData("showListedSheets", true as PathValue<SpreadsheetBlockDef["data"], "showListedSheets">);
                                        }}
                                    >
                                        OK
                                    </Button>
                                </Modal.Actions>
                            </Modal.Content>
                        </Modal>
                    )}
                    {isDelete &&(
                        <Modal onClose={close} open={isDelete}>
                            <Modal.Content>
                                <Modal.Title>Delete Job</Modal.Title>
                                <Modal.Content>
                                    <Typography variant="body1">
                                        Are you sure you want to delete? This action is permanent.
                                    </Typography>
                                </Modal.Content>
                                <Modal.Actions>
                                    <Button
                                        variant="text"
                                        onClick={()=> setIsDelete(false)}
                                        data-testid={'delete-job-cancel-btn'}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={deleteSheet}
                                        data-testid={'delete-job-delete-btn'}
                                    >
                                        Delete
                                    </Button>
                                </Modal.Actions>
                            </Modal.Content>
                        </Modal>
                    )}
                </div>
            ) : (
                <p
                    style={{
                        ...data.style,
                        marginBlockStart: "0px",
                        marginBlockEnd: "0px",
                    }}
                >
                    Spreadsheet Block
                </p>
            )}
        </div>
    )
};

export const SpreadsheetBlock: BlockComponent = observer(SpreadsheetBlockComponent);