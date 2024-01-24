import { useMemo, useState, createElement } from 'react';
import {
    Button,
    Modal,
    Typography,
    styled,
    Stack,
    Breadcrumbs,
    Chip,
    IconButton,
} from '@semoss/ui';
import { useForm } from 'react-hook-form';
import { KeyboardArrowRight, Close } from '@mui/icons-material';
import { AppFormStep } from './save-app.types';

const StyledStepChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'isStepSelected',
})<{ isStepSelected: boolean }>(({ theme, isStepSelected }) => ({
    '.MuiSvgIcon-root': {
        color: isStepSelected
            ? theme.palette.primary.main
            : theme.palette.grey[400],
        paddingLeft: theme.spacing(0.5),
        paddingBottom: theme.spacing(0.125),
    },
    '.MuiChip-label': {
        color: isStepSelected
            ? theme.palette.primary.main
            : theme.palette.grey[400],
    },
}));

const StyledModalContent = styled(Modal.Content)(() => ({
    height: '300px',
}));

interface SaveAppProps {
    /** Track if the model is open */
    open: boolean;

    /** Callback that is triggered handleClose */
    handleClose: (appId?: string) => void;

    /** Modal title */
    title: string;

    /** Steps for modal */
    steps: AppFormStep[];

    /** Default form values */
    defaultFormValues: object;

    /** Submit handler */
    handleFormSubmit: Function;

    /** Error message to display */
    errorMessage: string;
}

export const SaveAppModal = (props: SaveAppProps) => {
    const {
        errorMessage,
        defaultFormValues,
        handleFormSubmit,
        handleClose,
        open,
        steps,
        title,
    } = props;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);

    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

    const { getValues, handleSubmit, watch, control } = useForm({
        defaultValues: defaultFormValues,
    });

    const watchAll = watch();

    const isStepComplete = useMemo(() => {
        return (steps[currentStepIndex].requiredFields as any[]).every(
            (field) => {
                return !!getValues(field);
            },
        );
    }, [watchAll]);

    const isStepSelected = (index: number): boolean => {
        return currentStepIndex === index;
    };

    const handlePreviousStep = () => {
        if (currentStepIndex === 0) {
            handleClose();
        } else {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    const previousStepLabel = currentStepIndex === 0 ? 'Cancel' : 'Back';

    const handleNextStep = () => {
        if (currentStepIndex === steps.length - 1) {
            createApp();
        } else {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    };

    const nextStepLabel =
        currentStepIndex === steps.length - 1 ? 'Upload' : 'Next';

    /**
     * Method that is called to create the app
     */
    const createApp = handleSubmit(async (data) => {
        // turn on loading
        setIsLoading(true);

        try {
            handleFormSubmit(data);
        } catch (e) {
            console.error(e);
            setShowErrorMessage(true);
        } finally {
            // turn of loading
            setIsLoading(false);
        }
    });

    return (
        <Modal open={open} fullWidth>
            <Modal.Title>
                <Stack>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <span>{title}</span>
                        <IconButton
                            aria-label="close"
                            onClick={() => handleClose()}
                            disabled={isLoading}
                        >
                            <Close />
                        </IconButton>
                    </Stack>
                    <Breadcrumbs
                        separator={<KeyboardArrowRight color="disabled" />}
                    >
                        {Array.from(steps, (step, i) => {
                            return (
                                <StyledStepChip
                                    key={i}
                                    isStepSelected={isStepSelected(i)}
                                    variant="outlined"
                                    size="small"
                                    color={
                                        isStepSelected(i)
                                            ? 'primary'
                                            : 'default'
                                    }
                                    label={step.name}
                                    avatar={step.icon}
                                />
                            );
                        })}
                    </Breadcrumbs>
                </Stack>
            </Modal.Title>
            <form onSubmit={createApp}>
                <StyledModalContent>
                    <Stack spacing={2}>
                        <Typography variant="subtitle2">
                            {steps[currentStepIndex].title}
                        </Typography>
                        {createElement(steps[currentStepIndex].component, {
                            control: control,
                            disabled: isLoading,
                        })}
                    </Stack>
                </StyledModalContent>
                <Modal.Actions>
                    <Stack
                        flex={1}
                        direction="row"
                        justifyContent="end"
                        alignItems="center"
                        spacing={1}
                        padding={2}
                    >
                        {showErrorMessage ? (
                            <Typography variant="caption" color="error">
                                {errorMessage}
                            </Typography>
                        ) : (
                            <></>
                        )}
                        <Button
                            disabled={isLoading}
                            variant="text"
                            onClick={handlePreviousStep}
                        >
                            {previousStepLabel}
                        </Button>
                        <Button
                            variant="contained"
                            disabled={isLoading || !isStepComplete}
                            loading={isLoading}
                            onClick={handleNextStep}
                        >
                            {nextStepLabel}
                        </Button>
                    </Stack>
                </Modal.Actions>
            </form>
        </Modal>
    );
};
