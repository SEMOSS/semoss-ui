import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '12px',
}));

const ComponentContainer = styled('div')(({ theme }) => ({
    flexDirection: 'column',
    margin: '50px',
    display: 'flex',
    flexGrow: '1',
    border: '3px dotted black',
}));

const EditComponentContainer = styled('div')(({ theme }) => ({
    flexDirection: 'column',
    margin: '50px',
    // display: 'flex',
    // flexGrow: '1',
    border: '3px dotted black',
    // border: '1px solid cornflowerblue',
    width: '25%',
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
    border: '3px dotted green',
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
    border: '3px dotted red',
}));

const SubTaskContainer = styled('div')(({ theme }) => ({
    width: '100%',
    border: '3px dotted blue',
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

    const { handleSubmit, control, reset, watch } = useForm<AIConductorForm>({
        defaultValues: {
            uploadFile: null,
            taskInput: '',
        },
    });

    const taskSubmitHandler = handleSubmit(async (data: AIConductorForm) => {
        console.log({ data });
        setIsLoading(true);

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
                    border: '1px solid green',
                    width: '100%',
                }}
            >
                <span
                    style={{
                        border: '1px solid goldenrod',
                        width: '75%',
                        display: 'inline-block',
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
                        }}
                    >
                        <Person /> Hey am i qualified for this job? If so can
                        you approve me or reject me for position.
                    </Typography>

                    <ComponentContainer>
                        <TaskContainer>
                            {conductor.steps.map((step, i) => {
                                return (
                                    <SubTaskContainer>
                                        <NewConductorStep
                                            key={i}
                                            taskIndex={i}
                                            type={'app'}
                                            step={step}
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

                {/* <span
                    style={{
                        border: '1px solid cornflowerblue',
                        width: '25%',
                        display: 'inline-block',
                    }}
                > */}
                <EditComponentContainer>
                    <EditTaskContainer>
                        <SubTaskContainer>
                            <Typography variant={'h6'}>
                                {' '}
                                Overall Input Pool
                            </Typography>
                            <div>{JSON.stringify(conductor.inputPool)}</div>
                        </SubTaskContainer>
                    </EditTaskContainer>
                </EditComponentContainer>
                {/* </span> */}
            </div>
        </Stack>
    );
});
