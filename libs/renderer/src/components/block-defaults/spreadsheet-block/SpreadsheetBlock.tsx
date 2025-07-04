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
    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

    useEffect(() => {
        // async function fetchJiraData() {
        //     if(data.showDeleteSheetForm=== true) {


        //     }
        //     try {
        //         const response = await runPixel<[string]>(
        //             `META | Jira ( command = "get all projects", userid="${data.userId}" ) ;`,
        //         );
        //         const outputProjects = response.pixelReturn[0].output;
        //         const type = response.pixelReturn[0].operationType;
        //         if (type.indexOf('ERROR') === -1) {

        //             setProjects(Array.isArray(outputProjects) ? outputProjects : [outputProjects]);
        //         } else {
        //             throw new Error(response.errors[0]);
        //         }
        //     } catch (error) {
        //         console.error("Error fetching Jira projects:", error);
        //     }
        //     try {
        //         const response = await runPixel<[string]>(
        //             `META | Jira ( command = "type of issue", userid="${data.userId}" ) ;`,
        //         );
        //         const outputIssues = response.pixelReturn[0].output;
        //         const type = response.pixelReturn[0].operationType;
        //         if (type.indexOf('ERROR') === -1) {
        //             console.log("Response from JiraGetIssues:", response);
        //             setIssueTypes(Array.isArray(outputIssues) ? outputIssues : [outputIssues]);
        //         } else {
        //             throw new Error(response.errors[0]);
        //         }
        //     } catch (error) {
        //         console.error("Error fetching Jira issue types:", error);
        //     }
        // }
        // fetchJiraData();
    },[data.userId]);

    // useEffect(()=>{
    //     console.log('useEffect called with data:', data);
    //     if(data.showReadSheetForm===true){
    //         setControlForm(controlRead);
    //         setSubmitHandler(() => (e: React.FormEvent<HTMLFormElement>) => {
    //             handleWriteSubmit(onWriteSubmit)(e);
    //         });
    //     }else if(data.showWriteSheetForm===true){
    //         setControlForm(controlWrite);
    //         setSubmitHandler(() => (e: React.FormEvent<HTMLFormElement>) => {
    //             handleWriteSubmit(onWriteSubmit)(e);
    //         });

    //     }else if(data.showUpdateSheetForm===true){  
    //         setControlForm(controlUpdate);
    //         setSubmitHandler(() => (e: React.FormEvent<HTMLFormElement>) => {
    //             handleWriteSubmit(onWriteSubmit)(e);
    //         });
    //     } else{
    //         setControlForm(controlDelete); 
    //         setSubmitHandler(() => (e: React.FormEvent<HTMLFormElement>) => {
    //             handleWriteSubmit(onWriteSubmit)(e);
    //         });
    //     }
    // },[data.showReadSheetForm, data.showWriteSheetForm, data.showUpdateSheetForm, data.showDeleteSheetForm]);

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
        try{
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "read",userid="${data.userId}",rowno="${readData.ROW_NUMBER}",columnno="${readData.COLUMN_NUMBER}",sheetName="${readData.SHEET_NAME}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`,
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
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "write",userid="${data.userId}",rowno="${writeData.ROW_NUMBER}",columnno="${writeData.COLUMN_NUMBER}",data="${writeData.CONTENT}",sheetName="${writeData.SHEET_NAME}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`,
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
        const updateValues = getUpdateValues();
        try{
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "update",userid="${data.userId}",rowno="${updateData.ROW_NUMBER}",columnno="${updateData.COLUMN_NUMBER}",data="${updateData.CONTENT}",sheetName="${updateData.SHEET_NAME}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`,
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
        console.log("Delete Data:", deleteData);
        if(deleteData.SHEET_NAME !== '' &&  deleteData.ROW_NUMBER === '' && deleteData.COLUMN_NUMBER === '') {
            console.log('hello1');
            setDeleteText(`Are you sure you want to delete sheet ${deleteData.SHEET_NAME}? This action is permanent.`);
            setDeletePixelCall(`META | GoogleSheet(command = "delete sheet",userid="${data.userId}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c",sheetName="${deleteData.SHEET_NAME}");`);
        }else if(deleteData.SHEET_NAME !== '' && deleteData.ROW_NUMBER !== '' && deleteData.COLUMN_NUMBER !== '') {
            console.log('hello2');
            setDeleteText(`Are you sure you want to delete the data in sheet ${deleteData.SHEET_NAME} at row ${deleteData.ROW_NUMBER} and column ${deleteData.COLUMN_NUMBER}? This action is permanent.`);
            setDeletePixelCall(`META | GoogleSheet(command = "delete",userid="${data.userId}",rowno="${deleteData.ROW_NUMBER}",columnno="${deleteData.COLUMN_NUMBER}",sheetName="${deleteData.SHEET_NAME}",spreadSheetId="1dwaxnAiGF3AE-FJiasitdmqS4XInNPs2GbK1eJQVU5c");`);
        }else{
            console.log('hello3');
            setDeleteText(`Please provide valid sheet name, row number and column number to delete the data.`);
        }
        console.log("Delete Text:", deleteText);
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
                            { name: "SHEET_NAME", label: "Sheet Name", required: true },
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
                            { name: "SHEET_NAME", label: "Sheet Name", required: true },
                            { name: "ROW_NUMBER", label: "Row Number", required: true },
                            { name: "COLUMN_NUMBER", label: "Column Number", required: true },
                            { name: "CONTENT", label: "Content", type: "textarea" },
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
                            { name: "SHEET_NAME", label: "Sheet Name", required: true },
                            { name: "ROW_NUMBER", label: "Row Number", required: true },
                            { name: "COLUMN_NUMBER", label: "Column Number", required: true },
                            { name: "CONTENT", label: "Content", type: "textarea" },
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
                            { name: "SHEET_NAME", label: "Sheet Name", required: true },
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