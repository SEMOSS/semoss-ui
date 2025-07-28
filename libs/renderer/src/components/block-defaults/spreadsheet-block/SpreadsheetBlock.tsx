import React, { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useBlock, useTypeWriter, useBlocks} from "../../../hooks";
import { BlockDef, BlockComponent} from "../../../store";
import { useForm } from 'react-hook-form';
import { runPixel, oauth,getUserDetails} from "@semoss/sdk/react";
import {
    Button,
    Modal,
    Typography,
    useNotification,
} from '@semoss/ui';
import { PathValue,Paths } from "../../../types";
import {SpreadsheetForm} from "./SpreadsheetForm";
import { Add } from '@mui/icons-material';

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

export const SpreadsheetBlock: BlockComponent = observer(({ id }) => {
    const { data, setData} = useBlock<SpreadsheetBlockDef>(id);
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
                    `META | GoogleGetAllSheets();`
                );
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1 && output) {
                    setData("showListedSheets", true as PathValue<SpreadsheetBlockDef["data"], "showListedSheets">);
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
            try {
                const response = await getUserDetails("google");
                if (response.name) {
                    setLoggedInUser(response.name);
                    notification.add({
                        color: "success",
                        message: "Successfully logged into Google",
                    });
                }
            } catch (error) {
                notification.add({
                    color: "error",
                    message: "Failed to fetch Google user info",
                });
            }
        })();
    }, []);

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
            const response = await runPixel<[string[]]>(
                `META | GoogleCreateMainSheet(titleSheetName="${safeTitleSheetName}");`,
            );
            const outputCreate = response.pixelReturn[0].output['success'];
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1  && outputCreate === true) {
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
            const sheet = allListedSheets.find(sheet => sheet['spreadsheetTitle'] === createData.TITLE_SHEET_NAME);
            const safeSheetName = escapePixelString(createData.SHEET_NAME);
            const safeTitleSheetId = escapePixelString(sheet['TitleId']);
            const response = await runPixel<[string[]]>(
                `META | GoogleCreateSheet(titleSheetID='${safeTitleSheetId}',sheetName='${safeSheetName}',data='${JSON.stringify(createSheet)}');`,
            );
            const outputCreateSheet = response.pixelReturn[0].output['success'];
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && outputCreateSheet === true) {
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
            const sheet = allListedSheets.find(sheet => sheet['spreadsheetTitle'] === updateData.TITLE_SHEET_NAME);
            const safeSheetID = escapePixelString(sheet['sheetNames'].find(s => s.name === updateData.SHEET_NAME)?.id || '');
            const safeTitleSheetId = escapePixelString(sheet['TitleId']);
            const response = await runPixel<[string]>(
                `META | GoogleUpdateSheet(titleSheetID='${safeTitleSheetId}',SheetID='${safeSheetID}',data='${JSON.stringify(processedSheet)}');`,
            );
            const outputUpdate = response.pixelReturn[0].output['success'];
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && outputUpdate === true){
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
            const mainSheet = allListedSheets.find(sheet => sheet['spreadsheetTitle'] === data.titleSheetName);
            const safeTitleSheetId = escapePixelString(mainSheet['TitleId']);
            let pixelCall ;
            if(data.deleteTitleSheet) {
                pixelCall = `META | GoogleDeleteMainSheet(titleSheetID="${safeTitleSheetId}");`;
            }
            else {
                const sheetId = mainSheet['sheetNames'].find(sheet => sheet.name === data.sheetName)?.id || '';
                const safeSheetId = escapePixelString(sheetId);
                pixelCall = `META | GoogleDeleteSheet(titleSheetID="${safeTitleSheetId}",SheetID="${safeSheetId}");`;
            }
            const response = await runPixel<[string]>(pixelCall);
            const outputDelete = response.pixelReturn[0].output['success'];
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && outputDelete === true) {
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

    const handleGoogleLogin = async () => {
        try {
            const response = await oauth("google");
            if (response.name) {
                setLoggedInUser(response.name);
                setData("showListedSheets", true as PathValue<SpreadsheetBlockDef["data"], "showListedSheets">);
                notification.add({
                    color: "success",
                    message: "Successfully logged into Google",
                });
            } else {
                notification.add({
                    color: "error",
                    message: "Failed to fetch Google user info",
                });
            }
            // This will trigger the UI to show the doc list page
        } catch (error: any) {
            notification.add({
                color: "error",
                message: error.message,
            });
        }
    };

    const handleUpdateSheet= async (titleSheetId,sheetId) =>{
        const safeSheetId = escapePixelString(sheetId);
        const safeTitleSheetId = escapePixelString(titleSheetId);
        try{
            const response = await runPixel<[string[]]>(
                `META | GoogleReadSheet(titleSheetID="${safeTitleSheetId}",SheetID="${safeSheetId}");`,
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

    const setCurrentSection = (section: Paths<SpreadsheetBlockDef["data"], 4>,titleSheetId,sheetId) => {
        if(section === 'showUpdateSheetForm') {
            handleUpdateSheet(titleSheetId,sheetId);
        }
        allSections.forEach(path => {
            const value = path === section ? true : false;
            setData(path, value as PathValue<SpreadsheetBlockDef["data"], typeof path>);
        });
    };

    return (
        <div data-block = {id} style={{ position: "relative", ...data.style }}>
                <div
                    style={{
                        ...data.style,
                        marginBlockStart: "0px",
                        marginBlockEnd: "0px",
                    }}
                >
                    {displayTxt}
                    {!loggedInUser && (
                        <div>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={handleGoogleLogin}
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
                    {<h1>{data.showListedSheets}</h1>}
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
                                                    <span>{sheetName['name']}</span>
                                                    <div>
                                                        <Button 
                                                            variant="outlined" 
                                                            style={{ marginRight: '8px' }}
                                                            onClick={()=>{
                                                                setData("titleSheetName", sheet['spreadsheetTitle'] as PathValue<SpreadsheetBlockDef["data"], "titleSheetName">);
                                                                setData("sheetName", sheetName['name'] as PathValue<SpreadsheetBlockDef["data"], "sheetName">);
                                                                setCurrentSection('showUpdateSheetForm',sheet['TitleId'],sheetName['id']);
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button 
                                                            variant="outlined" 
                                                            color="error"
                                                            onClick={()=>{
                                                                setData("titleSheetName", sheet['spreadsheetTitle'] as PathValue<SpreadsheetBlockDef["data"], "titleSheetName">);
                                                                setData("sheetName", sheetName['name'] as PathValue<SpreadsheetBlockDef["data"], "sheetName">);
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
                                            setData("showListedSheets", true as PathValue<SpreadsheetBlockDef["data"], "showListedSheets">,true);
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
            
        </div>
    )
});