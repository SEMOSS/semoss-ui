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
} from '@semoss/ui';

import { PathValue } from "../../../types";

const StyledButton = styled(Button)(({ theme }) => ({
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

export interface JiraBlockDef extends BlockDef<"jiratext"> {
    widget: "jiratext";
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

export const JiraBlock: BlockComponent = observer(({ id }) => {
    const block = useBlock<JiraBlockDef>(id);
    const state = useBlocks();
    const { data} = block;
    const { setData } = useBlockSettings(id);
    const [showcreatedJiraData, setShowCreatedJiraData] = useState('');
    const [showListedTickets,setShowListedTickets] = useState([]);
    const [projects, setProjects] = useState(['JIRADEMO', 'JiraTest']);
    const [issueTypes, setIssueTypes] = useState([]);
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
    const { getValues, handleSubmit, control, watch,reset } = useForm<CreateNewJiraForm>({
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

    const onSubmit = handleSubmit(async (data1: CreateNewJiraForm) => {
        const inputValues = getValues();
        try{
            const response = await runPixel<[string]>(
                `META | Jira(command = "Create new ticket", summary = "${inputValues.JIRA_SUMMARY}",description = "${inputValues.JIRA_DESCRIPTION}",issuetype = "${inputValues.JIRA_ISSUE_TYPE}",project="${inputValues.JIRA_PROJECT}",userid="${data.userId}");`,
            );
            const output1 = response.pixelReturn[0].output;
            const type = response.pixelReturn[0].operationType;
            if (type.indexOf('ERROR') === -1) {
                setData("showCreateJiraForm", false as PathValue<JiraBlockDef["data"], "showCreateJiraForm">);
                setData("showCreatedJiraForm", true as PathValue<JiraBlockDef["data"], "showCreatedJiraForm">);
                setShowCreatedJiraData(output1);
                reset();
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
        try{
            const response = await runPixel<[string]>(
                `META | Jira ( command = "List all tickets" , userid="${data.userId}",project="${inputValues.JIRA_PROJECT_ID}" ) ;`,
            );
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
                    {data.showCreateJiraForm && (
                        <form onSubmit={onSubmit}>
                                <Stack direction="column" spacing={1} style={{ paddingTop: '10px' }}>
                                    <Controller
                                        name={'JIRA_PROJECT'}
                                        control={control}
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
                                    <Controller
                                        name={'JIRA_ISSUE_TYPE'}
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Autocomplete
                                                options={issueTypes}
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
                                        control={control}
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
                                        control={control}
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
                                        onClick={() => reset()}
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
                            <p><strong>Project:</strong> {showcreatedJiraData['self']}</p>
                        </div>
                    )}
                    {data.listAllTickets && (
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
                    )}
                    {data.listedTickets && (
                        <div>
                            <h3>Listed Jira Tickets</h3>
                            {showListedTickets.length > 0 ? (
                                showListedTickets.map((ticket,id)=><h4>{`Ticket Number ${id}:${ticket}`}</h4>)
                            ):''}
                        </div>
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
                    Jira Block
                </p>
            )}
        </div>
    )
});
