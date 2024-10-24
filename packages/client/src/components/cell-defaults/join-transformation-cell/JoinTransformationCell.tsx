import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { TextField, Stack, Typography, styled } from '@semoss/ui';
import { Autocomplete, Box } from '@mui/material';
import {
    Transformation,
    TransformationMultiCellInput,
    Transformations,
    ColumnInfo,
    joinTypes,
    comparators,
    joinType,
    MultiCellColumnTransformationField,
    TransformationDef,
    TransformationTargetCell,
    comparator,
    TransformationMultiCellDef,
} from '../shared';
import { QueryImportCellDef } from '../query-import-cell';
import { JoinFull, JoinInner, JoinLeft, JoinRight } from '@mui/icons-material';
import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';

export interface JoinTransformationDef extends TransformationDef<'join'> {
    key: 'join';
    parameters: {
        fromNameColumn: ColumnInfo;
        toNameColumn: ColumnInfo;
        joinType: joinType;
        compareOperation: comparator;
    };
}

export interface JoinTransformationCellDef
    extends TransformationMultiCellDef<'join-transformation'> {
    widget: 'join-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<JoinTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        fromTargetCell: TransformationTargetCell;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        toTargetCell: TransformationTargetCell;
    };
}

const iconMapping: { [key: string]: React.ReactNode } = {
    'Full Join': <JoinFull />,
    'Inner Join': <JoinInner />,
    'Left Join': <JoinLeft />,
    'Right Join': <JoinRight />,
};

const StyledTypography = styled(Typography)(() => ({
    marginLeft: '8px',
}));

const StyledTitleTypography = styled(Typography)(() => ({
    fontWeight: 500,
}));

export const JoinTransformationCell: CellComponent<JoinTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const cellTransformation: Transformation<JoinTransformationDef> =
            computed(() => {
                return cell.parameters
                    .transformation as Transformation<JoinTransformationDef>;
            }).get();

        /**
         * A list of cells that are query imports,
         * Added here in case we want to show particular frames whether Grid, Py, R, etc
         * TODO: Do we want to reference other notebooks
         */
        const frames = useMemo(() => {
            const frameList = [];
            Object.values(cell.query.cells).forEach((cell) => {
                if (cell.widget === 'query-import') {
                    frameList.push(cell);
                }
            });

            return frameList;
        }, []);

        const targetCells: CellState<QueryImportCellDef>[] = computed(() => {
            return frames.filter(
                (item) => item.widget === 'query-import',
            ) as CellState<QueryImportCellDef>[];
        }).get();

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
            frames.length < 2
                ? `Run at least two Query import Cells to define the target frame variables before applying a transformation.`
                : 'At least two Python / R target frame variables must be defined in order to apply the join transformation.';

        if (!doFramesExist && cellTransformation.parameters.fromNameColumn) {
            return (
                <TransformationMultiCellInput
                    isExpanded={isExpanded}
                    display={Transformations[cellTransformation.key].display}
                    Icon={Transformations[cellTransformation.key].icon}
                    frame={{
                        cell: cell,
                        options: frames,
                    }}
                >
                    <Stack width="100%" paddingY={0.75}>
                        <Typography variant="caption">
                            <em>{helpText}</em>
                        </Typography>
                    </Stack>
                </TransformationMultiCellInput>
            );
        }

        return (
            <TransformationMultiCellInput
                isExpanded={isExpanded}
                display={Transformations[cellTransformation.key].display}
                Icon={Transformations[cellTransformation.key].icon}
                frame={{
                    cell: cell,
                    options: frames,
                }}
            >
                <Stack spacing={2}>
                    <Typography variant="caption">
                        {!doFramesExist ? (
                            <em>{helpText}</em>
                        ) : (
                            'Select columns from each table. Specify how you want to join the columns.'
                        )}
                    </Typography>

                    <Stack direction="column" spacing={2} width="100%">
                        <StyledTitleTypography variant={'body2'}>
                            {' '}
                            From:
                            {` ${cell.parameters.fromTargetCell.frameVariableName}`}
                        </StyledTitleTypography>
                        <MultiCellColumnTransformationField
                            disabled={!doFramesExist}
                            cell={cell}
                            cellTarget={cell.parameters.fromTargetCell}
                            selectedColumns={
                                cellTransformation.parameters
                                    .fromNameColumn ?? {
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
                            To:
                            {` ${cell.parameters.toTargetCell.frameVariableName}`}
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
                            value={
                                cellTransformation.parameters.compareOperation
                            }
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
            </TransformationMultiCellInput>
        );
    });
