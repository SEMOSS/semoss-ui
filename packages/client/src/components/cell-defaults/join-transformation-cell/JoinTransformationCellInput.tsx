import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { TextField, Stack, Typography, styled } from '@semoss/ui';
import JoinFullIcon from '@mui/icons-material/JoinFull';
import JoinInnerIcon from '@mui/icons-material/JoinInner';
import JoinLeftIcon from '@mui/icons-material/JoinLeft';
import JoinRightIcon from '@mui/icons-material/JoinRight';
import { Autocomplete, Box } from '@mui/material';
import {
    Transformation,
    TransformationCellInput,
    Transformations,
    ColumnTransformationField,
    ColumnInfo,
    joinTypes,
    comparators,
    joinType,
    MultiCellColumnTransformationField,
} from '../shared';
import { JoinTransformationCellDef, JoinTransformationDef } from './config';
import { QueryImportCellDef } from '../query-import-cell';
import React from 'react';

const iconMapping: { [key: string]: React.ReactNode } = {
    'Full Join': <JoinFullIcon />,
    'Inner Join': <JoinInnerIcon />,
    'Left Join': <JoinLeftIcon />,
    'Right Join': <JoinRightIcon />,
};

const StyledTypography = styled(Typography)(() => ({
    marginLeft: '8px',
}));

const StyledTitleTypography = styled(Typography)(() => ({
    fontWeight: 500,
}));

export const JoinTransformationCellInput: CellComponent<
    JoinTransformationCellDef
> = (props) => {
    const { cell, isExpanded } = props;
    const { state } = useBlocks();

    const cellTransformation: Transformation<JoinTransformationDef> = computed(
        () => {
            return cell.parameters
                .transformation as Transformation<JoinTransformationDef>;
        },
    ).get();

    // const targetCell: CellState<QueryImportCellDef> = computed(() => {
    //     return cell.query.cells[
    //         cell.parameters.targetCell.id
    //     ] as CellState<QueryImportCellDef>;
    // }).get();

    // const doesFrameExist: boolean = computed(() => {
    //     return !!targetCell && (targetCell.isExecuted || !!targetCell.output);
    // }).get();

    // const helpText = cell.parameters.targetCell.id
    //     ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
    //     : 'A Python or R target frame variable must be defined in order to apply a transformation.';
    // if (!doesFrameExist && cellTransformation.parameters.fromNameColumn) {
    //     return (
    //         <TransformationCellInput
    //             isExpanded={isExpanded}
    //             display={Transformations[cellTransformation.key].display}
    //             Icon={Transformations[cellTransformation.key].icon}
    //         >
    //             <Stack width="100%" paddingY={0.75}>
    //                 <Typography variant="caption">
    //                     <em>{helpText}</em>
    //                 </Typography>
    //             </Stack>
    //         </TransformationCellInput>
    //     );
    // }
    // Use this when we have more than one targetcell
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

    const targetCells: CellState<QueryImportCellDef>[] = computed(() => {
        return availableFrameCells.filter(
            (item) => item.widget === 'query-import',
        ) as CellState<QueryImportCellDef>[];
    }).get();

    // const doFramesExist: boolean = computed(() => {
    //     let count = 0;
    //     for (const item of targetCells) {
    //         if (!!item && (item.isExecuted || !!item.output)) {
    //             count++;
    //         }
    //     }
    //     return count >= 2;
    // }).get();

    const doFramesExist: boolean = computed(() => {
        let count = 0;
        for (const item of targetCells) {
            if (!!item && (item.isExecuted || !!item.output)) {
                count++;
            }
        }
        return count >= 2;
    }).get();

    const helpText =
        availableFrameCells.length < 2
            ? `Run at least two Query import Cells to define the target frame variables before applying a transformation.`
            : 'At least two Python / R target frame variables must be defined in order to apply the join transformation.';

    if (!doFramesExist && cellTransformation.parameters.fromNameColumn) {
        return (
            <TransformationCellInput
                isExpanded={isExpanded}
                display={Transformations[cellTransformation.key].display}
                Icon={Transformations[cellTransformation.key].icon}
            >
                <Stack width="100%" paddingY={0.75}>
                    <Typography variant="caption">
                        <em>{helpText}</em>
                    </Typography>
                </Stack>
            </TransformationCellInput>
        );
    }

    return (
        <TransformationCellInput
            isExpanded={isExpanded}
            display={Transformations[cellTransformation.key].display}
            Icon={Transformations[cellTransformation.key].icon}
        >
            <Stack spacing={2}>
                <Typography variant="caption">
                    {!doFramesExist ? (
                        <em>{helpText}</em>
                    ) : (
                        'Select columns from each database. Specify how you want to join the columns.'
                    )}
                </Typography>

                <Stack direction="column" spacing={2} width="100%">
                    <StyledTitleTypography variant={'body2'}>
                        {' '}
                        From:{' '}
                    </StyledTitleTypography>
                    <MultiCellColumnTransformationField
                        disabled={!doFramesExist}
                        cell={cell}
                        cellTarget={cell.parameters.fromTargetCell}
                        selectedColumns={
                            cellTransformation.parameters.fromNameColumn ?? {
                                name: '',
                                dataType: '',
                            }
                        }
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.fromNameColumn',
                                    value: newColumn,
                                },
                            });
                        }}
                        label="Name of Columns"
                    />
                    <StyledTitleTypography variant={'body2'}>
                        {' '}
                        To:{' '}
                    </StyledTitleTypography>
                    <MultiCellColumnTransformationField
                        disabled={!doFramesExist}
                        cell={cell}
                        cellTarget={cell.parameters.toTargetCell}
                        selectedColumns={
                            cellTransformation.parameters.toNameColumn ?? {
                                name: '',
                                dataType: '',
                            }
                        }
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.toNameColumn',
                                    value: newColumn,
                                },
                            });
                        }}
                        label="Name of Columns"
                    />
                    <StyledTitleTypography variant={'body2'}>
                        {' '}
                        Type of Join:{' '}
                    </StyledTitleTypography>
                    <Autocomplete
                        disabled={!doFramesExist}
                        size="small"
                        value={cellTransformation.parameters.joinType}
                        fullWidth
                        onChange={(_, newOperation: joinType) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.joinType',
                                    value: newOperation,
                                },
                            });
                        }}
                        options={joinTypes}
                        getOptionLabel={(option) => option.name}
                        renderOption={(props, option) => (
                            <Box component="li" {...props}>
                                {iconMapping[option.name]}
                                <StyledTypography variant={'body1'}>
                                    {option.name}
                                </StyledTypography>
                            </Box>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Join Type"
                            />
                        )}
                    />
                    <StyledTitleTypography variant={'body2'}>
                        {' '}
                        Comparator:{' '}
                    </StyledTitleTypography>
                    <Autocomplete
                        disabled={!doFramesExist}
                        size="small"
                        value={cellTransformation.parameters.compareOperation}
                        fullWidth
                        onChange={(_, newOperation: string) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.compareOperation',
                                    value: newOperation,
                                },
                            });
                        }}
                        options={comparators}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Operation"
                            />
                        )}
                    />
                </Stack>
            </Stack>
        </TransformationCellInput>
    );
};
