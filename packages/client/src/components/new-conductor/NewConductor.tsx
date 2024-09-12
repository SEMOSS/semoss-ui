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
    Mic,
    KeyboardArrowDown,
    Close,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { None } from 'vega';

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '12px',
}));

const ComponentContainer = styled('div')(({ theme }) => ({
    flexDirection: 'column',
    margin: '50px',
    display: 'flex',
    flexGrow: '1',
    border: '1px solid black',
}));

const EditComponentContainer = styled('div')(({ theme }) => ({
    flexDirection: 'column',
    // margin: '50px',
    // display: 'flex',
    // flexGrow: '1',
    border: '1px solid black',
    width: '15%',
    display: 'inline-block',
}));

const EditTaskContainer = styled('div')(({ theme }) => ({
    // backgroundColor: '#f3f3f3',
    // borderRadius: '25px',
    // marginTop: '25px',
    // padding: '30px',
    // width: '100%',
    // flexGrow: '1',
    // display: 'flex',
    // flexDirection: 'column',
    // justifyContent: 'space-between',
    // alignItems: 'left',
    border: '1px solid black',
}));

const TaskContainer = styled('div')(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderRadius: '25px',
    marginTop: '25px',
    padding: '30px',
    width: '100%',
    flexGrow: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid black',
}));

const SubTaskContainer = styled('div')(({ theme }) => ({
    width: '100%',
    border: '1px solid black',
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
            setTaskContainerWidthPercent('75%');
            setTaskEditWidthPercent('25%');
        }
    }, [selectedSubtask]);

    const taskSubmitHandler = handleSubmit(async (data: AIConductorForm) => {
        console.log({ data });
        setIsLoading(true);

        // update prompt question
        setPromptText(data.taskInput);
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
    });

    return (
        <Stack
            direction={'column'}
            gap={1}
            sx={{
                padding: '24px',
                borderRadius: '20px',
                backgroundColor: '#f3f3f3',
            }}
        >
            <div
                style={{
                    border: '1px solid black',
                    width: '100%',
                    display: 'flex',
                }}
            >
                <span
                    style={{
                        border: '1px solid black',
                        width: taskContainerWidthPercent,
                        display: 'inline-block',
                        transition: 'width .2s',
                    }}
                >
                    <Typography variant={'h4'} fontWeight="bold">
                        Task
                    </Typography>
                    <Typography
                        variant={'h5'}
                        sx={{
                            backgroundColor: '#fafafa',
                            padding: '16px',
                            borderRadius: '12px',
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
                                    <SubTaskContainer onClick={() => {}}>
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
                                    </SubTaskContainer>
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
                                                style={{ marginRight: '15px' }}
                                            >
                                                <b>Task</b>
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
                    {/* <SubTaskContainer> */}
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
                    {/* </SubTaskContainer> */}
                    {/* </EditTaskContainer> */}
                    {/* </EditComponentContainer> */}
                </span>
            </div>
        </Stack>
    );
});
