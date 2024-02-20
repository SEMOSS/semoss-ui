import { useState, createElement, useMemo, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    Typography,
    ButtonGroup,
    CircularProgress,
    Card,
    Chip,
    Collapse,
    useNotification,
    IconButton,
    Divider,
} from '@semoss/ui';
import {
    ContentCopy,
    DeleteOutlined,
    PlayCircle,
    CheckCircle,
    Error,
    PendingOutlined,
    KeyboardArrowRight,
} from '@mui/icons-material';
import { ActionMessages } from '@/stores';
import { useBlocks } from '@/hooks';
import { NotebookAddCellButton } from './NotebookAddCellButton';

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isCardCellSelected',
})<{ isCardCellSelected: boolean }>(({ theme, isCardCellSelected }) => ({
    border: isCardCellSelected
        ? `1px solid ${theme.palette.primary.main}`
        : 'unset',
    overflow: 'visible',
    flexGrow: 1,
}));

const StyleCardContent = styled(Card.Content)(() => ({
    margin: '0!important',
    padding: '0!important',
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
    margin: `${theme.spacing(1)} 0`,
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
            ? theme.palette.grey[300]
            : theme.palette[status].main
        : 'unset',
    color:
        status && status !== 'disabled'
            ? theme.palette.background.paper
            : 'unset',
    '.MuiChip-avatar': {
        color: 'unset',
    },
}));

const StyledIdChip = styled(Chip)(({ theme }) => ({
    backgroundColor: theme.palette.grey[300],
    height: theme.spacing(3.5),
}));

const StyledJson = styled('pre')(({ theme }) => ({
    ...theme.typography.body2,
    textWrap: 'wrap',
    maxHeight: '200px',
    overflowY: 'scroll',
}));

const StyledSidebarStack = styled(Stack)(() => ({
    cursor: 'pointer',
}));

const StyledStatusSidebar = styled('div', {
    shouldForwardProp: (prop) => prop !== 'status',
})<{ status: 'success' | 'error' | 'primary' | 'disabled' }>(
    ({ theme, status }) => ({
        height: '100%',
        width: theme.spacing(0.5),
        backgroundColor:
            status === 'disabled'
                ? theme.palette.grey[400]
                : theme.palette[status].main,
    }),
);

const StyledExpandArrow = styled(KeyboardArrowRight)(({ theme }) => ({
    color: theme.palette.grey[600],
    '&.rotate': {
        transform: 'rotate(90deg)',
    },
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

        const notification = useNotification();

        const [contentExpanded, setContentExpanded] = useState(true);
        const [actionsExpanded, setActionsExpanded] = useState(true);
        const [actionsHeight, setActionsHeight] = useState(44);

        // get the cell
        const query = state.getQuery(queryId);
        const cell = query.getCell(cellId);

        // const contentElement = document.getElementById(`notebook-cell-actions-${queryId}-${cellId}`);

        // calculate the height of the main card content so we know where to place the side expansions
        useEffect(() => {
            if (!actionsExpanded) {
                setActionsHeight(44);
            }
            const actionsElement = document.getElementById(
                `notebook-cell-actions-${queryId}-${cellId}`,
            );
            if (actionsElement) {
                const actionsElementHeight =
                    actionsElement.getBoundingClientRect().height + 20;
                setActionsHeight(
                    actionsElementHeight + 20 < 50 ? 50 : actionsElementHeight,
                );
            } else {
                setActionsHeight(50);
            }
        }, [cell.output, actionsExpanded]);

        /**
         * Create a duplicate cell
         */
        const duplicateCell = () => {
            try {
                const newCellId = `${Math.floor(Math.random() * 100000)}`;

                // copy and add the step to the end
                state.dispatch({
                    message: ActionMessages.NEW_CELL,
                    payload: {
                        queryId: queryId,
                        cellId: newCellId,
                        previousCellId: cellId,
                        config: {
                            widget: cell.widget,
                            parameters: {
                                ...cell.parameters,
                            },
                        },
                    },
                });
                notebook.selectCell(queryId, newCellId);
            } catch (e) {
                console.error(e);
            }
        };

        const deleteCell = () => {
            try {
                state.dispatch({
                    message: ActionMessages.DELETE_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                    },
                });

                notebook.selectCell(queryId, query.list[0]);
            } catch (e) {
                console.error(e);
            }
        };

        // get the view
        const cellType = cell.cellType;

        // render the title
        const renderedTitle = useMemo(() => {
            if (!cellType) {
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
        }, [cellType ? cellType.view.title : null]);

        // render the input
        const renderedInput = useMemo(() => {
            if (!cellType) {
                return;
            }

            return createElement(observer(cellType.view.input), {
                cell: cell,
                isExpanded: contentExpanded,
            });
        }, [cellType ? cellType.view.input : null, contentExpanded]);

        // render the details
        const renderedDetails = useMemo(() => {
            if (!cellType || !cellType.view.details) {
                return;
            }

            return createElement(observer(cellType.view.details), {
                cell: cell,
                isExpanded: contentExpanded,
            });
        }, [cellType ? cellType.view.details : null, contentExpanded]);

        // render the output
        const renderedOutput = useMemo(() => {
            if (!cellType || !cellType.view.output) {
                return;
            }

            return createElement(observer(cellType.view.output), {
                cell: cell,
            });
        }, [cellType ? cellType.view.output : null]);

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
                return <PendingOutlined color="inherit" />;
            } else if (cell.isSuccessful) {
                return <CheckCircle color="inherit" />;
            } else if (cell.isError) {
                return <Error color="inherit" />;
            } else {
                return <PendingOutlined color="inherit" />;
            }
        };
        const getSidebarStatus = () => {
            if (cell.isLoading) {
                return 'primary';
            } else if (cell.isSuccessful) {
                return 'success';
            } else if (cell.isError) {
                return 'error';
            } else if ((notebook?.selectedCell?.id ?? '') === cell.id) {
                return 'primary';
            } else {
                return 'disabled';
            }
        };

        return (
            <>
                <Stack direction="row" width="100%">
                    <StyledSidebarStack margin={0}>
                        <Stack
                            direction="row"
                            flex={1}
                            alignItems="start"
                            onClick={() => {
                                setContentExpanded(!contentExpanded);
                            }}
                        >
                            <StyledStatusSidebar status={getSidebarStatus()} />
                            <StyledExpandArrow
                                fontSize="small"
                                className={contentExpanded ? 'rotate' : ''}
                            />
                        </Stack>
                        <Stack
                            direction="row"
                            height={actionsExpanded ? actionsHeight : 50}
                            marginTop="0!important"
                            alignItems="start"
                            onClick={() => {
                                setActionsExpanded(!actionsExpanded);
                            }}
                        >
                            <StyledStatusSidebar status={getSidebarStatus()} />
                            <StyledExpandArrow
                                fontSize="small"
                                className={actionsExpanded ? 'rotate' : ''}
                            />
                        </Stack>
                    </StyledSidebarStack>
                    <StyledCard
                        isCardCellSelected={
                            (notebook?.selectedCell?.id ?? '') == cell.id
                        }
                        onClick={() =>
                            notebook.selectCell(cell.query.id, cell.id)
                        }
                    >
                        <StyleCardContent>
                            {renderedDetails}
                            <Stack
                                id={`notebook-cell-content-${queryId}-${cellId}`}
                                direction="row"
                                alignContent="start"
                                paddingTop={0.5}
                                paddingX={2}
                            >
                                <Stack>
                                    <IconButton
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
                                        <PlayCircle fontSize="small" />
                                    </IconButton>
                                </Stack>
                                {renderedInput}
                            </Stack>
                        </StyleCardContent>
                        <StyledDivider />
                        <Card.Actions>
                            <Stack
                                spacing={2}
                                width="100%"
                                id={`notebook-cell-actions-${queryId}-${cellId}`}
                            >
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
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
                                    </Stack>
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
                                                    <span>{`${cell.id}`}</span>
                                                    <ContentCopy fontSize="inherit" />
                                                </Stack>
                                            }
                                            title="Copy cell id"
                                            onClick={() => {
                                                try {
                                                    navigator.clipboard.writeText(
                                                        cell.id,
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
                                        {renderedTitle}
                                        <ButtonGroup variant="outlined">
                                            <StyledButtonGroupButton
                                                title="Duplicate cell"
                                                size="small"
                                                disabled={cell.isLoading}
                                                onClick={(e) => {
                                                    // stop propogation to card parent so newly created cell will be selected
                                                    e.stopPropagation();
                                                    duplicateCell();
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
                                                    deleteCell();
                                                }}
                                            >
                                                <StyledButtonLabel>
                                                    <DeleteOutlined fontSize="small" />
                                                </StyledButtonLabel>
                                            </StyledButtonGroupButton>
                                        </ButtonGroup>
                                    </Stack>
                                </Stack>
                                {actionsExpanded && (
                                    <>
                                        {cell.isError ? (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    padding: '16px',
                                                    color: 'red',
                                                }}
                                            >
                                                {cell.error}
                                            </Typography>
                                        ) : null}
                                        {cell.isSuccessful
                                            ? renderedOutput
                                            : null}
                                    </>
                                )}
                            </Stack>
                        </Card.Actions>
                    </StyledCard>
                </Stack>
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
