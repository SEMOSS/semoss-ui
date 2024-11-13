import { useEffect, useState } from 'react';
import { useConductor } from '@/hooks';
import {
    Typography,
    styled,
    TextField,
    IconButton,
    FileDropzone,
    Button,
} from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import {
    KeyboardArrowDown,
    ArrowUpward,
    AutoFixHigh,
    PlayArrow,
    Person,
    Close,
    Mic,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { Editor } from '@monaco-editor/react';
import { runPixel } from '@/api';

import { LoadingScreen } from '@/components/ui';
import { Blocks } from '../blocks';
import { SubtaskWrapper } from './SubtaskWrapper';
import { LLMInstructOutputStep } from './conductor.types';
import { TaskExecution } from './TaskExecution';

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '20px',
}));

const ParentContainer = styled('div')(({ theme }) => ({
    minWidth: '650px',
}));

const TitleContainer = styled('div')(({ theme }) => ({
    boxSizing: 'border-box',
    marginBottom: '10px',
    height: '50px',
    display: 'flex',
}));

const LowerParentContainer = styled('div')(({ theme }) => ({
    height: 'calc(100vh - 175px)',
    padding: '20px 0 0 0',
    display: 'flex',
    width: '100%',
}));

const LeftParentContainer = styled('div')(({ theme }) => ({
    flexBasis: 'calc(70% - 500px)',
    padding: '20px 20px 30px 20px',
    transition: 'width .2s',
    backgroundColor: '#eee',
    flexDirection: 'column',
    borderRadius: '20px',
    display: 'flex',
    flex: '1',
}));

const RightParentContainer = styled('div')(({ theme }) => ({
    transition: 'width .2s, margin-left .2s, display 0s',
    backgroundColor: '#eee',
    borderRadius: '20px',
    flexBasis: '500px',
    marginLeft: '0px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
}));

const LeftInnerBottomDiv = styled('div')(({ theme }) => ({
    marginTop: 'auto',
    height: '50px',
    width: '100%',
}));

const SubTaskParentContainerNew = styled('div')(({ theme }) => ({
    justifyContent: 'flex-end',
    display: 'flex',
    width: '100%',
}));

const SubTaskInnerContainer = styled('div')(({ theme }) => ({
    flexGrow: '1',
    marginBottom: '15px',
}));

const SubTaskPlayButton = styled('div')(({ theme }) => ({
    alignItems: 'center',
    display: 'flex',
    width: '50px',
}));

type AIConductorForm = {
    uploadFile: File;
    taskInput: string;
};

export const Conductor = observer(() => {
    const { conductor } = useConductor();

    const [taskEditWidthPercent, setTaskEditWidthPercent] = useState('0%');
    const [modelResponseText, setModelResponseText] = useState(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedSubtask, setSelectedSubtask] = useState(-1);
    const [taskContainerWidthPercent, setTaskContainerWidthPercent] =
        useState('100%');

    const { handleSubmit, control, reset, watch } = useForm<AIConductorForm>({
        defaultValues: {
            uploadFile: null,
            taskInput: '',
        },
    });

    const LeftInnerTopDiv = styled('div')(({ theme }) => ({
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflow: conductor.task ? 'scroll' : 'hidden',
        width: '100%',
        padding: '0px',
        boxSizing: 'border-box',
    }));

    useEffect(() => {}, [selectedSubtask]);

    const editorChangeHandler = (newString) => {
        // for JSON editor
    };

    /**
     * Takes Prompt from User and gets Apps as Subtasks
     */
    const fetchSteps = handleSubmit(async (data: AIConductorForm) => {
        setIsLoading(true);

        conductor.setTask(data.taskInput);

        // Pixel concat
        const placeholderModelResponse =
            'Let’s find out...let me generate a roadmap!';
        setModelResponseText(placeholderModelResponse);
        const modelId = '4acbe913-df40-4ac0-b28a-daa5ad91b172';
        const promptAddition =
            'Please limit your response to 3 if possible. Please include only essential steps. Please use as few steps as possible without combining steps or creating overly-complex steps. Please limit the text for each step to 12 words or less if possible. Please do not combine multiple steps. Please try to create steps that could be performed on a computer. Please use complete sentences for each step. Please do not use special characters like dashes or colons in the text for steps.';
        const combinePrompt = [data.taskInput, promptAddition].join(' ');
        const pixel = `LLMInstruct("${modelId}", "${combinePrompt}")`;

        // Execute pixel with conductor insight
        const res = await runPixel(pixel, conductor.insightId);

        // The steps that come back from LLM Instruct
        const outputSteps = res.pixelReturn[0].output[
            'response'
        ] as LLMInstructOutputStep[];

        /**
         * NEW
         */
        conductor.setSubtasks(outputSteps);

        setIsLoading(false);
    });

    return (
        <ParentContainer>
            <TitleContainer>
                <div>
                    <Typography variant="h4">AI Conductor</Typography>
                    <Typography variant="body1" sx={{ width: '100%' }}>
                        Description / Instructions
                    </Typography>
                </div>
            </TitleContainer>
            <LowerParentContainer>
                {isLoading && (
                    <LoadingScreen.Trigger description="Processing Request" />
                )}
                <LeftParentContainer
                    style={{
                        flexBasis: taskContainerWidthPercent,
                        transition: 'width .2s',
                    }}
                >
                    <LeftInnerTopDiv>
                        <SubTaskParentContainerNew
                            sx={{
                                marginBottom: '0',
                                display: conductor.task ? 'none' : 'flex',
                            }}
                        >
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        padding: '16px',
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        justifyContent: 'start',
                                        alignItems: 'center',
                                    }}
                                >
                                    <AutoFixHigh
                                        sx={{
                                            marginRight: '10px',
                                        }}
                                    />{' '}
                                    Define a task and AI Conductor will generate
                                    a roadmap to help you solve it!
                                </Typography>
                            </SubTaskInnerContainer>
                        </SubTaskParentContainerNew>

                        <SubTaskParentContainerNew
                            sx={{
                                marginBottom: '0',
                                display: conductor.task ? 'auto' : 'none',
                            }}
                        >
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        display: conductor.task
                                            ? 'flex'
                                            : 'none',
                                        backgroundColor: '#fff',
                                        // marginBottom: '20px',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        justifyContent: 'start',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Person
                                        sx={{
                                            marginRight: '10px',
                                        }}
                                    />{' '}
                                    {conductor.task}
                                </Typography>
                            </SubTaskInnerContainer>
                            <SubTaskPlayButton>
                                <div
                                    style={{
                                        justifyContent: 'center',
                                        display: 'flex',
                                        width: '100%',
                                    }}
                                >
                                    {/* <IconButton
                                        sx={{
                                            display: conductor.task
                                                ? 'auto'
                                                : 'none',
                                        }}
                                    >
                                        <PlayArrow />
                                    </IconButton> */}
                                </div>
                            </SubTaskPlayButton>
                        </SubTaskParentContainerNew>

                        <SubTaskParentContainerNew
                            sx={{
                                marginBottom: '0',
                                display: conductor.task ? 'auto' : 'none',
                            }}
                        >
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        display: conductor.task
                                            ? 'flex'
                                            : 'none',
                                        justifyContent: 'start',
                                        alignItems: 'center',
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        padding: '16px',
                                    }}
                                >
                                    <AutoFixHigh
                                        sx={{
                                            marginRight: '10px',
                                        }}
                                    />{' '}
                                    {modelResponseText}
                                </Typography>
                            </SubTaskInnerContainer>
                            <SubTaskPlayButton></SubTaskPlayButton>
                        </SubTaskParentContainerNew>

                        {/* GOOD */}
                        {conductor.subtasks.map((subtask, subTaskIdx) => {
                            return (
                                <>
                                    <SubtaskWrapper
                                        key={subTaskIdx}
                                        id={subtask.id}
                                        index={subTaskIdx}
                                    />
                                </>
                            );
                        })}

                        {/* {conductor.completedSubtasks && <TaskExecution />} */}

                        {conductor.completedSubtasks && (
                            <SubTaskParentContainerNew
                                sx={{
                                    marginBottom: '0',
                                    display: conductor.task ? 'auto' : 'none',
                                }}
                            >
                                <TaskExecution />
                                <SubTaskPlayButton>
                                    <div
                                        style={{
                                            justifyContent: 'center',
                                            display: 'flex',
                                            width: '100%',
                                        }}
                                    ></div>
                                </SubTaskPlayButton>
                            </SubTaskParentContainerNew>
                        )}
                        {/* So I can style */}
                        {/* <TaskExecution /> */}

                        {/* <Controller
                            name={'uploadFile'}
                            control={control}
                            rules={{}}
                            render={({ field }) => {
                                return (
                                    <FileDropzone
                                        style={{
                                            flex: '1',
                                            margin: '0 0 20px 0',
                                            borderRadius: '20px',
                                            display: 'none',
                                        }}
                                        multiple={false}
                                        value={field.value}
                                        onChange={(newValues) => {
                                            field.onChange(newValues);
                                        }}
                                    />
                                );
                            }}
                        /> */}
                    </LeftInnerTopDiv>
                    {/* Only shows if the prompt hasnt been asked */}
                    {/* <Controller
                        name={'uploadFile'}
                        control={control}
                        rules={{}}
                        render={({ field }) => {
                            return (
                                <FileDropzone
                                    style={{
                                        flex: '1',
                                        margin: '0 5px 20px 0',
                                        borderRadius: '20px',
                                        display: conductor.task
                                            ? 'none'
                                            : 'auto',
                                    }}
                                    multiple={false}
                                    value={field.value}
                                    onChange={(newValues) => {
                                        field.onChange(newValues);
                                    }}
                                />
                            );
                        }}
                    /> */}
                    <LeftInnerBottomDiv>
                        <Controller
                            name={'taskInput'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                    <StyledTextField
                                        label="Name"
                                        variant="outlined"
                                        value={field.value ? field.value : ''}
                                        placeholder="Type, Drag, or Speak to get started. Reminder! Use as explicit language as possible and include your audience...*"
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                        fullWidth={true}
                                        InputProps={{
                                            startAdornment: (
                                                <span
                                                    style={{
                                                        marginRight: '15px',
                                                        display: 'inline-block',
                                                        width: '100px',
                                                    }}
                                                >
                                                    <b>Chat</b>
                                                    <IconButton
                                                        onClick={fetchSteps}
                                                    >
                                                        <KeyboardArrowDown />
                                                    </IconButton>
                                                </span>
                                            ),
                                            endAdornment: (
                                                <>
                                                    <IconButton disabled>
                                                        <Mic />
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={fetchSteps}
                                                    >
                                                        <ArrowUpward />
                                                    </IconButton>
                                                </>
                                            ),
                                        }}
                                    />
                                );
                            }}
                        />
                    </LeftInnerBottomDiv>
                </LeftParentContainer>
            </LowerParentContainer>
        </ParentContainer>
    );
});
