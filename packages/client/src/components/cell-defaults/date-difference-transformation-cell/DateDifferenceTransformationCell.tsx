import { useMemo } from 'react';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import {
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import {
    ColumnInfoTwo,
    ColumnTransformationField2,
    TransformationCellInput2,
    dateUnitTypes,
    Transformations,
    dateUnit,
    dateType,
} from '../shared';
import { QueryImportCellDef } from '../query-import-cell';
import { CalendarMonth, TableChartOutlined } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';

export interface DateDifferenceTransformationCellDef {
    widget: 'date-difference-transformation';
    parameters: {
        frame: string;
        startType: dateType;
        startCustomDate: string;
        startColumn: ColumnInfoTwo;
        endType: 'column' | 'custom';
        endCustomDate: string;
        endColumn: ColumnInfoTwo;
        unit: dateUnit;
        columnName: string;
    };
}

export const DateDifferenceTransformationCell: CellComponent<DateDifferenceTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        /**
         * Type of Transformation
         */
        const cellTransformation = computed(() => {
            return cell.widget;
        }).get();

        return (
            <TransformationCellInput2
                isExpanded={isExpanded}
                display={Transformations[cellTransformation].display}
                Icon={Transformations[cellTransformation].icon}
                cell={cell}
            >
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2} width="100%">
                        <Stack direction="row" spacing={1} minWidth="40%">
                            <ToggleButtonGroup
                                size="small"
                                value={cell.parameters.startType}
                                disabled={cell.parameters.endType === 'custom'}
                            >
                                <ToggleButton
                                    value="column"
                                    onClick={() => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.startType',
                                                value: 'column',
                                            },
                                        });
                                    }}
                                >
                                    <TableChartOutlined />
                                </ToggleButton>
                                <ToggleButton
                                    value="custom"
                                    onClick={() => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.startType',
                                                value: 'custom',
                                            },
                                        });
                                    }}
                                >
                                    <CalendarMonth />
                                </ToggleButton>
                            </ToggleButtonGroup>
                            {cell.parameters.startType === 'column' ? (
                                <ColumnTransformationField2
                                    label="Start Date Column"
                                    cell={cell}
                                    selectedColumns={
                                        cell.parameters.startColumn
                                    }
                                    columnTypes={['DATE']}
                                    onChange={(newColumn: ColumnInfoTwo) => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.startColumn',
                                                value: newColumn,
                                            },
                                        });
                                    }}
                                />
                            ) : (
                                <TextField
                                    type="date"
                                    size="small"
                                    label="Custom Start Date"
                                    value={cell.parameters.startCustomDate}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    fullWidth
                                    onChange={(e) => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.startCustomDate',
                                                value: e.target.value,
                                            },
                                        });
                                    }}
                                />
                            )}
                        </Stack>
                        <Stack direction="row" spacing={1} minWidth="40%">
                            <ToggleButtonGroup
                                size="small"
                                value={cell.parameters.endType}
                                disabled={
                                    cell.parameters.startType === 'custom'
                                }
                            >
                                <ToggleButton
                                    value="column"
                                    onClick={() => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.endType',
                                                value: 'column',
                                            },
                                        });
                                    }}
                                >
                                    <TableChartOutlined />
                                </ToggleButton>
                                <ToggleButton
                                    value="custom"
                                    onClick={() => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.endType',
                                                value: 'custom',
                                            },
                                        });
                                    }}
                                >
                                    <CalendarMonth />
                                </ToggleButton>
                            </ToggleButtonGroup>
                            {cell.parameters.endType === 'column' ? (
                                <ColumnTransformationField2
                                    label="End Date Column"
                                    cell={cell}
                                    selectedColumns={cell.parameters.endColumn}
                                    columnTypes={['DATE']}
                                    onChange={(newColumn: ColumnInfoTwo) => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.endColumn',
                                                value: newColumn,
                                            },
                                        });
                                    }}
                                />
                            ) : (
                                <TextField
                                    type="date"
                                    size="small"
                                    label="Custom End Date"
                                    value={cell.parameters.endCustomDate}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    fullWidth
                                    onChange={(e) => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.endCustomDate',
                                                value: e.target.value,
                                            },
                                        });
                                    }}
                                />
                            )}
                        </Stack>
                        <Autocomplete
                            disableClearable
                            size="small"
                            fullWidth
                            value={cell.parameters.unit}
                            onChange={(_, newOperation: string) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.unit',
                                        value: newOperation,
                                    },
                                });
                            }}
                            options={dateUnitTypes}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="Unit of Measure"
                                />
                            )}
                        />
                    </Stack>
                    <TextField
                        size="small"
                        label="Column Name"
                        value={cell.parameters.columnName}
                        fullWidth
                        onChange={(e) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.columnName',
                                    value: e.target.value,
                                },
                            });
                        }}
                    />
                </Stack>
            </TransformationCellInput2>
        );
    });
