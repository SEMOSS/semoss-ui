import React, { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useBlock, useTypeWriter, useBlocks, useBlockSettings } from "../../../hooks";
import { BlockDef, BlockComponent} from "../../../store";
import { showBlock } from "../../blocks/RendererEngine";
import { useForm } from 'react-hook-form';
import { runPixel } from "@semoss/sdk/react";
import {
    Button,
    styled,
    Modal,
    Typography,
    useNotification,
    Table,
} from '@semoss/ui';

import { PathValue } from "../../../types";
import {SpreadsheetForm} from "./SpreadsheetForm";
import { useRootStore } from '@semoss/ui/hooks';
import { Add } from '@mui/icons-material';
import { set } from "mermaid/dist/diagrams/state/id-cache.js";
import EditableTable  from "./EditableTable";

type showReadSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
};

type showCreateSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
};

type showUpdateSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
};

type showDeleteSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
};

const StyledTableContainer = styled(Table.Container)(() => ({
    marginTop: '20px',
}));

export interface SpreadsheetBlockDef extends BlockDef<"spreadsheet"> {
    widget: "spreadsheet";
    data: {
        style: CSSProperties;
        text: string;
        variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
        isStreaming: boolean;
        show: string;
        showReadSheetForm: boolean;
        showReadForm: boolean;
        showCreateSheetForm: boolean;
        showCreateForm: boolean;
        showUpdateSheetForm: boolean;
        showUpdateForm: boolean;
        showDeleteSheetForm: boolean;
        showDeleteForm: boolean;
        showListedSheets: boolean;
        userId: string;
        sheetConnectionValue: string;
        sheetActionValue: string;
    };
    slots: never;
    listeners: never;
}

function SpreadsheetBlockComponent ({ id }) {
    const block = useBlock<SpreadsheetBlockDef>(id);
    const state = useBlocks();
    const { data} = block;
    const { setData } = useBlockSettings(id);
    const { monolithStore,configStore } = useRootStore();
    const[showReadData, setShowReadData] = useState([['Hello', 'World'],['Hi',''],['Test']]);
    const [showResponseData, setShowResponseData] = useState('');
    const [isDelete, setIsDelete] = useState(false);
    const [deleteText, setDeleteText] = useState('');
    const [deletePixelCall, setDeletePixelCall] = useState('');
    const [titleSheetOptions, setTitleSheetOptions] = useState<string[]>(['parent1', 'parent2']);
    const [sheetOptions, setSheetOptions] = useState<string[]>(['mysheet1', 'mysheet5']);
    const [listedSheets, setListedSheets] = useState<string[]>(['sheet1', 'sheet2', 'sheet3']);
    const [isLoading, setIsLoading] = useState(false);
    const notification = useNotification();
    const [loggedInUser,setLoggedInUser]= useState('');
    const [updateSheet, setUpdateSheet] = useState([]);
    const [createSheet, setCreateSheet] = useState([]);
    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");
    console.log('loggedInUser', configStore.store.config.loginDetails);

    const escapePixelString = (str: string) => {
        if (typeof str !== 'string') return '';
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\"/g, '\\"');
    }

    useEffect(() => {
        const fetchSheetOptions = async () => {
            const safeUserId = escapePixelString(data.userId);
            try {
                const response = await runPixel<[string]>(
                    `META | GoogleSheet(command = "get sheet names",userid="${safeUserId}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`
                );
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    //setTitleSheetOptions(output.split(','));
                    //setSheetOptions(output.split(','));
                } else {
                    throw new Error(output);
                }
            } catch (error) {
                console.error("Error fetching sheet options:", error);
            }
        };
        fetchSheetOptions();
    },[data.userId]);

    useEffect(() => {
        const fetchListedSheets = async () => {
            const safeUserId = escapePixelString(data.userId);
            try {
                const response = await runPixel<[string]>(
                    `META | GoogleSheet(command = "list sheets",userid="${safeUserId}");`
                );
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    setListedSheets(output.split(','));
                } else {
                    throw new Error(output);
                }
            } catch (error) {
                console.error("Error fetching listed sheets:", error);
            }
        };
        if(data.showListedSheets) {
            fetchListedSheets();
        }
   });

   useEffect(() => {
        setData("showReadForm", true as PathValue<SpreadsheetBlockDef["data"], "showReadForm">);
        (async () => {
            await configStore.initialize();
        })();
    },[configStore]);

    if (!data.isStreaming) displayTxt = textContent;
    const { getValues:getReadValues, handleSubmit:handleReadSubmit, control:controlRead,reset:resetRead } = useForm<showReadSheetForm>({
            defaultValues: {
                TITLE_SHEET_NAME: '',
                SHEET_NAME: '',
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

        const { getValues : getDeleteValues, handleSubmit : handleDeleteSubmit, control : controlDelete, reset: resetDelete } = useForm<showDeleteSheetForm>({
            defaultValues: {
                TITLE_SHEET_NAME: '',
                SHEET_NAME: '',
            },
        });

    const onReadSubmit = handleReadSubmit(async (readData: showReadSheetForm) => {
        const safeSheetName = escapePixelString(readData.SHEET_NAME);
        try{
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "read",sheetName="${safeSheetName}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`,
            );
            const outputRead = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("showReadSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showReadSheetForm">);
                setData("showReadForm", true as PathValue<SpreadsheetBlockDef["data"], "showReadForm">);
                //setShowReadData(outputRead);
                resetRead();
            }else {
                throw new Error(outputRead);
            }
        }
        catch (error) {
            console.error("Error reading sheet data:", error);
        }
    });

    const onCreateSubmit = async (writeData: showCreateSheetForm) => {
        console.log('Created sheet data:', createSheet);
        try{
            const safeSheetName = escapePixelString(writeData.SHEET_NAME);
            const safeTitleSheetName = escapePixelString(writeData.TITLE_SHEET_NAME);
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "create new sheet",sheetName="${safeSheetName}",titleSheetName="${safeTitleSheetName}");`,
            );
            const outputWrite = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && outputWrite === "Data written successfully") {
                setData("showCreateSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showCreateSheetForm">);
                setData("showCreateForm", true as PathValue<SpreadsheetBlockDef["data"], "showCreateForm">);
                setShowResponseData(outputWrite);
                resetCreate();
            }else {
                throw new Error(outputWrite);
            }
        }
        catch (error) {
            console.error("Error writing sheet data:", error);
        }
    };

    const onUpdateSubmit = handleUpdateSubmit(async (updateData: showUpdateSheetForm) => {
        console.log('updateData', updateSheet);
        try{
            const safeSheetName = escapePixelString(updateData.SHEET_NAME);
            const safeTitleSheetName = escapePixelString(updateData.TITLE_SHEET_NAME);
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "update",titleSheetName="${safeTitleSheetName}",sheetName="${safeSheetName}",data="${updateSheet}");`,
            );
            const outputUpdate = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("showUpdateSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showUpdateSheetForm">);
                setData("showUpdateForm", true as PathValue<SpreadsheetBlockDef["data"], "showUpdateForm">);
                setShowResponseData(outputUpdate);
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

    const onDeleteSubmit = handleDeleteSubmit(async (deleteData: showDeleteSheetForm) => {
        const safeTitleSheetName = escapePixelString(deleteData.TITLE_SHEET_NAME);
        const safeSheetName = escapePixelString(deleteData.SHEET_NAME); 
        if(deleteData.TITLE_SHEET_NAME !=='' && deleteData.SHEET_NAME === '') {
            setDeleteText(`Are you sure you want to delete the title sheet ${deleteData.TITLE_SHEET_NAME}? This action is permanent.`);
            setDeletePixelCall(`META | GoogleSheet(command = "delete titlesheet",titleSheetName="${safeTitleSheetName}");`);
        }else{
            setDeleteText(`Are you sure you want to delete sheet ${deleteData.SHEET_NAME}? This action is permanent.`);
            setDeletePixelCall(`META | GoogleSheet(command = "delete sheet",sheetName="${safeSheetName}",titleSheetName="${safeTitleSheetName}");`);
        }
        setIsDelete(true);
    });

    const deleteSheet = async () => {
        const deleteValues = getDeleteValues();
        try{
            const response = await runPixel<[string]>(deletePixelCall);
            const outputDelete = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && outputDelete === "Data deleted successfully"|| "Sheet deleted successfully" ) {
                setData("showDeleteSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showDeleteSheetForm">);
                setData("showDeleteForm", true as PathValue<SpreadsheetBlockDef["data"], "showDeleteForm">);
                setShowResponseData(outputDelete);
                resetDelete();
                setIsDelete(false);
            }else {
                throw new Error(outputDelete);
            }
        }
        catch (error) {
            console.error("Error creating Jira issue:", error);
        }
    }

    const oauth = async (provider: string) => {
        setIsLoading(true);
        await configStore
            .oauth(provider)
            .then(async () => {
                setIsLoading(false);
                notification.add({
                    color: 'success',
                    message: `Successfully logged in`,
                });
                await configStore.initialize();
                setLoggedInUser(configStore.store.config.loginDetails['GOOGLE'].name);
            })
            .catch((error) => {
                setIsLoading(false);
                notification.add({
                    color: 'error',
                    message: error.message,
                });
            });
    };

    const handleUpdateSheetDropdownChange= async () =>{
        setUpdateSheet([['Hello', 'World'],['Hi',''],['Test']]);
        // const updateValues = getUpdateValues();
        // const safeSheetName = escapePixelString(updateValues.SHEET_NAME);
        // const safeTitleSheetName = escapePixelString(updateValues.TITLE_SHEET_NAME);
        // try{
        //     const response = await runPixel<[string]>(
        //         `META | GoogleSheet(command = "read",sheetName="${safeSheetName}",titleSheetName="${safeTitleSheetName}");`,
        //     );
        //     const outputRead = response.pixelReturn[0].output;
        //     const type = response.pixelReturn[0].operationType;
        //     if (type.indexOf('ERROR') === -1) {
        //         //setUpdateSheet(outputRead);
        //         resetRead();
        //     }else {
        //         throw new Error(outputRead);
        //     }
        // }
        // catch (error) {
        //     console.error("Error reading sheet data:", error);
        // }
        // console.log('handleUpdateSheetDropdownChange called');
    }

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
                                data-testid={'my-jira-profile-new-key-btn'}
                            >
                                Login google
                            </Button>
                        </div>
                    )}
                    {loggedInUser && (
                        <div>
                            <span>Logged in as: </span>
                            <h4>{loggedInUser}</h4>
                        </div>
                    )}
                    {data.showReadSheetForm && (
                        <SpreadsheetForm
                            control={controlRead}
                            fields={[
                            { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true,type: "autocomplete", options:titleSheetOptions },
                            { name: "SHEET_NAME", label: "Sheet Name", required: true ,type: "autocomplete", options:sheetOptions},
                            ]}
                            onSubmit={onReadSubmit}
                            handleSubmit={handleReadSubmit}
                            reset={resetRead}
                        />
                    )}
                    {data.showReadForm && (
                        <StyledTableContainer>
                            <Table sx={{ width: '25%', borderCollapse: 'collapse', margin: '0 auto' }}>
                                <Table.Body>
                                    {(() => {
                                        const maxCols = showReadData.reduce((max, row) => Math.max(max, row.length), 0);
                                        return showReadData.map((row, rIdx) => (
                                            <Table.Row key={rIdx}>
                                                {[...Array(maxCols)].map((_, cIdx) => (
                                                    <Table.Cell
                                                        key={cIdx}
                                                        sx={{
                                                            border: '1px solid #ccc',
                                                            padding: '4px',
                                                            width: '50px',
                                                            height: '25px',
                                                            textAlign: 'center',
                                                            background: '#fff'
                                                        }}
                                                    >
                                                        {row[cIdx] || ""}
                                                    </Table.Cell>
                                                ))}
                                            </Table.Row>
                                        ));
                                    })()}
                                </Table.Body>
                            </Table>
                        </StyledTableContainer>
                    )}
                    {data.showCreateSheetForm && (
                        <>
                            <SpreadsheetForm
                                control={controlCreate}
                                fields={[
                                { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true,type: "autocomplete", options:titleSheetOptions },
                                { name: "SHEET_NAME", label: "Sheet Name", required: true},
                                ]}
                                onSubmit={onCreateSubmit}
                                handleSubmit={handleCreateSubmit}
                                reset={resetCreate}
                            />
                            <EditableTable data={createSheet} setData={setCreateSheet} />
                        </>
                    )}
                    {data.showCreateForm && (
                        <div>
                            <h3>{showResponseData}</h3>
                        </div>
                    )}
                    {data.showUpdateSheetForm && (
                        <>
                            <SpreadsheetForm
                                control={controlUpdate}
                                fields={[
                                { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true,type: "autocomplete", options:titleSheetOptions },
                                { name: "SHEET_NAME", label: "Sheet Name", required: true,type: "autocomplete", options:sheetOptions},
                                { name: "CONTENT", label: "Content", type: "textarea" , required: true },
                                ]}
                                onSheetNameChange={handleUpdateSheetDropdownChange}
                                onSubmit={onUpdateSubmit}
                                handleSubmit={handleUpdateSubmit}
                                reset={resetUpdate}
                            />
                            {updateSheet && updateSheet.length > 0 && (
                                <EditableTable data={updateSheet} setData={setUpdateSheet} />                     
                            )}
                        </>
                    )}
                    {data.showUpdateForm && (
                        <div>
                            <h3>{showResponseData}</h3>
                        </div>
                    )}
                    {data.showDeleteSheetForm && (
                        <SpreadsheetForm
                            control={controlDelete}
                            fields={[
                            { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true,type: "autocomplete", options:titleSheetOptions},
                            { name: "SHEET_NAME", label: "Sheet Name", required: false,type: "autocomplete", options:sheetOptions },
                            ]}
                            onSubmit={onDeleteSubmit}
                            handleSubmit={handleDeleteSubmit}
                            reset={resetDelete}
                        />
                    )}
                    {data.showDeleteForm && (
                        <div>
                            <h3>{showResponseData}</h3>
                        </div>
                    )}
                    {data.showListedSheets && (
                        <div>
                            Listed Sheets:
                        </div>
                    )}  
                    {isDelete &&(
                        <Modal onClose={close} open={isDelete}>
                            <Modal.Content>
                                <Modal.Title>Delete Job</Modal.Title>
                                <Modal.Content>
                                    <Typography variant="body1">
                                        {deleteText}
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