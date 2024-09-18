import { useEffect, useState, createElement, useMemo, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    Typography,
    Button,
    ButtonGroup,
    CircularProgress,
    Card,
    Chip,
    Collapse,
    useNotification,
    IconButton,
    Divider,
    CustomShapeOptions,
    TextField,
    Menu,
    MenuProps,
    Modal,
} from '@semoss/ui';
import {
    ContentCopy,
    Delete,
    PlayCircle,
    CheckCircle,
    Error,
    Pending,
    KeyboardArrowRight,
    MoreVert,
    Link,
    ArrowUpward,
    ArrowDownward,
    PlayArrowRounded,
    LowPriority,
    LibraryAdd,
} from '@mui/icons-material';
import { ActionMessages } from '@/stores';
import { useBlocks } from '@/hooks';
import { NotebookAddCell } from './NotebookAddCell';
import { NotebookCellConsole } from './NotebookCellConsole';
import { Operation } from './operations';
import { copyTextToClipboard } from '@/utility';
import { AddVariableModal } from './AddVariableModal';

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

const StyledCellActions = styled(Collapse)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(-2),
    right: theme.spacing(2),
    zIndex: 1,
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.background.paper,
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

const StyledActionsCollapseStack = styled(StyledCollapseStack)(({ theme }) => ({
    marginTop: '0px !important',
}));

const StyledRunIconButton = styled(IconButton)(({ theme }) => ({
    padding: 0,
    width: '35px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'start',
    // removes gray hover background made visible by width added to accomodate brackets
    '&:hover': {
        backgroundColor: '#00000000',
    },
}));

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isCardCellSelected',
})<{ isCardCellSelected: boolean }>(({ theme, isCardCellSelected }) => {
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
    width: '98%',
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
}));

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
    border: `1px solid ${theme.palette.text.secondary}`,
}));

const StyledIdChip = styled(Chip)(({ theme }) => ({
    height: theme.spacing(3.5),
}));

const StyledSidebar = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    cursor: 'pointer',
    gap: theme.spacing(1),
}));
const StyledExpandContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '1.5em',
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

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        marginTop: theme.spacing(1),
    },
    '.MuiList-root': {
        padding: 0,
    },
}));

const StyledMenuItem = styled(Menu.Item)(() => ({
    textTransform: 'capitalize',
}));

const StyledPlayWrapper = styled('span')(() => ({
    fontSize: '17px',
    display: 'inline-block',
}));

const StyledPlaySpacer = styled('span')(() => ({
    display: 'inline-block',
    width: '17px',
}));

interface NotebookCellProps {
    /** Id of the  the query */
    queryId: string;

    /** Id of the cell of the query */
    cellId: string;

    /** Id of the cell of the query */
    cellPlayCounter: number;

    /** Id of the cell of the query */
    setCellPlayCounter: (count: number) => void;
}

/**
 * Render the content of a cell in the notebook
 */
export const NotebookCell = observer(
    (props: NotebookCellProps): JSX.Element => {
        const { queryId, cellId, cellPlayCounter, setCellPlayCounter } = props;

        const { state, notebook } = useBlocks();

        const notification = useNotification();

        const [contentExpanded, setContentExpanded] = useState(true);
        const [outputExpanded, setOutputExpanded] = useState(true);
        const [hoveredAddCellActions, setHoveredAddCellActions] =
            useState(false);
        const [showCellActions, setShowCellActions] = useState(false);

        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const open = Boolean(anchorEl);

        const [localCellPlayNumber, setLocalCellPlayNumber] = useState(null);

        const [variableModal, setVariableModal] = useState(false);
        const [newAlias, setNewAlias] = useState('');

        const cardContentRef = useRef(null);
        const cardActionsRef = useRef(null);
        const targetContentCollapseRef = useRef(null);
        const targetActionsCollapseRef = useRef(null);

        // get the cell
        const query = state.getQuery(queryId);
        const cell = query.getCell(cellId);

        const variableName = state.getAlias(queryId, cellId);

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

        useEffect(() => {
            // if (cellPlayCounter > 0) {
            if (cell.isExecuted == false) {
                setLocalCellPlayNumber(null);
            } else {
                const newPlayCount = cellPlayCounter + 1;
                setCellPlayCounter(newPlayCount);
                setLocalCellPlayNumber(newPlayCount);
            }
            // }
        }, [cell.isExecuted]);

        useEffect(() => {
            if (cellPlayCounter == null) {
                setLocalCellPlayNumber(null);
                setCellPlayCounter(null);
            }
        }, [cellPlayCounter]);

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

        const runCellAndBelowHandler = () => {
            try {
                const currentCellIndex = query.list.indexOf(cell.id);
                const allCells = query.list;

                allCells.slice(currentCellIndex).forEach((currCellId, idx) => {
                    state.dispatch({
                        message: ActionMessages.RUN_CELL,
                        payload: {
                            queryId: cell.query.id,
                            cellId: currCellId,
                        },
                    });
                });
            } catch (e) {
                console.error(e);
            }
        };

        const runCellsAboveHandler = () => {
            try {
                const currentCellIndex = query.list.indexOf(cell.id);
                const allCells = query.list;
                allCells
                    .slice(0, currentCellIndex)
                    .forEach((currCellId, idx) => {
                        state.dispatch({
                            message: ActionMessages.RUN_CELL,
                            payload: {
                                queryId: cell.query.id,
                                cellId: currCellId,
                            },
                        });
                    });
            } catch (e) {
                console.error(e);
            }
        };

        const generateWithAIHandler = () => {
            console.log('generateWithAIHandler');
        };

        return (
            <StyledStack
                direction={'column'}
                gap={1}
                onMouseEnter={() => {
                    setShowCellActions(true);
                }}
                onMouseLeave={() => {
                    setShowCellActions(false);
                }}
                onFocus={() => {
                    console.log('onFocus');
                    // Keyboard Navigation
                    setShowCellActions(true);
                }}
                onBlur={() => {
                    console.log('onBlur');
                    // Keyboard Navigation
                    setShowCellActions(false);
                }}
            >
                <StyledRow direction="row" width="100%" spacing={1}>
                    <StyledName variant="subtitle2">
                        {variableName ? variableName : cell.config.name}
                    </StyledName>

                    <StyledCellActions in={showCellActions}>
                        <Stack gap={1} direction={'row'} alignItems={'center'}>
                            <StyledButtonGroup variant="outlined">
                                <StyledButtonGroupButton
                                    title="Run this cell and below"
                                    size="small"
                                    disabled={cell.isLoading}
                                    onClick={(e) => {
                                        // stop propogation to card parent so newly created cell will be selected
                                        e.stopPropagation();
                                        runCellAndBelowHandler();
                                    }}
                                >
                                    <StyledButtonLabel>
                                        <PlayArrowRounded
                                            fontSize="medium"
                                            sx={{
                                                padding: '2px',
                                            }}
                                        />
                                        <ArrowDownward
                                            fontSize="small"
                                            // styles only applying correctly with sx could not use styled
                                            sx={{
                                                marginTop: '10px',
                                                marginLeft: '15px',
                                                position: 'absolute',
                                                width: '10px',
                                            }}
                                        />
                                    </StyledButtonLabel>
                                </StyledButtonGroupButton>
                                <StyledButtonGroupButton
                                    title="Run the cells above"
                                    size="small"
                                    disabled={cell.isLoading}
                                    onClick={(e) => {
                                        // stop propogation to card parent so newly created cell will be selected
                                        e.stopPropagation();
                                        runCellsAboveHandler();
                                    }}
                                >
                                    <StyledButtonLabel>
                                        <PlayArrowRounded
                                            fontSize="medium"
                                            sx={{
                                                padding: '2px',
                                            }}
                                        />
                                        <ArrowUpward
                                            fontSize="small"
                                            // styles only applying correctly with sx
                                            sx={{
                                                marginTop: '10px',
                                                marginLeft: '15px',
                                                position: 'absolute',
                                                width: '10px',
                                            }}
                                        />
                                    </StyledButtonLabel>
                                </StyledButtonGroupButton>
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
                                        <LowPriority
                                            fontSize="medium"
                                            sx={{
                                                padding: '2px',
                                            }}
                                        />
                                    </StyledButtonLabel>
                                </StyledButtonGroupButton>
                                {variableName ? (
                                    <StyledButtonGroupButton
                                        title={`Copy (${variableName})`}
                                        size="small"
                                        disabled={cell.isLoading}
                                        onClick={(e) => {
                                            // stop propogation to card parent so newly created cell will be selected
                                            e.stopPropagation();
                                            copyTextToClipboard(
                                                `{{${variableName}}}`,
                                                notification,
                                            );
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
                                ) : (
                                    <StyledButtonGroupButton
                                        title="Use as variable"
                                        size="small"
                                        disabled={cell.isLoading}
                                        onClick={(e) => {
                                            // stop propogation to card parent so newly created cell will be selected
                                            e.stopPropagation();
                                            setVariableModal(true);
                                        }}
                                    >
                                        <StyledButtonLabel>
                                            <LibraryAdd
                                                fontSize="medium"
                                                sx={{
                                                    padding: '2px',
                                                }}
                                            />
                                        </StyledButtonLabel>
                                    </StyledButtonGroupButton>
                                )}
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
                                        <Delete fontSize="small" />
                                    </StyledButtonLabel>
                                </StyledButtonGroupButton>
                                <StyledButtonGroupButton
                                    title="Delete cell"
                                    disabled={cell.isLoading}
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAnchorEl(e.currentTarget);
                                    }}
                                >
                                    <StyledButtonLabel>
                                        <MoreVert fontSize="small" />
                                    </StyledButtonLabel>
                                </StyledButtonGroupButton>
                            </StyledButtonGroup>

                            {/**
                             * more options menu
                             * only showing one option currently with no attached function
                             **/}
                            <StyledMenu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={() => {
                                    setAnchorEl(null);
                                }}
                            >
                                <StyledMenuItem
                                    disabled={true}
                                    value={'generate-with-ai'}
                                    onClick={() => {
                                        setAnchorEl(null);
                                        generateWithAIHandler();
                                    }}
                                >
                                    Generate with AI
                                </StyledMenuItem>
                            </StyledMenu>
                        </Stack>
                    </StyledCellActions>

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
                                title={`${
                                    contentExpanded ? 'Collapse' : 'Open'
                                } cell ${cellId} input`}
                            >
                                <StyledExpandContainer>
                                    <StyledExpandArrow
                                        fontSize="small"
                                        rotated={contentExpanded}
                                    />
                                </StyledExpandContainer>
                            </StyledCollapseStack>
                            {cell.isExecuted && (
                                <StyledActionsCollapseStack
                                    id={`notebook-cell-${queryId}-${cellId}-card-actions-collapse`}
                                    ref={targetActionsCollapseRef}
                                    onClick={() => {
                                        setOutputExpanded(!outputExpanded);
                                    }}
                                    title={`${
                                        outputExpanded ? 'Collapse' : 'Open'
                                    } cell ${cellId} output`}
                                >
                                    <StyledExpandContainer>
                                        <StyledExpandArrow
                                            fontSize="small"
                                            rotated={outputExpanded}
                                        />
                                    </StyledExpandContainer>
                                </StyledActionsCollapseStack>
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
                                onMouseDown={() => {
                                    state.dispatch({
                                        message: ActionMessages.RUN_CELL,
                                        payload: {
                                            queryId: cell.query.id,
                                            cellId: cell.id,
                                        },
                                    });
                                }}
                            >
                                {showCellActions ? (
                                    <PlayCircle fontSize="inherit" />
                                ) : (
                                    <StyledPlayWrapper>
                                        {localCellPlayNumber ? (
                                            `[ ${localCellPlayNumber} ]`
                                        ) : (
                                            <span>
                                                [<StyledPlaySpacer />]
                                            </span>
                                        )}
                                    </StyledPlayWrapper>
                                )}
                            </StyledRunIconButton>
                            {/* { cell.widget == 'data-import' ?
                                <div>data import bubbles</div>
                                : */}
                            <StyledCardInput>{rendered}</StyledCardInput>
                            {/* } */}
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
                                            // spacing={1}
                                        >
                                            {getExecutionLabel()}
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
                        setHoveredAddCellActions(true);
                    }}
                    onMouseLeave={() => {
                        setHoveredAddCellActions(false);
                    }}
                    onFocus={() => {
                        // Keyboard Navigation
                        setHoveredAddCellActions(true);
                    }}
                    onBlur={() => {
                        // Keyboard Navigation
                        setHoveredAddCellActions(false);
                    }}
                >
                    <Collapse
                        in={
                            (notebook?.selectedCell?.id ?? '') === cell.id ||
                            hoveredAddCellActions
                        }
                    >
                        <NotebookAddCell
                            query={cell.query}
                            previousCellId={cell.id}
                        />
                    </Collapse>
                </StyledAddCellContainer>

                <AddVariableModal
                    open={variableModal}
                    type={'cell'}
                    to={queryId}
                    cellId={cellId}
                    onClose={() => {
                        setVariableModal(false);
                    }}
                />
            </StyledStack>
        );
    },
);
