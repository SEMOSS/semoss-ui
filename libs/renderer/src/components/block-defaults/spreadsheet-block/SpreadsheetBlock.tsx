import React, { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useBlock, useTypeWriter, useBlocks, useBlockSettings } from "../../../hooks";
import { BlockDef, BlockComponent} from "../../../store";
import { showBlock } from "../../blocks/RendererEngine";
import { Controller, useForm } from 'react-hook-form';
import { runPixel } from "@semoss/sdk/react";
import {
    Button,
    TextField,
    Stack,
    TextArea,
    styled,
    Autocomplete,
    Modal,
    Typography
} from '@semoss/ui';

import { PathValue } from "../../../types";
import {SpreadsheetForm} from "./SpreadsheetForm";
const StyledButton = styled(Button)(({ theme }) => ({
    marginTop: '20px !important',
}));

type showReadSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
    ROW_NUMBER: string;
    COLUMN_NUMBER: string;
};

type showWriteSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
    ROW_NUMBER: string;
    COLUMN_NUMBER: string;
    CONTENT: string;
};

type showUpdateSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
    ROW_NUMBER: string;
    COLUMN_NUMBER: string;
    CONTENT: string;
};

type showDeleteSheetForm = {
    TITLE_SHEET_NAME: string;
    SHEET_NAME: string;
    ROW_NUMBER: string;
    COLUMN_NUMBER: string;
};

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
        showWriteSheetForm: boolean;
        showWriteForm: boolean;
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

export const SpreadsheetBlock: BlockComponent = observer(({ id }) => {
    const block = useBlock<SpreadsheetBlockDef>(id);
    const state = useBlocks();
    const { data} = block;
    const { setData } = useBlockSettings(id);;
    const[showReadData, setShowReadData] = useState('');
    const [showResponseData, setShowResponseData] = useState('');
    const [isDelete, setIsDelete] = useState(false);
    const [deleteText, setDeleteText] = useState('');
    const [deletePixelCall, setDeletePixelCall] = useState('');
    const [titleSheetOptions, setTitleSheetOptions] = useState<string[]>(['parent1', 'parent2']);
    const [sheetOptions, setSheetOptions] = useState<string[]>(['mysheet1', 'mysheet5']);
    const [listedSheets, setListedSheets] = useState<string[]>(['sheet1', 'sheet2', 'sheet3']);
    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

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

    if (!data.isStreaming) displayTxt = textContent;
    const { getValues:getReadValues, handleSubmit:handleReadSubmit, control:controlRead,reset:resetRead } = useForm<showReadSheetForm>({
            defaultValues: {
                TITLE_SHEET_NAME: '',
                SHEET_NAME: '',
                ROW_NUMBER: '',
                COLUMN_NUMBER: '',
            },
        });

        const { getValues : getWriteValues, handleSubmit : handleWriteSubmit, control : controlWrite, reset: resetWrite} = useForm<showWriteSheetForm>({
            defaultValues: {
                TITLE_SHEET_NAME: '',
                SHEET_NAME: '',
                ROW_NUMBER: '',
                COLUMN_NUMBER: '',
                CONTENT: '',
            },
        });

        const { getValues : getUpdateValues, handleSubmit : handleUpdateSubmit, control : controlUpdate, reset: resetUpdate } = useForm<showUpdateSheetForm>({
            defaultValues: {
                TITLE_SHEET_NAME: '',
                SHEET_NAME: '',
                ROW_NUMBER: '',
                COLUMN_NUMBER: '',
                CONTENT: '',
            },
        });

        const { getValues : getDeleteValues, handleSubmit : handleDeleteSubmit, control : controlDelete, reset: resetDelete } = useForm<showDeleteSheetForm>({
            defaultValues: {
                TITLE_SHEET_NAME: '',
                SHEET_NAME: '',
                ROW_NUMBER: '',
                COLUMN_NUMBER: '',
            },
        });

    const onReadSubmit = handleReadSubmit(async (readData: showReadSheetForm) => {
        const safeUserId = escapePixelString(data.userId);
        const safeSheetName = escapePixelString(readData.SHEET_NAME);
        const safeRowNumber = escapePixelString(readData.ROW_NUMBER);
        const safeColumnNumber = escapePixelString(readData.COLUMN_NUMBER);
        try{
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "read",userid="${safeUserId}",rowno="${safeRowNumber}",columnno="${safeColumnNumber}",sheetName="${safeSheetName}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`,
            );
            const outputRead = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("showReadSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showReadSheetForm">);
                setData("showReadForm", true as PathValue<SpreadsheetBlockDef["data"], "showReadForm">);
                setShowReadData(outputRead);
                resetRead();
            }else {
                throw new Error(outputRead);
            }
        }
        catch (error) {
            console.error("Error reading sheet data:", error);
        }
    });

    const onWriteSubmit = async (writeData: showWriteSheetForm) => {
        try{
            const safeUserId = escapePixelString(data.userId);
            const safeSheetName = escapePixelString(writeData.SHEET_NAME);
            const safeRowNumber = escapePixelString(writeData.ROW_NUMBER);
            const safeColumnNumber = escapePixelString(writeData.COLUMN_NUMBER);
            const writeDataContent = escapePixelString(writeData.CONTENT);
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "write",userid="${safeUserId}",rowno="${safeRowNumber}",columnno="${safeColumnNumber}",data="${writeDataContent}",sheetName="${safeSheetName}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`,
            );
            const outputWrite = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && outputWrite === "Data written successfully") {
                setData("showWriteSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showWriteSheetForm">);
                setData("showWriteForm", true as PathValue<SpreadsheetBlockDef["data"], "showWriteForm">);
                setShowResponseData(outputWrite);
                resetWrite();
            }else {
                throw new Error(outputWrite);
            }
        }
        catch (error) {
            console.error("Error writing sheet data:", error);
        }
    };

    const onUpdateSubmit = handleUpdateSubmit(async (updateData: showUpdateSheetForm) => {
        try{
            const safeUserId = escapePixelString(data.userId);
            const safeSheetName = escapePixelString(updateData.SHEET_NAME);
            const safeRowNumber = escapePixelString(updateData.ROW_NUMBER);
            const safeColumnNumber = escapePixelString(updateData.COLUMN_NUMBER);
            const updateDataContent = escapePixelString(updateData.CONTENT);
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "update",userid="${safeUserId}",rowno="${safeRowNumber}",columnno="${safeColumnNumber}",data="${updateDataContent}",sheetName="${safeSheetName}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`,
            );
            const outputUpdate = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("showUpdateSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showUpdateSheetForm">);
                setData("showUpdateForm", true as PathValue<SpreadsheetBlockDef["data"], "showUpdateForm">);
                setShowResponseData(outputUpdate);
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
        const safeUserId = escapePixelString(data.userId);
        const safeTitleSheetName = escapePixelString(deleteData.TITLE_SHEET_NAME);
        const safeSheetName = escapePixelString(deleteData.SHEET_NAME); 
        const safeRowNumber = escapePixelString(deleteData.ROW_NUMBER);
        const safeColumnNumber = escapePixelString(deleteData.COLUMN_NUMBER);
        if(deleteData.TITLE_SHEET_NAME !=='' && deleteData.SHEET_NAME === '' &&  deleteData.ROW_NUMBER === '' && deleteData.COLUMN_NUMBER === '') {
            setDeleteText(`Are you sure you want to delete the title sheet ${deleteData.TITLE_SHEET_NAME}? This action is permanent.`);
            setDeletePixelCall(`META | GoogleSheet(command = "delete sheet",userid="${safeUserId}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c",sheetName="${safeSheetName}");`);
        }
        else if(deleteData.TITLE_SHEET_NAME !=='' && deleteData.SHEET_NAME !== '' &&  deleteData.ROW_NUMBER === '' && deleteData.COLUMN_NUMBER === '') {
            setDeleteText(`Are you sure you want to delete sheet ${deleteData.SHEET_NAME}? This action is permanent.`);
            setDeletePixelCall(`META | GoogleSheet(command = "delete sheet",userid="${safeUserId}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c",sheetName="${safeSheetName}");`);
        }else if(deleteData.TITLE_SHEET_NAME !=='' && deleteData.SHEET_NAME !== '' && deleteData.ROW_NUMBER !== '' && deleteData.COLUMN_NUMBER !== '') {
            setDeleteText(`Are you sure you want to delete the data in sheet ${deleteData.SHEET_NAME} at row ${deleteData.ROW_NUMBER} and column ${deleteData.COLUMN_NUMBER}? This action is permanent.`);
            setDeletePixelCall(`META | GoogleSheet(command = "delete",userid="${safeUserId}",rowno="${safeRowNumber}",columnno="${safeColumnNumber}",sheetName="${safeSheetName}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`);
        }else{
            setDeleteText(`Please provide valid sheet name, row number and column number to delete the data.`);
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
                    {data.showReadSheetForm && (
                        <SpreadsheetForm
                            control={controlRead}
                            fields={[
                            { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true,type: "autocomplete", options:titleSheetOptions },
                            { name: "SHEET_NAME", label: "Sheet Name", required: true ,type: "autocomplete", options:sheetOptions},
                            { name: "ROW_NUMBER", label: "Row Number", required: true },
                            { name: "COLUMN_NUMBER", label: "Column Number", required: true },
                            ]}
                            onSubmit={onReadSubmit}
                            handleSubmit={handleReadSubmit}
                            reset={resetRead}
                        />
                    )}
                    {data.showReadForm && (
                        <div>
                            <h3>SpreadSheet Data read Successfully!</h3>   
                            <p> {`Sheet Data is: ${showReadData}`}</p>
                        </div>
                    )}
                    {data.showWriteSheetForm && (
                        <SpreadsheetForm
                            control={controlWrite}
                            fields={[
                            { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true,type: "autocomplete", options:titleSheetOptions },
                            { name: "SHEET_NAME", label: "Sheet Name", required: true,type: "autocomplete", options:sheetOptions },
                            { name: "ROW_NUMBER", label: "Row Number", required: true },
                            { name: "COLUMN_NUMBER", label: "Column Number", required: true },
                            { name: "CONTENT", label: "Content", type: "textarea", required: true },
                            ]}
                            onSubmit={onWriteSubmit}
                            handleSubmit={handleWriteSubmit}
                            reset={resetWrite}
                        />
                    )}
                    {data.showWriteForm && (
                        <div>
                            <h3>{showResponseData}</h3>
                        </div>
                    )}
                    {data.showUpdateSheetForm && (
                        <SpreadsheetForm
                            control={controlUpdate}
                            fields={[
                            { name: "TITLE_SHEET_NAME", label: "Title Sheet Name", required: true,type: "autocomplete", options:titleSheetOptions },
                            { name: "SHEET_NAME", label: "Sheet Name", required: true,type: "autocomplete", options:sheetOptions },
                            { name: "ROW_NUMBER", label: "Row Number", required: true },
                            { name: "COLUMN_NUMBER", label: "Column Number", required: true },
                            { name: "CONTENT", label: "Content", type: "textarea" , required: true },
                            ]}
                            onSubmit={onUpdateSubmit}
                            handleSubmit={handleUpdateSubmit}
                            reset={resetUpdate}
                        />
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
                            { name: "ROW_NUMBER", label: "Row Number", required: false },
                            { name: "COLUMN_NUMBER", label: "Column Number", required: false },
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
});