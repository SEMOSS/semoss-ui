import { createElement, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    Typography,
    ButtonGroup,
    CircularProgress,
    Card,
    Chip,
    Divider,
    Collapse,
    useNotification,
} from '@semoss/ui';
import {
    DeleteOutlined,
    PlayArrowRounded,
    CheckCircle,
    Error,
    Pending,
    ContentCopy,
} from '@mui/icons-material';
import { ActionMessages } from '@/stores';
import { useBlocks, useWorkspace } from '@/hooks';
import { NotebookAddCellButton } from './NotebookAddCellButton';
import { NewStepOverlay } from './NewStepOverlay';

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isCardStepSelected',
})<{ isCardStepSelected: boolean }>(({ theme, isCardStepSelected }) => ({
    border: isCardStepSelected
        ? `1px solid ${theme.palette.primary.main}`
        : 'unset',
    overflow: 'visible',
}));

const StyledButtonLabel = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
}));

const StyledButtonGroupButton = styled(ButtonGroup.Item)(({ theme }) => ({
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.text.secondary}`,
}));

const StyledStatusChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'status',
})<{ status?: 'success' | 'error' | 'disabled' }>(({ theme, status }) => ({
    backgroundColor: status
        ? status === 'disabled'
            ? theme.palette.grey[400]
            : theme.palette[status].main
        : 'unset',
    color: status ? theme.palette.background.paper : 'unset',
    '.MuiChip-avatar': {
        color: 'unset',
    },
}));

const StyledIdChip = styled(Chip)(({ theme }) => ({
    backgroundColor: theme.palette.grey[300],
    height: theme.spacing(3.5),
}));

const StyledContent = styled('div')(({ theme }) => ({
    width: '100%',
    overflow: 'hidden',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
}));

const StyledJson = styled('pre')(({ theme }) => ({
    ...theme.typography.body2,
    textWrap: 'wrap',
    padding: theme.spacing(2),
    maxHeight: '200px',
    overflowY: 'scroll',
}));

interface NotebookStepProps {
    /** Id of the  the query */
    queryId: string;

    /** Id of the step of the query */
    stepId: string;
}

/**
 * Render the content of a step in the notebook
 */
export const NotebookStep = observer(
    (props: NotebookStepProps): JSX.Element => {
        const { queryId, stepId } = props;

        const { state, notebook } = useBlocks();

        const { workspace } = useWorkspace();
        const notification = useNotification();

        /**
         * Create a new step
         */
        const openCopyStepOverlay = () => {
            workspace.openOverlay(() => {
                return (
                    <NewStepOverlay
                        copyParameters
                        queryId={queryId}
                        previousStepId={stepId}
                        onClose={(newStepId) => {
                            workspace.closeOverlay();

                            if (newStepId) {
                                notebook.selectStep(queryId, newStepId);
                            }
                        }}
                    />
                );
            });
        };

        // get the step
        const query = state.getQuery(queryId);
        const step = query.getStep(stepId);

        // get the view
        const cell = step.cell;

        // render the title
        const renderedTitle = useMemo(() => {
            if (!cell) {
                return;
            }

            if (typeof cell.view.title === 'string') {
                return (
                    <Typography variant="body2">{cell.view.title}</Typography>
                );
            }

            return createElement(observer(cell.view.title), {
                step: step,
            });
        }, [cell ? cell.view.title : null]);

        // render the title
        const renderedInput = useMemo(() => {
            if (!cell) {
                return;
            }

            return createElement(observer(cell.view.input), {
                step: step,
            });
        }, [cell ? cell.view.input : null]);

        const getExecutionTimeString = (
            timeMilliseconds: number | undefined,
        ) => {
            if (timeMilliseconds) {
                const milliseconds = Math.floor(
                    (timeMilliseconds % 1000) / 100,
                );
                const seconds = Math.floor((timeMilliseconds / 1000) % 60);
                const minutes = Math.floor(
                    (timeMilliseconds / (1000 * 60)) % 60,
                );
                return `${minutes} min ${seconds} sec ${milliseconds} ms`;
            } else {
                return '';
            }
        };

        // if we are able to get more granular step loading info when running the full query, we can remove the step.query.isLoading checks
        const getStepChipStatus = () => {
            if (step.isLoading || step.query.isLoading) {
                return `disabled`;
            } else if (step.isSuccessful) {
                return 'success';
            } else if (step.isError) {
                return 'error';
            } else {
                return 'disabled';
            }
        };
        const getStepChipLabel = () => {
            if (step.isLoading) {
                return 'Loading';
            } else if (step.query.isLoading) {
                return 'Query Loading';
            } else if (step.isSuccessful) {
                return 'Success';
            } else if (step.isError) {
                return 'Error';
            } else {
                return 'Pending Execution';
            }
        };
        const getStepChipIcon = () => {
            if (step.isLoading) {
                return <CircularProgress size="0.75rem" />;
            } else if (step.query.isLoading) {
                return <Pending color="inherit" />;
            } else if (step.isSuccessful) {
                return <CheckCircle color="inherit" />;
            } else if (step.isError) {
                return <Error color="inherit" />;
            } else {
                return <Pending color="inherit" />;
            }
        };

        return (
            <>
                <StyledCard
                    isCardStepSelected={
                        (notebook?.selectedStep?.id ?? '') == step.id
                    }
                    onClick={() => notebook.selectStep(step.query.id, step.id)}
                >
                    <Card.Header
                        title={
                            <Stack
                                alignItems="center"
                                justifyContent="space-between"
                                direction="row"
                            >
                                {renderedTitle}
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                >
                                    <StyledIdChip
                                        label={
                                            <Stack
                                                direction="row"
                                                spacing={0.5}
                                                alignItems="center"
                                            >
                                                <span>{`${step.id}`}</span>
                                                <ContentCopy fontSize="inherit" />
                                            </Stack>
                                        }
                                        // title="Copy cell id"
                                        onClick={() => {
                                            try {
                                                navigator.clipboard.writeText(
                                                    step.id,
                                                );

                                                notification.add({
                                                    color: 'success',
                                                    message:
                                                        'Succesfully copied to clipboard',
                                                });
                                            } catch (e) {
                                                notification.add({
                                                    color: 'error',
                                                    message: e.message,
                                                });
                                            }
                                        }}
                                    />
                                    <ButtonGroup variant="outlined">
                                        <StyledButtonGroupButton
                                            title="Run step"
                                            disabled={step.isLoading}
                                            size="small"
                                            onClick={() =>
                                                state.dispatch({
                                                    message:
                                                        ActionMessages.RUN_STEP,
                                                    payload: {
                                                        queryId: step.query.id,
                                                        stepId: step.id,
                                                    },
                                                })
                                            }
                                        >
                                            <StyledButtonLabel>
                                                <PlayArrowRounded fontSize="small" />
                                            </StyledButtonLabel>
                                        </StyledButtonGroupButton>
                                        <StyledButtonGroupButton
                                            title="Duplicate step"
                                            size="small"
                                            disabled={step.isLoading}
                                            onClick={(e) => {
                                                // stop propogation to card parent so newly created step will be selected
                                                e.stopPropagation();
                                                openCopyStepOverlay();
                                            }}
                                        >
                                            <StyledButtonLabel>
                                                <ContentCopy
                                                    fontSize="small"
                                                    sx={{ padding: '2px' }}
                                                />
                                            </StyledButtonLabel>
                                        </StyledButtonGroupButton>
                                        <StyledButtonGroupButton
                                            title="Delete step"
                                            disabled={step.isLoading}
                                            size="small"
                                            onClick={() => {
                                                state.dispatch({
                                                    message:
                                                        ActionMessages.DELETE_STEP,
                                                    payload: {
                                                        queryId: step.query.id,
                                                        stepId: step.id,
                                                    },
                                                });
                                            }}
                                        >
                                            <StyledButtonLabel>
                                                <DeleteOutlined fontSize="small" />
                                            </StyledButtonLabel>
                                        </StyledButtonGroupButton>
                                    </ButtonGroup>
                                </Stack>
                            </Stack>
                        }
                    />
                    <Divider />
                    <Card.Content>{renderedInput}</Card.Content>
                    <Card.Actions>
                        <Stack spacing={2}>
                            <Stack
                                direction="row"
                                spacing={2}
                                alignItems="center"
                            >
                                <StyledStatusChip
                                    size="small"
                                    avatar={getStepChipIcon()}
                                    label={getStepChipLabel()}
                                    status={getStepChipStatus()}
                                />
                                {step.executionDurationMilliseconds ? (
                                    <Typography variant="caption">
                                        {getExecutionTimeString(
                                            step.executionDurationMilliseconds,
                                        )}
                                    </Typography>
                                ) : (
                                    <></>
                                )}
                                {step.executionDurationMilliseconds &&
                                step.executionStart ? (
                                    <Typography variant="caption">|</Typography>
                                ) : (
                                    <></>
                                )}
                                {step.executionStart ? (
                                    <Typography variant="caption">
                                        {step.executionStart}
                                    </Typography>
                                ) : (
                                    <></>
                                )}
                            </Stack>
                            {step.isError ? (
                                <StyledContent>
                                    <Typography
                                        variant="caption"
                                        sx={{ padding: '16px', color: 'red' }}
                                    >
                                        {step.error}
                                    </Typography>
                                </StyledContent>
                            ) : null}
                            {step.isSuccessful ? (
                                <StyledContent id="output-content">
                                    <StyledJson>
                                        {JSON.stringify(step.output, null, 4)}
                                    </StyledJson>
                                </StyledContent>
                            ) : null}
                        </Stack>
                    </Card.Actions>
                </StyledCard>
                <Collapse in={(notebook?.selectedStep?.id ?? '') === step.id}>
                    <Stack
                        direction="row"
                        spacing={1}
                        paddingX={2}
                        marginTop={2}
                    >
                        <NotebookAddCellButton
                            query={step.query}
                            previousStepId={step.id}
                        />
                    </Stack>
                </Collapse>
            </>
        );
    },
);
