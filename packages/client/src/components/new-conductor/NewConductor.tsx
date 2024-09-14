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
    Visibility,
    Person,
    ArrowUpward,
    KeyboardArrowDown,
    Mic,
    Close,
    AutoFixHigh,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { None } from 'vega';

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '20px',
}));

const ComponentContainer = styled('div')(({ theme }) => ({
    flexDirection: 'column',
    display: 'flex',
    flexGrow: '1',
    margin: '0px',
    width: '100%',
}));

const EditComponentContainer = styled('div')(({ theme }) => ({
    flexDirection: 'column',
    width: '15%',
    display: 'inline-block',
}));

const EditTaskContainer = styled('div')(({ theme }) => ({
    // backgroundColor: '#f3f3f3',
    // borderRadius: '20px',
    // marginTop: '25px',
    // padding: '30px',
    // width: '100%',
    // flexGrow: '1',
    // display: 'flex',
    // flexDirection: 'column',
    // justifyContent: 'space-between',
    // alignItems: 'left',
    // border: '1px solid black',
}));

const TaskContainerSpan = styled('div')(({ theme }) => ({}));

const TaskContainer = styled('div')(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderRadius: '20px',
    marginTop: '25px',
    padding: '20px',
    width: '100%',
    flexGrow: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
}));

const SubTaskParentContainer = styled('div')(({ theme }) => ({
    width: '100%',
}));

const SubTask = styled('div')(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '10px 30px 10px 20px',
    maxWidth: 'fit-content',
}));

type AIConductorForm = {
    uploadFile: File;
    taskInput: string;
};

export const Conductor = observer(() => {
    const { conductor } = useConductor();
    const notification = useNotification();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const { monolithStore, configStore } = useRootStore();
    const [selectedSubtask, setSelectedSubtask] = useState(-1);
    const [taskContainerWidthPercent, setTaskContainerWidthPercent] =
        useState('100%');
    const [taskEditWidthPercent, setTaskEditWidthPercent] = useState('0%');
    const [taskEditorHistory, setTaskEditorHistory] = useState([]);
    const [openAccordionIndexesSet, setOpenAccordionIndexesSet] = useState(
        new Set(),
    );

    const [promptText, setPromptText] = useState(null);
    const [modelResponseText, setModelResponseText] = useState(null);

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
            setTaskContainerWidthPercent('calc(70% - 300px)');
            setTaskEditWidthPercent('300px');
        }
    }, [selectedSubtask]);

    const taskSubmitHandler = handleSubmit(async (data: AIConductorForm) => {
        console.log({ data });
        setIsLoading(true);

        // update prompt question

        setTimeout(() => {
            setPromptText(data.taskInput);
            const placeholderModelResponse =
                'Let’s find out...let me generate a roadmap to figure out if you can afford this house!';
            setModelResponseText(placeholderModelResponse);
            // if no tasks
            // add prompt
            // add tasks

            try {
                // const path = 'version/assets/';
                // await monolithStore.runQuery(
                //     `DeleteAsset(filePath=["${path}"], space=["${id}"]);`,
                // );
                // const upload = await monolithStore.uploadFile(
                //     [data.uploadFile],
                //     configStore.store.insightID,
                //     id,
                //     path,
                // );
                // notification.add({
                //     color: 'success',
                //     message: 'Succesfully Uploaded File',
                // });
                // console.log({ upload });
                // reset();
            } catch (e) {
                console.error(e);

                notification.add({
                    color: 'error',
                    message: e.message,
                });
            } finally {
                setIsLoading(false);
            }
        }, 500);
    });

    const _horizontalFlexWidthContainers = (
        <>
            <span
                style={{
                    width: taskContainerWidthPercent,
                    display: 'inline-block',
                    transition: 'width .2s',
                    border: '1px solid red',
                }}
            ></span>
            {`...`}
            <span
                style={{
                    width: taskEditWidthPercent,
                    display:
                        taskEditWidthPercent == '0%' ? 'none' : 'inline-block',
                    transition: 'width .2s',
                    border: '1px solid blue',
                }}
            >
                <Typography variant={'h6'}>
                    Selected Task: {selectedSubtask}
                </Typography>
                <IconButton
                    onClick={() => {
                        setSelectedSubtask(-1);
                    }}
                >
                    <Close />
                </IconButton>
                <Typography variant={'h6'}> Overall Input Pool</Typography>
                <div>{JSON.stringify(conductor.inputPool)}</div>
            </span>
        </>
    );

    const ParentContainer = styled('div')(({ theme }) => ({
        border: '1px solid black',
        minWidth: '650px',
    }));

    const TitleContainer = styled('div')(({ theme }) => ({
        width: '100%',
        border: '1px solid green',
        boxSizing: 'border-box',
        // display: 'flex',
        height: '50px',
    }));

    const LowerParentContainer = styled('div')(({ theme }) => ({
        border: '1px solid black',
        display: 'flex',
        // minHeight: 'calc(100vh - 175px)', // expands vertically
        height: 'calc(100vh - 175px)', // contained vertically
        width: '100%',
        backgroundColor: '#f3f3f3',
        borderRadius: '20px',
        padding: '20px',
    }));

    const LeftParentContainer = styled('div')(({ theme }) => ({
        border: '1px solid blue',
        // flexBasis: '70%',
        // flexBasis: 'calc(70% - 500px)',
        flexBasis: 'calc(70% - 300px)',
        display: 'flex',
        flexDirection: 'column',
        flex: '1',
    }));

    const RightParentContainer = styled('div')(({ theme }) => ({
        border: '1px solid red',
        // flexBasis: '30%',
        flexBasis: '300px',
    }));

    const LeftInnerTopDiv = styled('div')(({ theme }) => ({
        border: '1px solid orange',
        width: '100%',
        overflow: 'scroll',
    }));

    const LeftInnerBottomDiv = styled('div')(({ theme }) => ({
        border: '1px solid green',
        height: '50px',
        width: '100%',
        marginTop: 'auto',
    }));

    const SubTaskParentContainerNew = styled('div')(({ theme }) => ({
        border: '1px solid violet',
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
    }));

    const SubTaskInnerContainer = styled('div')(({ theme }) => ({
        border: '1px solid red',
        flexGrow: '1',
    }));

    const SubTaskPlayButton = styled('div')(({ theme }) => ({
        border: '1px solid green',
        height: '50px',
        width: '50px',
    }));

    const workingEmptySampleLayout = (
        // const ParentContainer = styled('div')(({ theme }) => ({
        //     border: '1px solid black',
        //     minWidth: '650px',
        // }));

        // const TitleContainer = styled('div')(({ theme }) => ({
        //     width: '100%',
        //     border: '1px solid green',
        //     boxSizing: 'border-box',
        //     // display: 'flex',
        //     height: '50px',
        // }));

        // const LowerParentContainer = styled('div')(({ theme }) => ({
        //     border: '1px solid black',
        //     display: 'flex',
        //     // minHeight: 'calc(100vh - 175px)', // expands vertically
        //     height: 'calc(100vh - 175px)', // contained vertically
        //     width: '100%',
        //     backgroundColor: '#f3f3f3',
        //     borderRadius: '20px',
        //     padding: '20px',
        // }));

        // const LeftParentContainer = styled('div')(({ theme }) => ({
        //     border: '1px solid blue',
        //     // flexBasis: '70%',
        //     // flexBasis: 'calc(70% - 500px)',
        //     flexBasis: 'calc(70% - 300px)',
        //     display: 'flex',
        //     flexDirection: 'column',
        //     flex: '1',
        // }));

        // const RightParentContainer = styled('div')(({ theme }) => ({
        //     border: '1px solid red',
        //     // flexBasis: '30%',
        //     flexBasis: '300px',
        // }));

        // const LeftInnerTopDiv = styled('div')(({ theme }) => ({
        //     border: '1px solid orange',
        //     width: '100%',
        //     overflow: 'scroll',
        // }));

        // const LeftInnerBottomDiv = styled('div')(({ theme }) => ({
        //     border: '1px solid green',
        //     height: '50px',
        //     width: '100%',
        //     marginTop: 'auto',
        // }));

        // const SubTaskParentContainerNew = styled('div')(({ theme }) => ({
        //     border: '1px solid violet',
        //     display: 'flex',
        //     justifyContent: 'flex-end',
        //     width: '100%',
        // }));

        // const SubTaskInnerContainer = styled('div')(({ theme }) => ({
        //     border: '1px solid red',
        //     flexGrow: '1',
        // }));

        // const SubTaskPlayButton = styled('div')(({ theme }) => ({
        //     border: '1px solid green',
        //     height: '50px',
        //     width: '50px',
        // }));
        <ParentContainer>
            <TitleContainer>title</TitleContainer>
            <LowerParentContainer>
                <LeftParentContainer>
                    <LeftInnerTopDiv>
                        <SubTaskParentContainerNew>
                            <SubTaskInnerContainer>
                                <p>top left 1</p>
                            </SubTaskInnerContainer>
                            <SubTaskPlayButton>{`>`}</SubTaskPlayButton>
                        </SubTaskParentContainerNew>
                        <SubTaskParentContainerNew>
                            <SubTaskInnerContainer>
                                <p>top left 2</p>
                            </SubTaskInnerContainer>
                            <SubTaskPlayButton>{`>`}</SubTaskPlayButton>
                        </SubTaskParentContainerNew>
                        <SubTaskParentContainerNew>
                            <SubTaskInnerContainer>
                                <p>top left 3</p>
                            </SubTaskInnerContainer>
                            <SubTaskPlayButton>{`>`}</SubTaskPlayButton>
                        </SubTaskParentContainerNew>
                    </LeftInnerTopDiv>
                    <LeftInnerBottomDiv>left bottom</LeftInnerBottomDiv>
                </LeftParentContainer>
                <RightParentContainer>
                    <div
                        style={{
                            border: '1px solid violet',
                        }}
                    >
                        top right 1
                    </div>
                    <div
                        style={{
                            border: '1px solid gray',
                        }}
                    >
                        top right 2
                    </div>
                    <div
                        style={{
                            border: '1px solid lightgreen',
                        }}
                    >
                        top right 3
                    </div>
                </RightParentContainer>
            </LowerParentContainer>
        </ParentContainer>
    );

    return (
        <ParentContainer>
            <TitleContainer>
                <Typography variant="h4">AI Conductor</Typography>
                <Typography variant="body1">
                    Description / Instructions
                </Typography>
            </TitleContainer>
            <LowerParentContainer>
                <LeftParentContainer
                    style={{
                        flexBasis: taskContainerWidthPercent,
                        // display: 'inline-block',
                        transition: 'width .2s',
                        // border: '3px dashed purple',
                    }}
                >
                    <LeftInnerTopDiv>
                        <SubTaskParentContainerNew>
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        padding: '16px',
                                        display: promptText ? 'auto' : 'none',
                                        marginBottom: '20px',
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                    }}
                                >
                                    <Person /> {promptText}
                                </Typography>
                            </SubTaskInnerContainer>
                            <SubTaskPlayButton>{`>`}</SubTaskPlayButton>
                        </SubTaskParentContainerNew>
                        <SubTaskParentContainerNew>
                            <SubTaskInnerContainer>
                                <Typography
                                    variant={'body1'}
                                    sx={{
                                        padding: '16px',
                                        display: promptText ? 'auto' : 'none',
                                        marginBottom: '20px',
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                    }}
                                >
                                    <AutoFixHigh /> {modelResponseText}
                                </Typography>
                            </SubTaskInnerContainer>
                            <SubTaskPlayButton>{`>`}</SubTaskPlayButton>
                        </SubTaskParentContainerNew>

                        {promptText &&
                            conductor.steps.map((step, i) => {
                                return (
                                    <SubTaskParentContainerNew>
                                        <SubTaskInnerContainer>
                                            <NewConductorStep
                                                key={i}
                                                taskIndex={i}
                                                type={'app'}
                                                step={step}
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
                                            />
                                        </SubTaskInnerContainer>
                                        <SubTaskPlayButton>
                                            {`>`}
                                        </SubTaskPlayButton>
                                    </SubTaskParentContainerNew>
                                );
                            })}
                    </LeftInnerTopDiv>
                    <LeftInnerBottomDiv>
                        <Controller
                            name={'taskInput'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                    <StyledTextField
                                        label="Name"
                                        value={field.value ? field.value : ''}
                                        variant="outlined"
                                        placeholder="Type, Drag, or Speak to get started. Reminder! Use as explicit language as possible and include your audience...*"
                                        // disabled={isLoading}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                        fullWidth={true}
                                        InputProps={{
                                            startAdornment: (
                                                <span
                                                    style={{
                                                        marginRight: '15px',
                                                        width: '100px',
                                                        // backgroundColor: 'pink',
                                                        display: 'inline-block',
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
                        // border: '1px solid black',
                        width: taskEditWidthPercent,
                        display: taskEditWidthPercent == '0%' ? 'none' : 'flex',
                        transition: 'width .2s',
                    }}
                >
                    <div>
                        <Typography variant={'h6'}>
                            Selected Task: {selectedSubtask}
                        </Typography>
                        <IconButton
                            onClick={() => {
                                setSelectedSubtask(-1);
                            }}
                        >
                            <Close />
                        </IconButton>
                        <Typography variant={'h6'}>
                            {' '}
                            Overall Input Pool
                        </Typography>
                        <div>{JSON.stringify(conductor.inputPool)}</div>
                    </div>
                </RightParentContainer>

                {/* <div style={{
                        border: '1px solid violet',
                    }}>
                        top right 1
                    </div>
                    <div style={{
                        border: '1px solid gray',
                    }}>
                        top right 2
                    </div>
                    <div style={{
                        border: '1px solid lightgreen',
                    }}>
                        top right 3
                    </div> */}
                {/* </RightParentContainer> */}
            </LowerParentContainer>
        </ParentContainer>
    );

    return (
        <ComponentContainer
            sx={{
                border: '1px solid green',
                width: '70%',
            }}
        >
            <Typography variant="h4">AI Conductor</Typography>
            <Typography variant="body1">Description / Instructions</Typography>

            <TaskContainer
            // sx={{
            //     width: taskContainerWidthPercent,
            // }}
            >
                <SubTaskParentContainer>
                    <Typography
                        variant={'body1'}
                        sx={{
                            padding: '16px',
                            display: promptText ? 'auto' : 'none',
                            marginBottom: '20px',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                        }}
                    >
                        <Person /> {promptText}
                    </Typography>
                    <Typography
                        variant={'body1'}
                        sx={{
                            padding: '16px',
                            display: promptText ? 'auto' : 'none',
                            marginBottom: '20px',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                        }}
                    >
                        <AutoFixHigh /> {modelResponseText}
                    </Typography>
                    {conductor.steps.map((step, i) => (
                        <NewConductorStep
                            key={i}
                            taskIndex={i}
                            type={'app'}
                            step={step}
                            selectedSubtask={selectedSubtask}
                            setSelectedSubtask={setSelectedSubtask}
                            taskEditorHistory={taskEditorHistory}
                            setTaskEditorHistory={setTaskEditorHistory}
                            openAccordionIndexesSet={openAccordionIndexesSet}
                            setOpenAccordionIndexesSet={
                                setOpenAccordionIndexesSet
                            }
                        />
                    ))}
                </SubTaskParentContainer>

                <Controller
                    name={'taskInput'}
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => {
                        return (
                            <StyledTextField
                                label="Name"
                                value={field.value ? field.value : ''}
                                variant="outlined"
                                placeholder="Type, Drag, or Speak to get started. Reminder! Use as explicit language as possible and include your audience...*"
                                // disabled={isLoading}
                                onChange={(value) => field.onChange(value)}
                                fullWidth={true}
                                InputProps={{
                                    startAdornment: (
                                        <span
                                            style={{
                                                marginRight: '15px',
                                                width: '100px',
                                                // backgroundColor: 'pink',
                                                display: 'inline-block',
                                            }}
                                        >
                                            <b>Chat</b>
                                            <IconButton
                                                onClick={taskSubmitHandler}
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
                                                onClick={taskSubmitHandler}
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
            </TaskContainer>
        </ComponentContainer>
    );

    return (
        <Stack
            direction={'column'}
            gap={1}
            sx={{
                padding: '24px',
                borderRadius: '20px',
                backgroundColor: '#f3f3f3',
                border: '3px dashed goldenrod',
            }}
        >
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    border: '3px dashed olive',
                }}
            >
                <span
                    style={{
                        width: taskContainerWidthPercent,
                        display: 'inline-block',
                        transition: 'width .2s',
                        border: '3px dashed purple',
                    }}
                >
                    {/* <Typography variant={'h4'} fontWeight="bold">
                        Task
                    </Typography> */}
                    <Typography
                        variant={'body1'}
                        sx={{
                            backgroundColor: '#fafafa',
                            padding: '16px',
                            borderRadius: '20px',
                            display: promptText ? 'auto' : 'none',
                        }}
                    >
                        <Person /> {promptText}
                    </Typography>

                    <ComponentContainer>
                        <TaskContainer
                            sx={{ display: promptText ? 'flex' : 'none' }}
                        >
                            {conductor.steps.map((step, i) => {
                                return (
                                    <SubTaskParentContainer
                                        onClick={() => {}}
                                        sx={{ border: '3px solid blue' }}
                                    >
                                        <NewConductorStep
                                            key={i}
                                            taskIndex={i}
                                            type={'app'}
                                            step={step}
                                            selectedSubtask={selectedSubtask}
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
                                        />
                                    </SubTaskParentContainer>
                                );
                            })}
                        </TaskContainer>
                    </ComponentContainer>

                    <Controller
                        name={'taskInput'}
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => {
                            return (
                                <StyledTextField
                                    label="Name"
                                    value={field.value ? field.value : ''}
                                    variant="outlined"
                                    placeholder="Type, Drag, or Speak to get started. Reminder! Use as explicit language as possible and include your audience...*"
                                    // disabled={isLoading}
                                    onChange={(value) => field.onChange(value)}
                                    fullWidth={true}
                                    InputProps={{
                                        startAdornment: (
                                            <span
                                                style={{
                                                    marginRight: '15px',
                                                    width: '100px',
                                                    // backgroundColor: 'pink',
                                                    display: 'inline-block',
                                                }}
                                            >
                                                <b>Chat</b>
                                                <IconButton
                                                    onClick={taskSubmitHandler}
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
                                                    onClick={taskSubmitHandler}
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
                </span>

                <span
                    style={{
                        border: '1px solid black',
                        width: taskEditWidthPercent,
                        display:
                            taskEditWidthPercent == '0%'
                                ? 'none'
                                : 'inline-block',
                        transition: 'width .2s',
                    }}
                >
                    {/* <EditComponentContainer> */}
                    {/* <EditTaskContainer> */}
                    {/* <SubTaskParentContainer> */}
                    <Typography variant={'h6'}>
                        Selected Task: {selectedSubtask}
                    </Typography>
                    <IconButton
                        onClick={() => {
                            setSelectedSubtask(-1);
                        }}
                    >
                        <Close />
                    </IconButton>
                    <Typography variant={'h6'}> Overall Input Pool</Typography>
                    <div>{JSON.stringify(conductor.inputPool)}</div>
                    {/* </SubTaskParentContainer> */}
                    {/* </EditTaskContainer> */}
                    {/* </EditComponentContainer> */}
                </span>
            </div>
        </Stack>
    );
});
