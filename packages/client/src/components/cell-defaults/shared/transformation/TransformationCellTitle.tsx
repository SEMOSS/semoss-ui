import { useEffect, useState } from 'react';
import { computed } from 'mobx';
import { styled, Button, Menu, MenuProps, List } from '@semoss/ui';
import {
    ActionMessages,
    CellState,
    CellStateConfig,
    NewCellAction,
} from '@/stores';
import { useBlocks } from '@/hooks';
import {
    FilterFrames,
    Transform,
    KeyboardArrowDown,
} from '@mui/icons-material';
import { Transformations } from './transformation.constants';
import { TransformationCellDef } from './transformation.types';
import { DefaultCells } from '../..';

const StyledButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ theme, error }) => ({
    color: error
        ? `${theme.palette.error.main}!important`
        : theme.palette.text.secondary,
    border: `1px solid ${
        error ? theme.palette.error.main : theme.palette.text.secondary
    }!important`,
}));

const StyledButtonLabel = styled('span', {
    shouldForwardProp: (prop) => prop !== 'width',
})<{ width: number }>(({ theme, width }) => ({
    width: theme.spacing(width),
    display: 'block',
    textAlign: 'start',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textWrap: 'nowrap',
}));

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
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

export const TransformationCellTitle = (props: {
    /** Cell that is controlling the cell */
    cell: CellState<TransformationCellDef>;
    /** Whether the content is expanded */
    isExpanded?: boolean;
}) => {
    const { cell } = props;
    const { state, notebook } = useBlocks();

    const isValidFrameTypeForTransformation = (frameType: string) => {
        return frameType === 'PY' || frameType === 'R';
    };

    const availableFrameCells = computed(() => {
        const currentCellIndex = cell.query.list.indexOf(cell.id);
        return Object.values(cell.query.cells).filter((queryCell) => {
            // ignore cells that occur after the current cell
            if (cell.query.list.indexOf(queryCell.id) > currentCellIndex) {
                return false;
            }

            // consider query import cells with PY or R frame types only
            if (
                queryCell.widget === 'query-import' &&
                isValidFrameTypeForTransformation(
                    queryCell.parameters.frameType as string,
                )
            ) {
                return true;
            }

            return false;
        });
    }).get();

    const changeTransformationType = (newTransformationWidget: string) => {
        let previousCellId = '';
        const currentCellIndex = cell.query.list.indexOf(cell.id);
        if (currentCellIndex > 0) {
            previousCellId = cell.query.list[currentCellIndex - 1];
        }
        // const config: NewCellAction['payload']['config'] = {
        //     widget: DefaultCells[newTransformationWidget].widget,
        //     parameters: {
        //         ...DefaultCells[newTransformationWidget].parameters,
        //         targetCell: { ...cell.parameters.targetCell },
        //     },
        // };

        // state.dispatch({
        //     message: ActionMessages.NEW_CELL,
        //     payload: {
        //         queryId: cell.query.id,
        //         cellId: cell.id,
        //         previousCellId: previousCellId,
        //         config: config as Omit<CellStateConfig, 'id'>,
        //     },
        // });
        notebook.selectCell(cell.query.id, cell.id);
    };

    useEffect(() => {
        // if (cell.parameters.targetCell.id) {
        //     // if the cell that is the target changes frame type or is delete, clear the targetCell
        //     if (!cell.query.list.includes(cell.parameters.targetCell.id)) {
        //         state.dispatch({
        //             message: ActionMessages.UPDATE_CELL,
        //             payload: {
        //                 queryId: cell.query.id,
        //                 cellId: cell.id,
        //                 path: 'parameters.targetCell',
        //                 value: {
        //                     id: '',
        //                     frameVariableName: '',
        //                 },
        //             },
        //         });
        //     }
        //     if (
        //         !cell.query.cells[cell.parameters.targetCell.id] ||
        //         !isValidFrameTypeForTransformation(
        //             cell.query.cells[cell.parameters.targetCell.id].parameters
        //                 .frameType as string,
        //         )
        //     ) {
        //         state.dispatch({
        //             message: ActionMessages.UPDATE_CELL,
        //             payload: {
        //                 queryId: cell.query.id,
        //                 cellId: cell.id,
        //                 path: 'parameters.targetCell',
        //                 value: {
        //                     id: '',
        //                     frameVariableName: '',
        //                 },
        //             },
        //         });
        //     }
        // } else if (availableFrameCells.length) {
        //     state.dispatch({
        //         message: ActionMessages.UPDATE_CELL,
        //         payload: {
        //             queryId: cell.query.id,
        //             cellId: cell.id,
        //             path: 'parameters.targetCell',
        //             value: {
        //                 id: availableFrameCells[0].id,
        //                 frameVariableName:
        //                     availableFrameCells[0].parameters.frameVariableName,
        //             },
        //         },
        //     });
        // }
    }, [cell.parameters.targetCell, availableFrameCells]);

    const [menuType, setMenuType] = useState<'routine' | 'frame'>(null);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <StyledButton
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                error={availableFrameCells.length == 0}
                variant="outlined"
                disableElevation
                disabled={
                    cell.isLoading ||
                    cell.query.isLoading ||
                    availableFrameCells.length == 0
                }
                size="small"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault();
                    setMenuType('frame');
                    setAnchorEl(event.currentTarget);
                }}
                startIcon={<FilterFrames />}
                endIcon={<KeyboardArrowDown />}
                title="Select Frame Variable"
            >
                {/* <StyledButtonLabel width={14}>
                    {cell.parameters.targetCell.frameVariableName}
                </StyledButtonLabel> */}
            </StyledButton>
            <StyledButton
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                variant="outlined"
                disableElevation
                disabled={
                    cell.isLoading ||
                    cell.query.isLoading ||
                    availableFrameCells.length == 0
                }
                size="small"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault();
                    setMenuType('routine');
                    setAnchorEl(event.currentTarget);
                }}
                startIcon={<Transform />}
                endIcon={<KeyboardArrowDown />}
                title="Select Clean Routine"
            >
                <StyledButtonLabel width={14}>
                    {/* {Transformations[cell.parameters.transformation.key]
                        ?.display ?? ''} */}
                </StyledButtonLabel>
            </StyledButton>
            <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
                {menuType === 'routine' && (
                    <List dense>
                        {Array.from(
                            Object.values(Transformations),
                            (transformation) => (
                                <List.Item
                                    disablePadding
                                    key={`${cell.id}-${transformation.widget}`}
                                >
                                    <List.ItemButton
                                        onClick={() => {
                                            changeTransformationType(
                                                transformation.widget,
                                            );
                                            handleClose();
                                        }}
                                    >
                                        <List.ItemText
                                            primary={transformation.display}
                                        />
                                    </List.ItemButton>
                                </List.Item>
                            ),
                        )}
                    </List>
                )}
                {menuType === 'frame' && (
                    <List dense>
                        {Array.from(availableFrameCells, (frameCell) => (
                            <List.Item
                                disablePadding
                                key={`${cell.id}-${frameCell.id}`}
                            >
                                <List.ItemButton
                                    onClick={() => {
                                        // update the target cell info
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.targetCell',
                                                value: {
                                                    id: frameCell.id,
                                                    frameVariableName:
                                                        frameCell.parameters
                                                            .frameVariableName,
                                                },
                                            },
                                        });
                                        // reset the transformation info
                                        // state.dispatch({
                                        //     message: ActionMessages.UPDATE_CELL,
                                        //     payload: {
                                        //         queryId: cell.query.id,
                                        //         cellId: cell.id,
                                        //         path: 'parameters.transformation',
                                        //         value: {
                                        //             transformation:
                                        //                 cell.parameters
                                        //                     .transformation.key,
                                        //             parameters: {
                                        //                 ...Transformations[
                                        //                     cell.parameters
                                        //                         .transformation
                                        //                         .key
                                        //                 ].config.parameters,
                                        //             },
                                        //         },
                                        //     },
                                        // });
                                        handleClose();
                                    }}
                                >
                                    <List.ItemText
                                        primary={
                                            frameCell.parameters
                                                .frameVariableName
                                        }
                                    />
                                </List.ItemButton>
                            </List.Item>
                        ))}
                    </List>
                )}
            </StyledMenu>
        </>
    );
};
