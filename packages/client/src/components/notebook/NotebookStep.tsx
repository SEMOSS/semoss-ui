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
} from '@semoss/ui';
import {
    ContentCopy,
    DeleteOutlined,
    PlayArrowRounded,
    CheckCircle,
    Error,
    Pending,
} from '@mui/icons-material';
import { ActionMessages } from '@/stores';
import { useBlocks, useWorkspace } from '@/hooks';
import { NotebookAddCellButton } from './NotebookAddCellButton';
import { NewCellOverlay } from './NewCellOverlay';

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isCardCellSelected',
})<{ isCardCellSelected: boolean }>(({ theme, isCardCellSelected }) => ({
    border: isCardCellSelected
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

interface NotebookCellProps {
    /** Id of the  the query */
    queryId: string;

    /** Id of the cell of the query */
    cellId: string;
}

/**
 * Render the content of a cell in the notebook
 */
export const NotebookCell = observer(
    (props: NotebookCellProps): JSX.Element => {
        const { queryId, cellId } = props;

        const { state, notebook } = useBlocks();

        const { workspace } = useWorkspace();

        /**
         * Create a new cell
         */
        const openCopyCellOverlay = () => {
            workspace.openOverlay(() => {
                return (
                    <NewCellOverlay
                        copyParameters
                        queryId={queryId}
                        previousCellId={cellId}
                        onClose={(newCellId) => {
                            workspace.closeOverlay();

                            if (newCellId) {
                                notebook.selectCell(queryId, newCellId);
                            }
                        }}
                    />
                );
            });
        };

        // get the cell
        const query = state.getQuery(queryId);
        const cell = query.getCell(cellId);

        // get the type
        const cellType = cell.cellType;

        // render the title
        const renderedTitle = useMemo(() => {
            if (!cell) {
                return;
            }

            if (typeof cellType.view.title === 'string') {
                return (
                    <Typography variant="body2">
                        {cellType.view.title}
                    </Typography>
                );
            }

            return createElement(observer(cellType.view.title), {
                cell: cell,
            });
        }, [cell ? cellType.view.title : null]);

        // render the title
        const renderedInput = useMemo(() => {
            if (!cell) {
                return;
            }

            return createElement(observer(cellType.view.input), {
                cell: cell,
            });
        }, [cell ? cellType.view.input : null]);

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

        // if we are able to get more granular cell loading info when running the full query, we can remove the cell.query.isLoading checks
        const getCellChipStatus = () => {
            if (cell.isLoading || cell.query.isLoading) {
                return `disabled`;
            } else if (cell.isSuccessful) {
                return 'success';
            } else if (cell.isError) {
                return 'error';
            } else {
                return 'disabled';
            }
        };
        const getCellChipLabel = () => {
            if (cell.isLoading) {
                return 'Loading';
            } else if (cell.query.isLoading) {
                return 'Query Loading';
            } else if (cell.isSuccessful) {
                return 'Success';
            } else if (cell.isError) {
                return 'Error';
            } else {
                return 'Pending Execution';
            }
        };
        const getCellChipIcon = () => {
            if (cell.isLoading) {
                return <CircularProgress size="0.75rem" />;
            } else if (cell.query.isLoading) {
                return <Pending color="inherit" />;
            } else if (cell.isSuccessful) {
                return <CheckCircle color="inherit" />;
            } else if (cell.isError) {
                return <Error color="inherit" />;
            } else {
                return <Pending color="inherit" />;
            }
        };

        return (
            <>
                <StyledCard
                    isCardCellSelected={
                        (notebook?.selectedCell?.id ?? '') == cell.id
                    }
                    onClick={() => notebook.selectCell(cell.query.id, cell.id)}
                >
                    <Card.Header
                        title={
                            <Stack
                                alignItems="center"
                                justifyContent="space-between"
                                direction="row"
                            >
                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                >
                                    {renderedTitle}
                                    <Typography variant="subtitle1">
                                        {cell.id}
                                    </Typography>
                                </Stack>
                                <ButtonGroup variant="outlined">
                                    <StyledButtonGroupButton
                                        title="Run cell"
                                        disabled={cell.isLoading}
                                        size="small"
                                        onClick={() =>
                                            state.dispatch({
                                                message:
                                                    ActionMessages.RUN_CELL,
                                                payload: {
                                                    queryId: cell.query.id,
                                                    cellId: cell.id,
                                                },
                                            })
                                        }
                                    >
                                        <StyledButtonLabel>
                                            <PlayArrowRounded fontSize="small" />
                                        </StyledButtonLabel>
                                    </StyledButtonGroupButton>
                                    <StyledButtonGroupButton
                                        title="Duplicate cell"
                                        size="small"
                                        disabled={cell.isLoading}
                                        onClick={(e) => {
                                            // stop propogation to card parent so newly created cell will be selected
                                            e.stopPropagation();
                                            openCopyCellOverlay();
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
                                        title="Delete cell"
                                        disabled={cell.isLoading}
                                        size="small"
                                        onClick={() => {
                                            state.dispatch({
                                                message:
                                                    ActionMessages.DELETE_CELL,
                                                payload: {
                                                    queryId: cell.query.id,
                                                    cellId: cell.id,
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
                                    avatar={getCellChipIcon()}
                                    label={getCellChipLabel()}
                                    status={getCellChipStatus()}
                                />
                                {cell.executionDurationMilliseconds ? (
                                    <Typography variant="caption">
                                        {getExecutionTimeString(
                                            cell.executionDurationMilliseconds,
                                        )}
                                    </Typography>
                                ) : (
                                    <></>
                                )}
                                {cell.executionDurationMilliseconds &&
                                cell.executionStart ? (
                                    <Typography variant="caption">|</Typography>
                                ) : (
                                    <></>
                                )}
                                {cell.executionStart ? (
                                    <Typography variant="caption">
                                        {cell.executionStart}
                                    </Typography>
                                ) : (
                                    <></>
                                )}
                            </Stack>
                            {cell.isError ? (
                                <StyledContent>
                                    <Typography
                                        variant="caption"
                                        sx={{ padding: '16px', color: 'red' }}
                                    >
                                        {cell.error}
                                    </Typography>
                                </StyledContent>
                            ) : null}
                            {cell.isSuccessful ? (
                                <StyledContent id="output-content">
                                    <StyledJson>
                                        {JSON.stringify(cell.output, null, 4)}
                                    </StyledJson>
                                </StyledContent>
                            ) : null}
                        </Stack>
                    </Card.Actions>
                </StyledCard>
                <Collapse in={(notebook?.selectedCell?.id ?? '') === cell.id}>
                    <Stack
                        direction="row"
                        spacing={1}
                        paddingX={2}
                        marginTop={2}
                    >
                        <NotebookAddCellButton
                            query={cell.query}
                            previousCellId={cell.id}
                        />
                    </Stack>
                </Collapse>
            </>
        );
    },
);
