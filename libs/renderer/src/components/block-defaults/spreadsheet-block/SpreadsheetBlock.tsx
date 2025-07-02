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

const StyledButton = styled(Button)(({ theme }) => ({
    marginTop: '20px !important',
}));

type showReadSheetForm = {
    SHEET_NAME: string;
    ROW_NUMBER: string;
    COLUMN_NUMBER: string;
};

type showWriteSheetForm = {
    SHEET_NAME: string;
    ROW_NUMBER: string;
    COLUMN_NUMBER: string;
    CONTENT: string;
};

type showUpdateSheetForm = {
    SHEET_NAME: string;
    ROW_NUMBER: string;
    COLUMN_NUMBER: string;
    CONTENT: string;
};

type showDeleteSheetForm = {
    SHEET_NAME: string;
    ROW_NUMBER: string;
    COLUMN_NUMBER: string;
    CONTENT: string;
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
    const { setData } = useBlockSettings(id);
    const[showReadData, setShowReadData] = useState([]);
    const [showWriteData, setShowWriteData] = useState([]);
    const [showUpdateData, setShowUpdateData] = useState([]);   
    const [showDeleteData, setShowDeleteData] = useState([]);
    const [showcreatedJiraData, setShowCreatedJiraData] = useState('');
    const [showListedTickets,setShowListedTickets] = useState([]);
    const [projects, setProjects] = useState(['JIRADEMO', 'JiraTest']);
    const [issueTypes, setIssueTypes] = useState([]);
    const [isDelete, setIsDelete] = useState(false);
    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

    useEffect(() => {
        async function fetchJiraData() {
            try {
                const response = await runPixel<[string]>(
                    `META | Jira ( command = "get all projects", userid="${data.userId}" ) ;`,
                );
                const outputProjects = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {

                    setProjects(Array.isArray(outputProjects) ? outputProjects : [outputProjects]);
                } else {
                    throw new Error(response.errors[0]);
                }
            } catch (error) {
                console.error("Error fetching Jira projects:", error);
            }
            try {
                const response = await runPixel<[string]>(
                    `META | Jira ( command = "type of issue", userid="${data.userId}" ) ;`,
                );
                const outputIssues = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    console.log("Response from JiraGetIssues:", response);
                    setIssueTypes(Array.isArray(outputIssues) ? outputIssues : [outputIssues]);
                } else {
                    throw new Error(response.errors[0]);
                }
            } catch (error) {
                console.error("Error fetching Jira issue types:", error);
            }
        }
        fetchJiraData();
    },[data.userId]);

    if (!data.isStreaming) displayTxt = textContent;
    const { getValues:getReadValues, handleSubmit:handleReadSubmit, control:controlRead,reset:resetRead } = useForm<showReadSheetForm>({
            defaultValues: {
                SHEET_NAME: '',
                ROW_NUMBER: '',
                COLUMN_NUMBER: '',
            },
        });

        const { getValues : getWriteValues, handleSubmit : handleWriteSubmit, control : controlWrite, reset: resetWrite} = useForm<showWriteSheetForm>({
            defaultValues: {
                SHEET_NAME: '',
                ROW_NUMBER: '',
                COLUMN_NUMBER: '',
                CONTENT: '',
            },
        });

        const { getValues : getUpdateValues, handleSubmit : handleUpdateSubmit, control : controlUpdate, reset: resetUpdate } = useForm<showUpdateSheetForm>({
            defaultValues: {
                SHEET_NAME: '',
                ROW_NUMBER: '',
                COLUMN_NUMBER: '',
                CONTENT: '',
            },
        });

        const { getValues : getDeleteValues, handleSubmit : handleDeleteSubmit, control : controlDelete, reset: resetDelete } = useForm<showDeleteSheetForm>({
            defaultValues: {
                SHEET_NAME: '',
                ROW_NUMBER: '',
                COLUMN_NUMBER: '',
                CONTENT: '',
            },
        });

    const onReadSubmit = handleReadSubmit(async (readData: showReadSheetForm) => {
        try{
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "read",userid="${data.userId}",rowno="${readData.ROW_NUMBER}",colno="${readData.COLUMN_NUMBER},sheetName="${readData.SHEET_NAME}");`,
            );
            const outputRead = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("showReadSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showReadSheetForm">);
                setData("showReadForm", true as PathValue<SpreadsheetBlockDef["data"], "showReadForm">);
                //setShowReadData(outputRead);
                resetRead();
            }else {
                throw new Error(response.errors[0]);
            }
        }
        catch (error) {
            console.error("Error creating Jira issue:", error);
        }
    });

    const onWriteSubmit = handleWriteSubmit(async (writeData: showWriteSheetForm) => {
        try{
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "write",userid="${data.userId}",rowno="${writeData.ROW_NUMBER}",colno="${writeData.COLUMN_NUMBER},data="${writeData.CONTENT},"sheetName="${writeData.SHEET_NAME}");`,
            );
            const outputWrite = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("showWriteSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showWriteSheetForm">);
                setData("showWriteForm", true as PathValue<SpreadsheetBlockDef["data"], "showWriteForm">);
                //setShowWriteData(outputWrite);
                resetWrite();
            }else {
                throw new Error(response.errors[0]);
            }
        }
        catch (error) {
            console.error("Error listing Jira issue:", error);
        }
    });

    const onUpdateSubmit = handleUpdateSubmit(async (updatedata: showUpdateSheetForm) => {
        const updateValues = getUpdateValues();
        try{
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command = "update",userid="${data.userId}",rowno="${updatedata.ROW_NUMBER}",colno="${updatedata.COLUMN_NUMBER},data="${updatedata.CONTENT},"sheetName="${updatedata.SHEET_NAME}");`,
            );
            const outputUpdate = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("showUpdateSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showUpdateSheetForm">);
                setData("showUpdateForm", true as PathValue<SpreadsheetBlockDef["data"], "showUpdateForm">);
                //setShowUpdateData(outputUpdate);
                resetUpdate();
            }else {
                throw new Error(response.errors[0]);
            }
        }
        catch (error) {
            console.error("Error listing Jira issue:", error);
        }
    });

    const deleteSheet = async () => {
        const deleteValues = getDeleteValues();
        try{
            const response = await runPixel<[string]>(
                `META | GoogleSheet(command ="delete",userid="${data.userId}",rowno="${deleteValues.ROW_NUMBER}",colno="${deleteValues.COLUMN_NUMBER},"sheetName="${deleteValues.SHEET_NAME}");`,
            );
            const outputDelete = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("showDeleteSheetForm", false as PathValue<SpreadsheetBlockDef["data"], "showDeleteSheetForm">);
                setData("showDeleteForm", true as PathValue<SpreadsheetBlockDef["data"], "showDeleteForm">);
                //setShowCreatedJiraData(outputDelete);
                resetDelete();
                setIsDelete(false);
            }else {
                throw new Error(response.errors[0]);
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
                        <form onSubmit={onReadSubmit}>
                                <Stack direction="column" spacing={2} style={{ paddingTop: '10px' }}>
                                    <Controller
                                        name={'SHEET_NAME'}
                                        control={controlRead}
                                        rules={{ required: "Sheet Name is required" }}
                                        render={({ field ,fieldState}) => (
                                            <Autocomplete
                                                options={projects}
                                                multiple={false}
                                                getOptionLabel={(option) => option} 
                                                value={field.value || null} 
                                                onChange={(event, newValue) => field.onChange(newValue)} 
                                                isOptionEqualToValue={(option, value) => option === value} 
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Sheet Name"
                                                        error={!!fieldState.error}
                                                        fullWidth
                                                        inputProps={{
                                                            ...params.inputProps,
                                                            'data-testid': 'newAppModal-dropdown-issueType',
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name={'ROW_NUMBER'}
                                        control={controlRead}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Row Number"
                                                    value={field.value ? field.value : ''}
                                                    disabled={false}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                    inputProps={{
                                                        'data-testid':
                                                            'newAppModal-textField-name',
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    <Controller
                                        name={'COLUMN_NUMBER'}
                                        control={controlRead}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Column Number"
                                                    value={field.value ? field.value : ''}
                                                    disabled={false}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                    inputProps={{
                                                        'data-testid':
                                                            'newAppModal-textField-name',
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                </Stack>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    paddingX={2}
                                    paddingBottom={2}
                                >
                                    <StyledButton
                                        type="button"
                                        disabled={false}
                                        onClick={() => resetRead()}
                                    >
                                        Reset
                                    </StyledButton>
                                    <StyledButton
                                        type="submit"
                                        variant={'contained'}
                                        disabled={false}
                                    >
                                        Submit
                                    </StyledButton>
                                </Stack>
                        </form>
                    )}
                    {data.showReadForm && (
                        <div>
                            <h3>Jira Issue Created Successfully!</h3>   
                            <p> {showcreatedJiraData.split(',')[0]}</p>
                            <p>{showcreatedJiraData.split(',')[1]}</p>
                            <p><strong>Project:</strong> {showcreatedJiraData['self']}</p>
                        </div>
                    )}
                    {data.showWriteSheetForm && (
                        <form onSubmit={onWriteSubmit}>
                            <Stack direction="column" spacing={2} style={{ paddingTop: '10px' }}>
                            <Controller
                                name={'SHEET_NAME'}
                                control={controlWrite}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            label="Sheet Number"
                                            value={field.value ? field.value : ''}
                                            disabled={false}
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                            fullWidth={true}
                                            inputProps={{
                                                'data-testid':
                                                    'newAppModal-textField-name',
                                            }}
                                        />
                                    );
                                }}
                                    />
                                <Controller
                                        name={'ROW_NUMBER'}
                                        control={controlWrite}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Row Number"
                                                    value={field.value ? field.value : ''}
                                                    disabled={false}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                    inputProps={{
                                                        'data-testid':
                                                            'newAppModal-textField-name',
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    <Controller
                                        name={'COLUMN_NUMBER'}
                                        control={controlWrite}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Column Number"
                                                    value={field.value ? field.value : ''}
                                                    disabled={false}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                    inputProps={{
                                                        'data-testid':
                                                            'newAppModal-textField-name',
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    <Controller
                                        name={'CONTENT'}
                                        control={controlWrite}
                                        rules={{ required: false }}
                                        render={({ field }) => {
                                            return (
                                                <TextArea
                                                    label="Content"
                                                    variant="outlined"
                                                    value={field.value ? field.value : ''}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    rows={3}
                                                />
                                            );
                                        }}
                                    />
                            </Stack>

                            <Stack
                                direction="row"
                                spacing={1}
                                paddingX={2}
                                paddingBottom={2}
                            >
                                <StyledButton
                                    type="button"
                                    disabled={false}
                                    onClick={() => resetWrite()}
                                >
                                    Reset
                                </StyledButton>
                                <StyledButton
                                    type="submit"
                                    variant={'contained'}
                                    disabled={false}
                                >
                                    Submit
                                </StyledButton>
                            </Stack>
                        </form>
                    )}
                    {data.showWriteForm && (
                        <div>
                            <h3>Listed Jira Tickets</h3>
                            {showListedTickets.length > 0 ? (
                                showListedTickets.map((ticket,id)=><h4>{`Ticket Number ${id}:${ticket}`}</h4>)
                            ):''}
                        </div>
                    )}
                    {data.showUpdateSheetForm && (
                        <form onSubmit={onUpdateSubmit}>
                                <Stack direction="column" spacing={2} style={{ paddingTop: '10px' }}>
                                    <Controller
                                        name={'SHEET_NAME'}
                                        control={controlUpdate}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Autocomplete
                                                options={projects}
                                                multiple={false}
                                                getOptionLabel={(option) => option} 
                                                value={field.value || null} 
                                                onChange={(event, newValue) => field.onChange(newValue)} 
                                                isOptionEqualToValue={(option, value) => option === value} 
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Sheet Number"
                                                        fullWidth
                                                        inputProps={{
                                                            ...params.inputProps,
                                                            'data-testid': 'newAppModal-dropdown-issueType',
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name={'ROW_NUMBER'}
                                        control={controlUpdate}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Row Number"
                                                    value={field.value ? field.value : ''}
                                                    disabled={false}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                    inputProps={{
                                                        'data-testid':
                                                            'newAppModal-textField-name',
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    <Controller
                                        name={'COLUMN_NUMBER'}
                                        control={controlUpdate}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Column Number"
                                                    value={field.value ? field.value : ''}
                                                    disabled={false}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                    inputProps={{
                                                        'data-testid':
                                                            'newAppModal-textField-name',
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    <Controller
                                        name={'CONTENT'}
                                        control={controlUpdate}
                                        rules={{ required: false }}
                                        render={({ field }) => {
                                            return (
                                                <TextArea
                                                    label="Content"
                                                    variant="outlined"
                                                    value={field.value ? field.value : ''}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    rows={3}
                                                />
                                            );
                                        }}
                                    />
                                </Stack>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    paddingX={2}
                                    paddingBottom={2}
                                >
                                    <StyledButton
                                        type="button"
                                        disabled={false}
                                        onClick={() => resetUpdate()}
                                    >
                                        Reset
                                    </StyledButton>
                                    <StyledButton
                                        type="submit"
                                        variant={'contained'}
                                        disabled={false}
                                    >
                                        Submit
                                    </StyledButton>
                                </Stack>
                        </form>
                    )}
                    {data.showUpdateForm && (
                        <div>
                            <h3>Listed Jira Tickets</h3>
                            {showListedTickets.length > 0 ? (
                                showListedTickets.map((ticket,id)=><h4>{`Ticket Number ${id}:${ticket}`}</h4>)
                            ):''}
                        </div>
                    )}
                    {data.showDeleteSheetForm && (
                        <form onSubmit={()=> setIsDelete(true)}>
                                <Stack direction="column" spacing={2} style={{ paddingTop: '10px' }}>
                                    <Controller
                                        name={'SHEET_NAME'}
                                        control={controlDelete}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Autocomplete
                                                options={projects}
                                                multiple={false}
                                                getOptionLabel={(option) => option} 
                                                value={field.value || null} 
                                                onChange={(event, newValue) => field.onChange(newValue)} 
                                                isOptionEqualToValue={(option, value) => option === value} 
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Sheet Number"
                                                        fullWidth
                                                        inputProps={{
                                                            ...params.inputProps,
                                                            'data-testid': 'newAppModal-dropdown-issueType',
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name={'ROW_NUMBER'}
                                        control={controlDelete}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Row Number"
                                                    value={field.value ? field.value : ''}
                                                    disabled={false}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                    inputProps={{
                                                        'data-testid':
                                                            'newAppModal-textField-name',
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                    <Controller
                                        name={'COLUMN_NUMBER'}
                                        control={controlDelete}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Column Number"
                                                    value={field.value ? field.value : ''}
                                                    disabled={false}
                                                    onChange={(value) =>
                                                        field.onChange(value)
                                                    }
                                                    fullWidth={true}
                                                    inputProps={{
                                                        'data-testid':
                                                            'newAppModal-textField-name',
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                </Stack>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                    paddingX={2}
                                    paddingBottom={2}
                                >
                                    <StyledButton
                                        type="button"
                                        disabled={false}
                                        onClick={() => resetRead()}
                                    >
                                        Reset
                                    </StyledButton>
                                    <StyledButton
                                        type="submit"
                                        variant={'contained'}
                                        disabled={false}
                                    >
                                        Submit
                                    </StyledButton>
                                </Stack>
                        </form>
                    )}
                    {data.showDeleteForm && (
                        <div>
                            <h3>Listed Jira Tickets</h3>
                            {showListedTickets.length > 0 ? (
                                showListedTickets.map((ticket,id)=><h4>{`Ticket Number ${id}:${ticket}`}</h4>)
                            ):''}
                        </div>
                    )}
                    {isDelete &&(
                        <Modal onClose={close} open={isDelete}>
                            <Modal.Content>
                                <Modal.Title>Delete Job</Modal.Title>
                                <Modal.Content>
                                    <Typography variant="body1">
                                        Are you sure you want to delete.
                                        This action is permanent.
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