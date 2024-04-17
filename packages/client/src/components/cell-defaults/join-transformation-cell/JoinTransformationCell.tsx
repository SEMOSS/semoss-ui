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

export interface JoinTransformationCellDef {
    widget: 'join-transformation';
    parameters: {
        frame: string;
        toFrame: string;

        fromNameColumn: ColumnInfo;
        toNameColumn: ColumnInfo;
        joinType: joinType;
        compareOperation: comparator;
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

        const cellTransformation = computed(() => {
            return cell.widget;
        }).get();

        return (
            <TransformationMultiCellInput
                isExpanded={isExpanded}
                display={Transformations[cellTransformation].display}
                Icon={Transformations[cellTransformation].icon}
                cell={cell}
            >
                <Stack spacing={2}>
                    <Stack direction="column" spacing={2} width="100%">
                        <StyledTitleTypography variant={'body2'}>
                            {' '}
                            From:
                            {` ${cell.parameters.frame}`}
                        </StyledTitleTypography>
                        <MultiCellColumnTransformationField
                            cell={cell}
                            cellTarget={cell.parameters.frame}
                            selectedColumns={
                                cell.parameters.fromNameColumn ?? {
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
                                        path: 'parameters.fromNameColumn',
                                        value: newColumn,
                                    },
                                });
                            }}
                            label="Name of Columns"
                        />
                        <StyledTitleTypography variant={'body2'}>
                            {' '}
                            To:
                            {` ${cell.parameters.toFrame}`}
                        </StyledTitleTypography>
                        <MultiCellColumnTransformationField
                            cell={cell}
                            cellTarget={cell.parameters.toFrame}
                            selectedColumns={
                                cell.parameters.toNameColumn ?? {
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
                                        path: 'parameters.toNameColumn',
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
                            size="small"
                            value={cell.parameters.joinType}
                            fullWidth
                            onChange={(_, newOperation: joinType) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.joinType',
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
                            size="small"
                            value={cell.parameters.compareOperation}
                            fullWidth
                            onChange={(_, newOperation: string) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.compareOperation',
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
