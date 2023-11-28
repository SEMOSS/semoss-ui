import { createElement, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    Divider,
    Typography,
    Chip,
    ButtonGroup,
} from '@semoss/ui';
import {
    ContentCopyOutlined,
    DeleteOutlined,
    PlayArrowRounded,
} from '@mui/icons-material';
import { StepState } from '@/stores';
import { useNotebook } from '@/hooks';

const StyledDivider = styled(Divider)(() => ({
    flex: 1,
}));

const StyledText = styled(Typography)(({ theme }) => ({
    textAlign: 'center',
    lineHeight: theme.spacing(3),
    width: theme.spacing(3),
}));

const StyledHeader = styled(Stack)(({ theme }) => ({
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledContent = styled('div')(({ theme }) => ({
    width: '100%',
    overflow: 'hidden',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
}));

interface NotebookStepProps {
    /** Step to bind the notebook step to */
    step: StepState;
}

/**
 * Render the content of a step in the notebook
 */
export const NotebookStep = observer(
    (props: NotebookStepProps): JSX.Element => {
        const { step } = props;

        const { notebook } = useNotebook();

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

        return (
            <Stack
                direction="row"
                spacing={2}
                onClick={() =>
                    notebook.selectStep(notebook.selectedQuery.id, step.id)
                }
            >
                <Stack
                    direction="column"
                    alignItems="center"
                    paddingTop={2}
                    spacing={2}
                >
                    <StyledText variant="body1">[1]</StyledText>
                    <StyledDivider orientation="vertical" light={true} />
                </Stack>
                <Stack direction="column" spacing={3} flex={1} minWidth={0}>
                    <StyledContent>
                        <StyledHeader
                            alignItems={'center'}
                            justifyContent={'space-between'}
                            direction="row"
                            paddingX={2}
                            paddingY={1.25}
                            spacing={2}
                        >
                            {renderedTitle}
                            <ButtonGroup size="small">
                                <ButtonGroup.Item
                                    title="Run the cell"
                                    variant="outlined"
                                    startIcon={<PlayArrowRounded />}
                                    disabled={step.isLoading}
                                    onClick={() =>
                                        notebook.runStep(step.query.id, step.id)
                                    }
                                >
                                    Run
                                </ButtonGroup.Item>
                                <ButtonGroup.Item
                                    title="Duplicate the step"
                                    variant="outlined"
                                    onClick={() => {
                                        // copy and add the step to the end
                                        notebook.newStep(
                                            step.query.id,
                                            `${Math.floor(
                                                Math.random() * 1000000000000,
                                            )}`,
                                            {
                                                widget: step.widget,
                                                parameters: {
                                                    ...step.parameters,
                                                },
                                                output: undefined,
                                                operation: [],
                                            },
                                            step.id,
                                        );
                                    }}
                                >
                                    <ContentCopyOutlined fontSize="small" />
                                </ButtonGroup.Item>
                                <ButtonGroup.Item
                                    title="Delete the step"
                                    variant="outlined"
                                    onClick={() => {
                                        // copy and add the step to the end
                                        notebook.deleteStep(
                                            notebook.selectedQuery.id,
                                            step.id,
                                        );
                                    }}
                                >
                                    <DeleteOutlined fontSize="small" />
                                </ButtonGroup.Item>
                            </ButtonGroup>
                        </StyledHeader>
                        {renderedInput}
                    </StyledContent>
                    {step.isExecuted && (
                        <>
                            <Stack
                                direction={'row'}
                                spacing={1}
                                alignItems={'flex-start'}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="30"
                                    height="17"
                                    viewBox="0 0 30 17"
                                    fill="none"
                                >
                                    <path
                                        d="M29.3536 13.3536C29.5488 13.1583 29.5488 12.8417 29.3536 12.6464L26.1716 9.46447C25.9763 9.2692 25.6597 9.2692 25.4645 9.46447C25.2692 9.65973 25.2692 9.97631 25.4645 10.1716L28.2929 13L25.4645 15.8284C25.2692 16.0237 25.2692 16.3403 25.4645 16.5355C25.6597 16.7308 25.9763 16.7308 26.1716 16.5355L29.3536 13.3536ZM0 13.5H29V12.5H0V13.5Z"
                                        fill="#8E8E8E"
                                    />
                                    <line
                                        x1="0.5"
                                        y1="13"
                                        x2="0.5"
                                        stroke="#8E8E8E"
                                    />
                                </svg>
                                <Chip
                                    label={step.isError ? 'Error' : 'Success'}
                                    color={step.isError ? 'lcpink' : 'green'}
                                />
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
                                <StyledContent>
                                    <Typography
                                        variant="body2"
                                        sx={{ padding: '16px' }}
                                    >
                                        {JSON.stringify(step.output)}
                                    </Typography>
                                </StyledContent>
                            ) : null}
                        </>
                    )}
                </Stack>
            </Stack>
        );
    },
);
