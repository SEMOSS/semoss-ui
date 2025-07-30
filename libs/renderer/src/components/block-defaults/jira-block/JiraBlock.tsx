import React, { CSSProperties, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";

import { useBlock, useTypeWriter, useBlocks} from "../../../hooks";
import { BlockDef, BlockComponent,Block,ActionMessages} from "../../../store";
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
    Typography,
    useNotification
} from '@semoss/ui';
import { useCallback } from "react";
import { PathValue,Paths } from "../../../types";

const StyledButton = styled(Button)(() => ({
    marginTop: '20px !important',
}));

type CreateNewJiraForm = {
    JIRA_SUMMARY: string;
    JIRA_DESCRIPTION: string;
    JIRA_ISSUE_TYPE: string;
    JIRA_PROJECT: string;
};

type ListAllJiraTicketsForm = {
    JIRA_ID: string;
    JIRA_PROJECT_ID: string;
};

type SaveAPIKeyForm = {
    APIKEY: string;
    USERID: string;
    URL: string;
    NAME: string;
    PROJECTS: string;
}

interface useBlockSettingsReturn<D extends BlockDef = BlockDef> {
    setData: <P extends Paths<Block<D>["data"], 4>>(
        path: P,
        value: PathValue<D["data"], P>,
    ) => void;
}

export interface JiraBlockDef extends BlockDef<"jira"> {
    widget: "jira";
    data: {
        style: CSSProperties;
        text: string;
        variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
        isStreaming: boolean;
        show: string;
        showCreateJiraForm: boolean;
        showCreatedJiraForm: boolean;
        listAllTickets: boolean;
        listedTickets: boolean;
        userId: string;
        jiraConnectionValue: string;
        jiraActionValue: string;
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

export const JiraBlock: BlockComponent = observer(({ id }) => {
    const notification = useNotification();
    const block = useBlock<JiraBlockDef>(id);
    const state = useBlocks();
    const { data} = block;
    const { setData } = useBlockSettings(id);
    const [showcreatedJiraData, setShowCreatedJiraData] = useState('');
    const [showListedTickets,setShowListedTickets] = useState([]);
    const [projects, setProjects] = useState([]);
    const [jiraData, setJiraData] = useState<any>(null);
    const [selectedConnection,setSelectedConnection]= useState('');
    const [allTickets,setAllTickets]=useState([]);
    const [isDelete,setIsDelete]=useState('');
    const [projectsData, setProjectsData] = useState([]);
    const [addModal, setAddModal] = useState(false);
    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

    const escapePixelString = (str: string) => {
        if (typeof str !== 'string') return '';
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\"/g, '\\"');
    }

    const getAllTickets = async (keyName: string) => {
        const safeKeyName = escapePixelString(keyName);
        try {
            const response = await runPixel<[string[]]>(
                `META | JiraGetTickets(keyname="${safeKeyName}");`,
            );
            if (!response.pixelReturn?.length) {
                throw new Error("Empty response from Jira Pixel call");
            }
            const outputTickets = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                console.log('all tickets', outputTickets);
                setAllTickets(outputTickets);
            } else {
                throw new Error(response.errors[0]);
            }
        } catch (error) {
            console.error("Error fetching Jira tickets:", error);
        }
    };

    useEffect(() => {
        async function fetchJiraData() {
            const safeKeyName = escapePixelString(data.userId);
            try {
                const response = await runPixel<[string]>(
                    `META | JiraGetAllProject (keyname="${safeKeyName}" ) ;`,
                );
                if (!response.pixelReturn?.length) {
                    throw new Error("Empty response from Jira Pixel call");
                }
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
        }
        fetchJiraData();
    },[data.userId]);

    async function fetchData() {
        const safeKeyName = escapePixelString(data.userId);
        try {
            const response = await runPixel<[string[]]>(
                `META | JiraGetApiKeys()`,
            );
            if (!response.pixelReturn?.length) {
                throw new Error("Empty response from Jira Pixel call");
            }
            const outputProjects = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                const userData = outputProjects.map((item: any) => item.keyName);
                setJiraData(userData);
            } else {
                throw new Error(response.errors[0]);
            }
        } catch (error) {
            console.error("Error fetching Jira projects:", error);
        }
    }

    useEffect(()=>{
        fetchData();
    },[]);

    if (!data.isStreaming) displayTxt = textContent;
    const { handleSubmit:handleCreateSubmit, control:controlCreate,reset:resetCreate } = useForm<CreateNewJiraForm>({
            defaultValues: {
                JIRA_SUMMARY: '',
                JIRA_DESCRIPTION: '',
                JIRA_ISSUE_TYPE: '',
                JIRA_PROJECT: '',
            },
        });

    const { getValues : getValues1, handleSubmit : handleSubmit1, control : control1, reset: reset1 } = useForm<ListAllJiraTicketsForm>({
        defaultValues: {
            JIRA_PROJECT_ID: '',
        },
    });

    const { getValues:getSaveValues,control:controlSave, reset:resetSave, handleSubmit:handleSaveSubmit } = useForm<SaveAPIKeyForm>({
            defaultValues: {
                APIKEY: '',
                USERID: '',
                URL: '',
                NAME: '',
                PROJECTS: '',
            },
        });

    const onSubmit = handleCreateSubmit(async (createData: CreateNewJiraForm) => {
        const safeSummary = escapePixelString(createData.JIRA_SUMMARY);
        const safeDescription = escapePixelString(createData.JIRA_DESCRIPTION);
        const safeIssueType = escapePixelString(createData.JIRA_ISSUE_TYPE);
        try{
            const response = await runPixel<[string]>(
                `META | JiraCreateTicket(keyname="${selectedConnection}",summary = "${safeSummary}",description = "${safeDescription}",issuetype = "${safeIssueType}");`,
            );
            if (!response.pixelReturn?.length) {
                throw new Error("Empty response from Jira Pixel call");
            }
            const output1 = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                getAllTickets(selectedConnection);
                setData("showCreateJiraForm", false as PathValue<JiraBlockDef["data"], "showCreateJiraForm">);
                setData("listAllTickets", true as PathValue<JiraBlockDef["data"], "listAllTickets">);
                resetCreate();
            }else {
                throw new Error(response.errors[0]);
            }
        }
        catch (error) {
            console.error("Error creating Jira issue:", error);
        }
    });

    const onSubmit1 = handleSubmit1(async (data2: ListAllJiraTicketsForm) => {
        const inputValues = getValues1();
        const safeKeyName = escapePixelString(data.userId);
        const safeProjectId = escapePixelString(inputValues.JIRA_PROJECT_ID);
        try{
            const response = await runPixel<[string]>(
                `META | JiraListAllTicket (keyname="${safeKeyName}",project="${safeProjectId}" ) ;`,
            );
            if (!response.pixelReturn?.length) {
                throw new Error("Empty response from Jira Pixel call");
            }
            const output2 = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("listAllTickets", false as PathValue<JiraBlockDef["data"], "listAllTickets">);
                setData("listedTickets", true as PathValue<JiraBlockDef["data"], "listedTickets">);
                const tickets = Array.isArray(output2) ? output2 : [output2];
                setShowListedTickets(tickets)
                reset1();
            }else {
                throw new Error(response.errors[0]);
            }
        }
        catch (error) {
            console.error("Error listing Jira issue:", error);
        }
    });

    const deleteTicket = async () => {
        const safeKeyName = escapePixelString(selectedConnection);
        const safeJiraId = escapePixelString(isDelete);
        try {
            const response = await runPixel<[string]>(
                `META | JiraDeleteTicket(keyname="${safeKeyName}",jiraid="${safeJiraId}");`,
            );
            if (!response.pixelReturn?.length) {
                throw new Error("Empty response from Jira Pixel call");
            }
            const output = response.pixelReturn[0].output['success'];
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && output=== 'true') {
                setIsDelete('');
                getAllTickets(selectedConnection);
            } else {
                throw new Error(response.errors[0]);
            }
        } catch (error) {
            console.error("Error deleting Jira ticket:", error);
        }
    };

    const getProjectsData = async () => {
        const projectDetails = getSaveValues();
        try {
            const response = await runPixel<[string[]]>(
                `META | JiraGetProjects(url="${escapePixelString(projectDetails.URL)}",userid="${escapePixelString(projectDetails.USERID)}",apikey="${escapePixelString(projectDetails.APIKEY)}")`
            );
            if (!response.pixelReturn?.length) {
                throw new Error("Empty response from Jira Pixel call");
            }
            const output = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 ) {
                setProjectsData(output);
                notification.add({
                    color: 'success',
                    message: 'Successfully fetched the projects.',
                });
            } else {
                throw new Error(response.errors[0]);
            }
        } catch (error) {
            console.error("Error deleting Jira ticket:", error);
        }
    };

    const SaveAPIKey = async (data: SaveAPIKeyForm) => {
        const safeUserId = escapePixelString(data.USERID);
        const safeApiKey = escapePixelString(data.APIKEY);
        const safeUrl = escapePixelString(data.URL);
        const safeName = escapePixelString(data.NAME);
        const safeProject = escapePixelString(data.PROJECTS);
        try {
            const response = await runPixel<[string]>(
                `META | JiraInsertApikey(userid="${safeUserId}",apikey="${safeApiKey}",url="${safeUrl}",keyname="${safeName}",project="${safeProject}")`
            );
            if (!response.pixelReturn?.length) {
                throw new Error("Empty response from Jira Pixel call");
            }
            const output = response.pixelReturn[0].output['success'];
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1 && output === true ) {
                notification.add({
                    color: 'success',
                    message: 'Successfully inserted Jira credentials.',
                });
                fetchData();
                setAddModal(false);
                resetSave({});
            } else {
                throw new Error(response.errors[0]);
            }
        } catch (error) {
            console.error("Error deleting Jira ticket:", error);
        }
    };

    const closeModel = () => {
        setAddModal(false);
        resetSave({});
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: 16 }}>
                        <Button
                            type="button"
                            variant={'outlined'}
                            color="primary"
                            data-testid={'my-jira-profile-page-generate-btn'}
                            onClick={()=>setAddModal(true)}
                        >
                            Create New Connection
                        </Button>
                    </div>
                    <Autocomplete
                        options={jiraData || []}
                        getOptionLabel={(option) => option}
                        value={selectedConnection}
                        onChange={(event, newValue) => {
                            setSelectedConnection(newValue);
                            getAllTickets(newValue);
                            setData("listAllTickets", true as PathValue<JiraBlockDef["data"], "listAllTickets">);
                        }}
                        multiple={false}
                        renderInput={(params) => (
                            <TextField {...params} label="Connections" fullWidth />
                        )}
                    />
                    {data.listAllTickets && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: 16, marginTop:20}}>
                                <Button
                                    type="button"
                                    variant={'outlined'}
                                    color="primary"
                                    data-testid={'my-jira-profile-page-generate-btn'}
                                    onClick={()=>{
                                        setData("listAllTickets", false as PathValue<JiraBlockDef["data"], "listAllTickets">)
                                        setData("showCreateJiraForm", true as PathValue<JiraBlockDef["data"], "showCreateJiraForm">);
                                    }}
                                >
                                    Create New Ticket
                                </Button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, marginTop: 24 }}>
                                {allTickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        style={{
                                            position: 'relative',
                                            width: 600, // fixed width for each card
                                            background: '#fff',
                                            borderRadius: 12,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                            padding: 24,
                                            margin: 8,
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <button
                                            style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            background: 'transparent',
                                            border: 'none',
                                            fontSize: 18,
                                            cursor: 'pointer',
                                            color: '#d32f2f'
                                            }}
                                            onClick={()=> setIsDelete(ticket.id)}
                                            aria-label="Delete"
                                            title="Delete"
                                        >
                                            Delete
                                        </button>
                                        <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>ID: {ticket.id}</div>
                                        <div style={{ marginBottom: 8 }}>
                                            <a href={ticket.link} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', wordBreak: 'break-all' }}>
                                            {ticket.link}
                                            </a>
                                        </div>
                                        <div style={{ fontSize: 16 }}>{ticket.summary}</div>
                                    </div>
                                ))}
                            </div>      
                        </>

                    )}
                    {data.showCreateJiraForm && (
                        <form onSubmit={onSubmit}>
                                <Stack direction="column" spacing={1} style={{ paddingTop: '10px' }}>
                                    <Controller
                                        name={'JIRA_ISSUE_TYPE'}
                                        control={controlCreate}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Autocomplete
                                                options={["Epic", "Story", "Task", "Bug", "Subtask"]}
                                                multiple={false}
                                                getOptionLabel={(option) => option}
                                                value={field.value || null}
                                                onChange={(event, newValue) => field.onChange(newValue)}
                                                isOptionEqualToValue={(option, value) => option === value} 
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Issue Type"
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
                                        name={'JIRA_SUMMARY'}
                                        control={controlCreate}
                                        rules={{ required: true }}
                                        render={({ field }) => {
                                            return (
                                                <TextField
                                                    label="Summary"
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
                                        name={'JIRA_DESCRIPTION'}
                                        control={controlCreate}
                                        rules={{ required: false }}
                                        render={({ field }) => {
                                            return (
                                                <TextArea
                                                    label="Description"
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
                                        onClick={() => resetCreate()}
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
                    {data.showCreatedJiraForm && (
                        <div>
                            <h3>Jira Issue Created Successfully!</h3>   
                            <p> {showcreatedJiraData.split(',')[0]}</p>
                            <p>{showcreatedJiraData.split(',')[1]}</p>
                        </div>
                    )}
                    {/* {data.listAllTickets && (
                        <form onSubmit={onSubmit1}>
                            <Stack direction="column" spacing={1} style={{ paddingTop: '10px' }}>
                                <Controller
                                    name={'JIRA_PROJECT_ID'}
                                    control={control1}
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
                                                    label="Project"
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
                                    onClick={() => reset1()}
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
                    )} */}
                    {data.listedTickets && (
                        <div>
                            <h3>Listed Jira Tickets</h3>
                            {showListedTickets.length > 0 ? (
                                showListedTickets.map((ticket,id)=><h4 key={`jira-ticket-${id}`}>{`Ticket Number ${id}:${ticket}`}</h4>)
                            ):''}
                        </div>
                    )}
                    {isDelete &&(
                        <Modal onClose={()=> setIsDelete('')} open={isDelete!==''}>
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
                                        onClick={()=> setIsDelete('')}
                                        data-testid={'delete-job-cancel-btn'}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={deleteTicket}
                                        data-testid={'delete-job-delete-btn'}
                                    >
                                        Delete
                                    </Button>
                                </Modal.Actions>
                            </Modal.Content>
                        </Modal>
                    )}
                    {
                        <Modal open={addModal} onClose={() => closeModel()} maxWidth="lg">
                            <Modal.Title>Save Key</Modal.Title>
                            <Modal.Content>
                                <Stack
                                    sx={{ width: '800px' }}
                                    spacing={4}
                                    style={{ paddingTop: '10px' }}
                                >
                                    <form
                                        onSubmit={handleSaveSubmit(SaveAPIKey)}
                                        className="my-jira-profile-page__generate-key-form"
                                    >
                                        <Stack direction="column" spacing={2}>

                                            <Controller
                                                name={'NAME'}
                                                control={controlSave}
                                                rules={{ required: true }}
                                                render={({ field }) => {
                                                    return (
                                                        <TextField
                                                            required
                                                            label="Name"
                                                            value={
                                                                field.value
                                                                    ? field.value
                                                                    : ''
                                                            }
                                                            onChange={(value) =>
                                                                field.onChange(value)
                                                            }
                                                            inputProps={{ maxLength: 500 }}
                                                        ></TextField>
                                                    );
                                                }}
                                            />

                                            <Controller
                                                name={'URL'}
                                                control={controlSave}
                                                rules={{ required: true }}
                                                render={({ field }) => {
                                                    return (
                                                        <TextField
                                                            required
                                                            label="URL"
                                                            value={
                                                                field.value
                                                                    ? field.value
                                                                    : ''
                                                            }
                                                            onChange={(value) =>
                                                                field.onChange(value)
                                                            }
                                                            inputProps={{ maxLength: 500 }}
                                                        ></TextField>
                                                    );
                                                }}
                                            />

                                            <Controller
                                                name={'USERID'}
                                                control={controlSave}
                                                rules={{ required: true }}
                                                render={({ field }) => {
                                                    return (
                                                        <TextField
                                                            required
                                                            label="User Id"
                                                            value={
                                                                field.value
                                                                    ? field.value
                                                                    : ''
                                                            }
                                                            onChange={(value) =>
                                                                field.onChange(value)
                                                            }
                                                            inputProps={{ maxLength: 500 }}
                                                        ></TextField>
                                                    );
                                                }}
                                            />

                                            <Controller
                                                name={'APIKEY'}
                                                control={controlSave}
                                                rules={{ required: true }}
                                                render={({ field }) => {
                                                    return (
                                                        <TextField
                                                            required
                                                            label="API Key"
                                                            value={
                                                                field.value
                                                                    ? field.value
                                                                    : ''
                                                            }
                                                            onChange={(value) =>
                                                                field.onChange(value)
                                                            }
                                                            inputProps={{ maxLength: 255 }}
                                                        ></TextField>
                                                    );
                                                }}
                                            />

                                            <Button
                                                    type="button"
                                                    variant={'outlined'}
                                                    color="primary"
                                                    data-testid={
                                                        'my-jira-profile-page-generate-btn'
                                                    }
                                                    onClick={getProjectsData}
                                                >
                                                    Get Projects
                                            </Button>

                                            <Controller
                                                name="PROJECTS"
                                                control={controlSave}
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <Stack spacing={1}>
                                                        <Autocomplete
                                                            options={projectsData || []}
                                                            getOptionLabel={(option) => option}
                                                            multiple={false}
                                                            value={field.value}
                                                            onChange={(event, newValue) => {
                                                                field.onChange(newValue);

                                                            }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="Projects"
                                                                    fullWidth
                                                                />
                                                            )}
                                                        />
                                                    </Stack>
                                                )}
                                            />

                                            <Stack direction="row" justifyContent={'start'}>
                                                <Button
                                                    type="submit"
                                                    variant={'outlined'}
                                                    color="primary"
                                                    data-testid={
                                                        'my-jira-profile-page-generate-btn'
                                                    }
                                                >
                                                    Save
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </form>
                                </Stack>
                            </Modal.Content>
                            <Modal.Actions>
                                <Button variant="text" onClick={() => closeModel()}>
                                    Close
                                </Button>
                            </Modal.Actions>
                        </Modal>
                    }
                </div>
            ) : (
                <p
                    style={{
                        ...data.style,
                        marginBlockStart: "0px",
                        marginBlockEnd: "0px",
                    }}
                >
                    Jira Block
                </p>
            )}
        </div>
    )
});