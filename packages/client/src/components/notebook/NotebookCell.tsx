import { useState, createElement, useMemo } from 'react';
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
import { NotebookCellConsole } from './NotebookCellConsole';
import { Operation } from './operations';

const StyledRow = styled(Stack)(() => ({
    position: 'relative',
}));

const StyledName = styled(Typography)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(-1.5),
    left: theme.spacing(7.5),
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
    zIndex: 1,
    color: theme.palette.text.disabled,
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.background.default,
    overflow: 'hidden',
}));

const StyledRunIconButton = styled(IconButton)(({ theme }) => ({
    padding: 0,
}));

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isCardCellSelected',
})<{ isCardCellSelected: boolean }>(({ theme, isCardCellSelected }) => ({
    border: isCardCellSelected
        ? `1px solid ${theme.palette.primary.main}`
        : 'unset',
    overflow: 'hidden',
    flexGrow: 1,
    cursor: isCardCellSelected ? 'inherit' : 'pointer',
}));

const StyledCardContent = styled(Card.Content)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'start',
    gap: theme.spacing(2),
    margin: '0',
    padding: theme.spacing(2),
}));

const StyledCardInput = styled('div')(() => ({
    width: '100%',
}));

const StyledCardActions = styled(Card.Actions)(({ theme }) => ({
    padding: theme.spacing(2),
    margin: '0',
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

const StyledSidebar = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
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

const StyledExpandArrow = styled(KeyboardArrowRight, {
    shouldForwardProp: (prop) => prop !== 'rotated',
})<{ rotated: boolean }>(({ theme, rotated }) => ({
    color: theme.palette.grey[600],
    transform: rotated ? 'rotate(90deg)' : '',
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
        const [outputExpanded, setOutputExpanded] = useState(true);

        // get the cell
        const query = state.getQuery(queryId);
        const cell = query.getCell(cellId);

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
                const currentCellIndex = query.list.indexOf(cell.id);

                state.dispatch({
                    message: ActionMessages.DELETE_CELL,
                    payload: {
                        queryId: cell.query.id,
                        cellId: cell.id,
                    },
                });

                notebook.selectCell(
                    queryId,
                    query.list[Math.max(currentCellIndex - 1, 0)],
                );
            } catch (e) {
                console.error(e);
            }
        };

        // render the view
        const rendered = useMemo(() => {
            if (!cell.component) {
                return;
            }

            return createElement(cell.component, {
                cell: cell,
                isExpanded: contentExpanded,
            });
        }, [cell.component ? cell.component : null, contentExpanded]);

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
                <StyledRow direction="row" width="100%" spacing={1}>
                    <StyledName variant="subtitle2">
                        {cell.config.name}
                    </StyledName>
                    <StyledSidebar>
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
                                rotated={contentExpanded}
                            />
                        </Stack>
                        <Stack
                            direction="row"
                            flex={1}
                            alignItems="start"
                            onClick={() => {
                                setOutputExpanded(!outputExpanded);
                            }}
                        >
                            <StyledStatusSidebar status={getSidebarStatus()} />
                            <StyledExpandArrow
                                fontSize="small"
                                rotated={outputExpanded}
                            />
                        </Stack>
                    </StyledSidebar>
                    <StyledCard
                        isCardCellSelected={
                            (notebook?.selectedCell?.id ?? '') == cell.id
                        }
                        onClick={() => {
                            notebook.selectCell(cell.query.id, cell.id);
                        }}
                    >
                        <StyledCardContent>
                            <StyledRunIconButton
                                title="Run cell"
                                disabled={cell.isLoading}
                                size="medium"
                                onClick={() =>
                                    state.dispatch({
                                        message: ActionMessages.RUN_CELL,
                                        payload: {
                                            queryId: cell.query.id,
                                            cellId: cell.id,
                                        },
                                    })
                                }
                            >
                                <PlayCircle fontSize="inherit" />
                            </StyledRunIconButton>
                            <StyledCardInput>{rendered}</StyledCardInput>
                        </StyledCardContent>
                        <Divider />
                        <StyledCardActions>
                            <Stack
                                id={`notebook-cell-actions-${queryId}-${cellId}`}
                                direction="column"
                                spacing={2}
                                width="100%"
                            >
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    width="100%"
                                    spacing={1}
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
                                    <Stack flex={1}>&nbsp;</Stack>
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCell();
                                            }}
                                        >
                                            <StyledButtonLabel>
                                                <DeleteOutlined fontSize="small" />
                                            </StyledButtonLabel>
                                        </StyledButtonGroupButton>
                                    </ButtonGroup>
                                </Stack>
                                {outputExpanded && (
                                    <>
                                        <NotebookCellConsole
                                            messages={cell.messages}
                                        />
                                        {cell.isExecuted
                                            ? cell.operation.map((o, oIdx) => {
                                                  return (
                                                      <Operation
                                                          key={oIdx}
                                                          operation={o}
                                                          output={cell.output}
                                                      />
                                                  );
                                              })
                                            : null}
                                    </>
                                )}
                            </Stack>
                        </StyledCardActions>
                    </StyledCard>
                </StyledRow>
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
