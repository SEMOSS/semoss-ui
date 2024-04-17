import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, TextField, Typography } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import {
    ColumnInfoTwo,
    ColumnTransformationField2,
    Transformation,
    TransformationCellInput2,
    Transformations,
    operations,
    operation,
} from '../shared';

export interface UpdateRowTransformationCellDef {
    widget: 'update-row-transformation';
    parameters: {
        frame: string;
        compareColumn: ColumnInfoTwo;
        compareOperation: operation;
        compareValue: string;
        targetColumn: ColumnInfoTwo;
        targetValue: string;
    };
}

export const UpdateRowTransformationCell: CellComponent<UpdateRowTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const cellTransformation = computed(() => {
            return cell.widget;
        }).get();

        const getTextFieldType = (dataType: string): string => {
            switch (dataType) {
                case 'INT':
                case 'DOUBLE':
                case 'DECIMAL':
                case 'NUMBER':
                    return 'number';
                case 'DATE':
                    return 'date';
                case 'TIME':
                    return 'time';
                default:
                    return 'text';
            }
        };

        return (
            <TransformationCellInput2
                isExpanded={isExpanded}
                display={Transformations[cellTransformation].display}
                Icon={Transformations[cellTransformation].icon}
                cell={cell}
            >
                <Stack spacing={2}>
                    <Stack direction="row" flex={1} spacing={2}>
                        <ColumnTransformationField2
                            cell={cell}
                            selectedColumns={
                                cell.parameters.compareColumn ?? {
                                    type: '',
                                    value: '',
                                }
                            }
                            onChange={(newColumn: ColumnInfoTwo) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.compareColumn',
                                        value: newColumn,
                                    },
                                });
                            }}
                            label="Compare Column"
                        />
                        <Autocomplete
                            disableClearable
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
                            options={operations}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="Operation"
                                />
                            )}
                        />
                        <TextField
                            onChange={(e) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.compareValue',
                                        value: e.target.value,
                                    },
                                });
                            }}
                            variant="outlined"
                            label="Compare Value"
                            value={cell.parameters.compareValue}
                            fullWidth
                            size="small"
                            InputLabelProps={{
                                shrink: ['text', 'number'].includes(
                                    getTextFieldType(
                                        cell.parameters.compareColumn.type,
                                    ),
                                )
                                    ? !!cell.parameters.compareValue
                                    : true,
                            }}
                            type={getTextFieldType(
                                cell.parameters.compareColumn.type,
                            )}
                        />
                    </Stack>
                    <Stack direction="row" flex={1} spacing={2}>
                        <ColumnTransformationField2
                            cell={cell}
                            selectedColumns={
                                cell.parameters.targetColumn ?? {
                                    type: '',
                                    value: '',
                                }
                            }
                            onChange={(newColumn: ColumnInfoTwo) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.targetColumn',
                                        value: newColumn,
                                    },
                                });
                            }}
                            label="Update Column"
                        />
                        <TextField
                            onChange={(e) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.targetValue',
                                        value: e.target.value,
                                    },
                                });
                            }}
                            variant="outlined"
                            label="Update Value"
                            value={cell.parameters.targetValue}
                            fullWidth
                            size="small"
                            InputLabelProps={{
                                shrink: ['text', 'number'].includes(
                                    getTextFieldType(
                                        cell.parameters.targetColumn.type,
                                    ),
                                )
                                    ? !!cell.parameters.targetValue
                                    : true,
                            }}
                            type={getTextFieldType(
                                cell.parameters.targetColumn.type,
                            )}
                        />
                    </Stack>
                </Stack>
            </TransformationCellInput2>
        );
    });
