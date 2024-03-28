import { useEffect, useState, createElement, useMemo, useRef } from 'react';
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
    CustomShapeOptions,
} from '@semoss/ui';
import {
    ContentCopy,
    DeleteOutlined,
    PlayCircle,
    CheckCircle,
    Error,
    Pending,
    KeyboardArrowRight,
} from '@mui/icons-material';
import { ActionMessages } from '@/stores';
import { useBlocks } from '@/hooks';
import { NotebookAddCell } from './NotebookAddCell';
import { NotebookCellConsole } from './NotebookCellConsole';
import { Operation } from './operations';

const StyledStack = styled(Stack)(({ theme }) => ({
    paddingBottom: theme.spacing(2),
}));

const StyledRow = styled(Stack)(() => ({
    position: 'relative',
}));

const StyledName = styled(Typography)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(-1.5),
    left: theme.spacing(10.5),
    paddingLeft: theme.spacing(0.5),
    paddingRight: theme.spacing(0.5),
    zIndex: 1,
    color: theme.palette.text.disabled,
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.background.paper,
    overflow: 'hidden',
}));

const StyledStatusIconContainer = styled('div')(({ theme }) => ({
    height: '100%',
    width: '1.5em',
    display: 'flex',
    paddingTop: theme.spacing(2),
}));

const StyledCollapseStack = styled('div')(({ theme }) => ({
    paddingTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'start',
}));

const StyledRunIconButton = styled(IconButton)(({ theme }) => ({
    padding: 0,
}));

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isCardCellSelected',
})<{ isCardCellSelected: boolean }>(({ theme, isCardCellSelected }) => {
    // const palette = theme.palette as CustomPaletteOptions;
    const shape = theme.shape as CustomShapeOptions;

    return {
        overflow: 'hidden',
        flexGrow: 1,
        cursor: isCardCellSelected ? 'inherit' : 'pointer',
        border: isCardCellSelected
            ? `1px solid ${theme.palette.secondary.main}`
            : 'unset',
        borderRadius: shape.borderRadiusSm,
        boxShadow: 'none',
        '&:hover': {
            boxShadow: 'none',
        },
    };
});

const StyledCardContent = styled(Card.Content)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'start',
    gap: theme.spacing(2),
    margin: '0',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
}));

const StyledCardInput = styled('div')(() => ({
    width: '100%',
}));

const StyledCardActions = styled(Card.Actions)(({ theme }) => ({
    padding: theme.spacing(2),
    margin: '0',
    backgroundColor: theme.palette.background.paper,
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

const StyledSidebar = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    cursor: 'pointer',
    gap: theme.spacing(1),
}));

const StyledExpandArrow = styled(KeyboardArrowRight, {
    shouldForwardProp: (prop) => prop !== 'rotated',
})<{ rotated: boolean }>(({ theme, rotated }) => ({
    color: theme.palette.grey[600],
    transform: rotated ? 'rotate(90deg)' : '',
}));

const StyledAddCellContainer = styled(Stack)(({ theme }) => ({
    marginLeft: `${theme.spacing(9)} !important`,
    height: theme.spacing(5),
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
        const [hoveredActions, setHoveredActions] = useState(false);

        const cardContentRef = useRef(null);
        const cardActionsRef = useRef(null);
        const targetContentCollapseRef = useRef(null);
        const targetActionsCollapseRef = useRef(null);

        // get the cell
        const query = state.getQuery(queryId);
        const cell = query.getCell(cellId);

        useEffect(() => {
            if (cardContentRef.current) {
                const cardContentHeight = cardContentRef.current.offsetHeight; // Consider offsetHeight for borders
                if (targetContentCollapseRef.current) {
                    targetContentCollapseRef.current.style.height = `${cardContentHeight}px`;
                }
            }

            if (cardActionsRef.current) {
                const cardActionsHeight = cardActionsRef.current.offsetHeight; // Consider offsetHeight for borders
                if (targetActionsCollapseRef.current) {
                    targetActionsCollapseRef.current.style.height = `${cardActionsHeight}px`;
                }
            }
        }, [
            cardContentRef.current,
            contentExpanded,
            cardActionsRef.current,
            outputExpanded,
        ]);

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

        const getExecutionLabel = () => {
            let str = '';
            if (cell.isLoading) {
                str = '';
            } else if (cell.query.isLoading) {
                str = '';
            } else if (cell.isSuccessful || cell.isError) {
                str = getExecutionTimeString(
                    cell.executionDurationMilliseconds,
                );
            } else {
                str = 'Pending Execution';
            }

            return <Typography variant="caption">{str}</Typography>;
        };

        const getCellStatusIcon = () => {
            if (cell.isLoading) {
                return <CircularProgress size="1em" />;
            } else if (cell.isSuccessful) {
                return <CheckCircle color="success" />;
            } else if (cell.isError) {
                return <Error color="error" />;
            } else {
                return <Pending color="disabled" />;
            }
        };

        return (
            <StyledStack direction={'column'} gap={1}>
                <StyledRow direction="row" width="100%" spacing={1}>
                    <StyledName variant="subtitle2">
                        {cell.config.name}
                    </StyledName>
                    <StyledSidebar>
                        <StyledStatusIconContainer>
                            {getCellStatusIcon()}
                        </StyledStatusIconContainer>
                        <Stack>
                            <StyledCollapseStack
                                id={`notebook-cell-${queryId}-${cellId}-card-content-collapse`}
                                ref={targetContentCollapseRef}
                                onClick={() => {
                                    setContentExpanded(!contentExpanded);
                                }}
                            >
                                <StyledExpandArrow
                                    fontSize="small"
                                    rotated={contentExpanded}
                                />
                            </StyledCollapseStack>
                            {cell.isExecuted && (
                                <StyledCollapseStack
                                    id={`notebook-cell-${queryId}-${cellId}-card-actions-collapse`}
                                    ref={targetActionsCollapseRef}
                                    onClick={() => {
                                        setOutputExpanded(!outputExpanded);
                                    }}
                                >
                                    <StyledExpandArrow
                                        fontSize="small"
                                        rotated={outputExpanded}
                                    />
                                </StyledCollapseStack>
                            )}
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
                        <StyledCardContent
                            id={`notebook-cell-${queryId}-${cellId}-card-content`}
                            ref={cardContentRef}
                        >
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
                        {cell.isExecuted && (
                            <>
                                {(notebook?.selectedCell?.id ?? '') ==
                                    cell.id && <Divider />}
                                <StyledCardActions
                                    id={`notebook-cell-${queryId}-${cellId}-card-actions`}
                                    ref={cardActionsRef}
                                >
                                    <Stack
                                        id={`notebook-cell-actions-${queryId}-${cellId}`}
                                        direction="column"
                                        width="100%"
                                    >
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            width="100%"
                                            spacing={1}
                                        >
                                            {getExecutionLabel()}
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
                                                            sx={{
                                                                padding: '2px',
                                                            }}
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
                                                    ? cell.operation.map(
                                                          (o, oIdx) => {
                                                              return (
                                                                  <Operation
                                                                      key={oIdx}
                                                                      operation={
                                                                          o
                                                                      }
                                                                      output={
                                                                          cell.output
                                                                      }
                                                                  />
                                                              );
                                                          },
                                                      )
                                                    : null}
                                            </>
                                        )}
                                    </Stack>
                                </StyledCardActions>
                            </>
                        )}
                    </StyledCard>
                </StyledRow>
                <StyledAddCellContainer
                    onMouseEnter={() => {
                        setHoveredActions(true);
                    }}
                    onMouseLeave={() => {
                        setHoveredActions(false);
                    }}
                >
                    <Collapse
                        in={
                            (notebook?.selectedCell?.id ?? '') === cell.id ||
                            hoveredActions
                        }
                    >
                        <NotebookAddCell
                            query={cell.query}
                            previousCellId={cell.id}
                        />
                    </Collapse>
                </StyledAddCellContainer>
            </StyledStack>
        );
    },
);
