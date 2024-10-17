import React, { useEffect, useState } from 'react';
import { useConductor, useRootStore } from '@/hooks';
import {
    Stack,
    Typography,
    styled,
    TextField,
    IconButton,
    FileDropzone,
    useNotification,
    Button,
    Accordion,
} from '@semoss/ui';
import { NewConductorStep } from './NewConductorStep';
import { observer } from 'mobx-react-lite';
import {
    KeyboardArrowDown,
    ArrowUpward,
    AutoFixHigh,
    PlayArrow,
    Person,
    Close,
    Mic,
    Visibility,
    AccountTree,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { Editor } from '@monaco-editor/react';
import { None } from 'vega';

import { runPixel } from '@/api';
import { pixelConsole, pixelResult, runPixelAsync, download } from '@/api';

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '20px',
}));

type AIConductorForm = {
    uploadFile: File;
    taskInput: string;
};

export const Conductor = observer(() => {
    const { conductor } = useConductor();
    const notification = useNotification();

    const [currentEditorJSON, setCurrentEditorJSON] = useState('');
    const [currentOutputEditorJSON, setCurrentOutputEditorJSON] = useState('');
    const [currEditorJSONValsDict, setCurrEditorJSONValsDict] = useState({});

    const [subtaskSteps, setSubtaskSteps] = useState([]);

    const [taskEditWidthPercent, setTaskEditWidthPercent] = useState('0%');
    const [taskEditorHistory, setTaskEditorHistory] = useState([]);
    const [modelResponseText, setModelResponseText] = useState(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedSubtask, setSelectedSubtask] = useState(-1);
    const { monolithStore, configStore } = useRootStore();
    const [promptText, setPromptText] = useState(null);
    const [openAccordionIndexesSet, setOpenAccordionIndexesSet] = useState(
        new Set(),
    );
    const [taskContainerWidthPercent, setTaskContainerWidthPercent] =
        useState('100%');

    const { handleSubmit, control, reset, watch } = useForm<AIConductorForm>({
        defaultValues: {
            uploadFile: null,
            taskInput: '',
        },
    });

    useEffect(() => {
        if (selectedSubtask == -1) {
            setTaskContainerWidthPercent('100%');
            setTaskEditWidthPercent('0%');
        } else {
            setTaskContainerWidthPercent('calc(70% - 500px)');
            setTaskEditWidthPercent('500px');
            const selectedTaskVariables =
                conductor.steps[selectedSubtask]['variables'];

            const inputsObj = Object.entries(selectedTaskVariables).reduce(
                (acc, variable) => {
                    const name = variable[0];
                    const value = variable[1];
                    const newAcc = { ...acc };
                    if (value['isInput']) {
                        // newAcc[name] = value;
                        // How do we get / edit value from context?
                        newAcc[name] = null;
                    }
                    return newAcc;
                },
                {},
            );

            const outputsObj = Object.entries(selectedTaskVariables).reduce(
                (acc, variable) => {
                    const name = variable[0];
                    const value = variable[1];
                    const newAcc = { ...acc };
                    if (value['isOutput']) {
                        // newAcc[name] = value;
                        // How do we get / edit value from context?
                        newAcc[name] = null;
                    }
                    return newAcc;
                },
                {},
            );

            if (currEditorJSONValsDict[selectedSubtask]) {
                setCurrentEditorJSON(currEditorJSONValsDict[selectedSubtask]);
            } else {
                setCurrentEditorJSON(JSON.stringify(inputsObj));
                setCurrentOutputEditorJSON(JSON.stringify(outputsObj));
            }
        }
    }, [selectedSubtask]);

    const taskSubmitHandler = handleSubmit(async (data: AIConductorForm) => {
        setIsLoading(true);
        setTimeout(() => {
            setPromptText(data.taskInput);
            const placeholderModelResponse =
                "Let’s find out...let me generate a roadmap to figure out if you're qualified for this job!";
            setModelResponseText(placeholderModelResponse);
            setIsLoading(false);
        }, 500);

        return; // early return until LLM API endpoint available
    });

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
        height: 'calc(100vh - 175px)', // contained vertically
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

    const LeftInnerTopDiv = styled('div')(({ theme }) => ({
        overflow: promptText ? 'scroll' : 'hidden',
        width: '100%',
        padding: '0px',
        boxSizing: 'border-box',
    }));

    const LeftInnerBottomDiv = styled('div')(({ theme }) => ({
        marginTop: 'auto',
        height: '50px',
        width: '100%',
    }));

    const SubTaskParentContainerNew = styled('div')(({ theme }) => ({
        justifyContent: 'flex-end',
        marginBottom: '10px',
        display: 'flex',
        width: '100%',
    }));

    const SubTaskInnerContainer = styled('div')(({ theme }) => ({
        flexGrow: '1',
    }));

    const SubTaskPlayButton = styled('div')(({ theme }) => ({
        alignItems: 'center',
        display: 'flex',
        height: '75px',
        width: '50px',
    }));

    const handleMount = (editor, monaco) => {
        editor.getAction('editor.action.formatDocument').run();
    };

    const onChange = (value: string) => {
        // console.log({ newValue: value });
    };

    const updateButtonHandler = () => {
        const newCurrEditorJSONValsDict = { ...currEditorJSONValsDict };
        newCurrEditorJSONValsDict[selectedSubtask] = currentEditorJSON;
        setCurrEditorJSONValsDict(newCurrEditorJSONValsDict);

        setIsLoading(true);
        setTimeout(() => {
            setPromptText(promptText + ' ');
            setIsLoading(false);
        }, 500);
    };

    const DUMMY_JSON = `
        {
            "imageurl": "/barbie_dream_house.png",
            "is_house": true,
            "color": "pink",
            "bedrooms": "3+",
            "has_pool": true,
            "has_slide": true,
            "cost": ""
        }
    `;

    const editorChangeHandler = (newString) => {
        // console.log({ newString });
    };

    const playClickHandler = () => {
        setIsLoading(true);
        setTimeout(() => {
            setPromptText(promptText + ' ');
            setIsLoading(false);
        }, 500);
    };

    const fetchSteps = async (prompt) => {
        const modelId = '17753d59-4536-4415-a6ac-f673b1a90a87'; // Mixtral-8x7B
        const testPrompt =
            'My shop has in stock refried burritos. I sell some refried burritos daily. I can reorder refried burritos to refill my stock if needed. How can I determine when to reorder and how much to reorder extra refried burritos.';
        const pixel = `LLMInstruct("4acbe913-df40-4ac0-b28a-daa5ad91b172", "${prompt}")`;

        setIsLoading(true);
        const res = await runPixel(pixel);
        setIsLoading(false);

        const outputSteps = res.pixelReturn[0].output['response'];

        setSubtaskSteps(outputSteps);

        console.log({ res });
        console.log({ outputSteps });
    };

    return (
        <ParentContainer>
            <button
                onClick={() =>
                    fetchSteps(
                        'How can I determine if I can buy a house in San Francisco?',
                    )
                }
            >
                runPixel
            </button>
            <TitleContainer>
                <div>
                    <Typography variant="h4">AI Conductor</Typography>
                    <Typography variant="body1" sx={{ width: '100%' }}>
                        Description / Instructions
                    </Typography>
                </div>
            </TitleContainer>
            <LowerParentContainer>
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
                            }}
                        >
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        padding: '16px',
                                        display: promptText ? 'none' : 'flex',
                                        marginBottom: '20px',
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
                                display: promptText ? 'auto' : 'none',
                            }}
                        >
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        display: promptText ? 'flex' : 'none',
                                        backgroundColor: '#fff',
                                        marginBottom: '20px',
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
                                    {promptText}
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
                                    <IconButton
                                        sx={{
                                            display: promptText
                                                ? 'auto'
                                                : 'none',
                                        }}
                                    >
                                        <PlayArrow />
                                    </IconButton>
                                </div>
                            </SubTaskPlayButton>
                        </SubTaskParentContainerNew>
                        <SubTaskParentContainerNew
                            sx={{
                                marginBottom: '0',
                                display: promptText ? 'auto' : 'none',
                            }}
                        >
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        display: promptText ? 'flex' : 'none',
                                        justifyContent: 'start',
                                        alignItems: 'center',
                                        backgroundColor: '#fff',
                                        marginBottom: '20px',
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

                        {
                            // {promptText &&
                            // conductor.steps.map((step, i) => {
                            subtaskSteps.map((subtask, i) => {
                                return (
                                    <SubTaskParentContainerNew>
                                        <SubTaskInnerContainer>
                                            <NewConductorStep
                                                key={i}
                                                taskIndex={i}
                                                type={'app'}
                                                step={conductor.steps[0]}
                                                subtask={subtask}
                                                selectedSubtask={
                                                    selectedSubtask
                                                }
                                                setSelectedSubtask={
                                                    setSelectedSubtask
                                                }
                                                taskEditorHistory={
                                                    taskEditorHistory
                                                }
                                                setTaskEditorHistory={
                                                    setTaskEditorHistory
                                                }
                                                openAccordionIndexesSet={
                                                    openAccordionIndexesSet
                                                }
                                                setOpenAccordionIndexesSet={
                                                    setOpenAccordionIndexesSet
                                                }
                                                currentEditorJSON={
                                                    currentEditorJSON
                                                }
                                                setCurrentEditorJSON={
                                                    setCurrentEditorJSON
                                                }
                                            />
                                        </SubTaskInnerContainer>
                                        <SubTaskPlayButton>
                                            <div
                                                style={{
                                                    justifyContent: 'center',
                                                    display: 'flex',
                                                    width: '100%',
                                                }}
                                            >
                                                <IconButton
                                                    onClick={playClickHandler}
                                                >
                                                    <PlayArrow />
                                                </IconButton>
                                            </div>
                                        </SubTaskPlayButton>
                                    </SubTaskParentContainerNew>
                                );
                            })
                        }

                        <Controller
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
                        />
                    </LeftInnerTopDiv>
                    <Controller
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
                                        display: promptText ? 'none' : 'auto',
                                    }}
                                    multiple={false}
                                    value={field.value}
                                    onChange={(newValues) => {
                                        field.onChange(newValues);
                                    }}
                                />
                            );
                        }}
                    />
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
                                                        onClick={
                                                            taskSubmitHandler
                                                        }
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
                                                        onClick={
                                                            taskSubmitHandler
                                                        }
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
                <RightParentContainer
                    style={{
                        marginLeft:
                            taskContainerWidthPercent == '0%' ? '0px' : '20px',
                        display: taskEditWidthPercent == '0%' ? 'none' : 'flex',
                        width: taskEditWidthPercent,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            height: '300px',
                            width: '100%',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant={'body1'}>
                                <b>
                                    Selected Task {selectedSubtask + 1} JSON
                                    Editor
                                </b>
                            </Typography>
                            <IconButton
                                onClick={() => {
                                    setTaskContainerWidthPercent('100%');
                                    setTaskEditWidthPercent('0%');
                                    setSelectedSubtask(-1);
                                }}
                            >
                                <Close />
                            </IconButton>
                        </div>

                        <div>
                            <Typography
                                variant={'body1'}
                                sx={{
                                    fontSize: '16px',
                                    marginTop: '12.5px',
                                }}
                            >
                                <b>Input</b>
                            </Typography>
                        </div>

                        <div
                            style={{
                                borderRadius: '10px',
                                width: '100%',
                                overflow: 'auto',
                                flex: '1',
                                marginTop: '20px',
                                marginBottom: '20px',
                                height: `220px`, // TODO make dynamic based on editor value line count
                            }}
                        >
                            <Editor
                                width="100%"
                                height="100%"
                                value={currentEditorJSON}
                                language={'json'}
                                options={{
                                    lineNumbers: 'off',
                                    readOnly: false,
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    scrollBeyondLastLine: false,
                                    lineHeight: 19,
                                    overviewRulerBorder: false,
                                }}
                                onChange={(e) => {
                                    onChange(e);
                                    editorChangeHandler(e);
                                }}
                                onMount={handleMount}
                            />
                        </div>
                        <Button
                            color="secondary"
                            variant="outlined"
                            sx={{
                                width: '200px',
                            }}
                            onClick={updateButtonHandler}
                        >
                            Update and run task
                        </Button>
                    </div>

                    {/* Lower RightInnerContainer */}
                    <div
                        style={{
                            height: '300px',
                            width: '100%',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '95px',
                            }}
                        >
                            <Typography
                                variant={'h6'}
                                sx={{
                                    fontSize: '16px',
                                    marginBottom: '15px',
                                }}
                            >
                                <b>Output</b>
                            </Typography>
                        </div>

                        <div>
                            <Typography
                                variant={'body1'}
                                sx={{
                                    fontSize: '14px',
                                }}
                            >
                                You are manually modifying the output. If you
                                rerun the subtask, this update will be
                                overridden.
                            </Typography>
                        </div>

                        <div
                            style={{
                                borderRadius: '10px',
                                width: '100%',
                                overflow: 'auto',
                                flex: '1',
                                marginTop: '20px',
                                marginBottom: '20px',
                                height: `120px`, // TODO make dynamic based on editor value line count
                            }}
                        >
                            <Editor
                                width="100%"
                                height="100%"
                                value={currentOutputEditorJSON}
                                language={'json'}
                                options={{
                                    readOnly: false,
                                    lineNumbers: 'off',
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    overviewRulerBorder: false,
                                    automaticLayout: true,
                                    lineHeight: 19,
                                }}
                                onChange={(e) => {
                                    onChange(e);
                                    editorChangeHandler(e);
                                }}
                                onMount={handleMount}
                            />
                        </div>
                    </div>
                </RightParentContainer>
            </LowerParentContainer>
        </ParentContainer>
    );
});
