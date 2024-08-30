import { useEffect, useState } from 'react';
import {
    styled,
    Typography,
    TextField,
    IconButton,
    FileDropzone,
    useNotification,
} from '@semoss/ui';
import { LoadingScreen } from '@/components/ui';
import { ArrowUpward, Mic } from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { usePixel, useRootStore } from '@/hooks';
// import { Background } from '@xyflow/react';

const ComponentContainer = styled('div')(({ theme }) => ({
    flexDirection: 'column',
    margin: '50px',
    display: 'flex',
    flexGrow: '1',
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
}));

const SubTaskContainer = styled('div')(({ theme }) => ({
    width: '100%',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '12px',
}));

const SubTask = styled('div')(({ theme }) => ({
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '10px 30px 10px 20px',
    maxWidth: 'fit-content',
}));

type AIConductorForm = {
    uploadFile: File;
    taskInput: string;
};

export const NewAIConductorPage = (props) => {
    const { handleSubmit, control, reset, watch } = useForm<AIConductorForm>({
        defaultValues: {
            uploadFile: null,
            taskInput: '',
        },
    });

    const uploadFile = watch('uploadFile');
    const taskInput = watch('taskInput');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [subTaskElements, setSubTaskElements] = useState([
        {
            title: 'default message',
            content:
                'Define a task and AI Conductor will generate a roadmap to help you solve it!',
        },
    ]);
    const { id, condensed = false } = props;
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();

    useEffect(() => {
        const childEle = document.querySelector('#conductor-container-div');
        const parentEle = childEle.parentElement;
        parentEle.style.display = 'flex';
        parentEle.style.flexDirection = 'column';

        return () => {
            parentEle.style.display = 'block';
            parentEle.style.flexDirection = '';
        };
    }, []);

    const taskSubmitHandler = handleSubmit(async (data: AIConductorForm) => {
        console.log({ data });
        setIsLoading(true);

        try {
            const path = 'version/assets/';
            await monolithStore.runQuery(
                `DeleteAsset(filePath=["${path}"], space=["${id}"]);`,
            );

            const upload = await monolithStore.uploadFile(
                [data.uploadFile],
                configStore.store.insightID,
                id,
                path,
            );

            notification.add({
                color: 'success',
                message: 'Succesfully Uploaded File',
            });

            console.log({ upload });

            reset();
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
        <ComponentContainer id="conductor-container-div">
            <Typography variant="h4">AI Conductor</Typography>
            <Typography variant="body1">Description / Instructions</Typography>
            <TaskContainer>
                {isLoading && (
                    <LoadingScreen.Trigger description="Updating Project" />
                )}

                <SubTaskContainer>
                    {subTaskElements?.map((subTask) => (
                        <SubTask>{subTask.content}</SubTask>
                    ))}
                </SubTaskContainer>

                <Controller
                    name={'uploadFile'}
                    control={control}
                    rules={{}}
                    render={({ field }) => {
                        return (
                            <FileDropzone
                                multiple={false}
                                value={field.value}
                                // disabled={isLoading}
                                onChange={(newValues) => {
                                    field.onChange(newValues);
                                }}
                            />
                        );
                    }}
                />

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
                                        <span style={{ marginRight: '15px' }}>
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
            </TaskContainer>
        </ComponentContainer>
    );
};
