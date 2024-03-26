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
    Transformation,
    ColumnInfo,
    ColumnTransformationField,
    TransformationCellInput,
    dateUnitTypes,
    Transformations,
    TransformationDef,
    TransformationCellDef,
    TransformationTargetCell,
    dateUnit,
    dateType,
} from '../shared';
import { QueryImportCellDef } from '../query-import-cell';
import { CalendarMonth, TableChartOutlined } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';

export interface DateDifferenceTransformationDef
    extends TransformationDef<'date-difference'> {
    key: 'date-difference';
    parameters: {
        startType: dateType;
        startCustomDate: string;
        startColumn: ColumnInfo;
        endType: 'column' | 'custom';
        endCustomDate: string;
        endColumn: ColumnInfo;
        unit: dateUnit;
        columnName: string;
    };
}

export interface DateDifferenceTransformationCellDef
    extends TransformationCellDef<'date-difference-transformation'> {
    widget: 'date-difference-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<DateDifferenceTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

export const DateDifferenceTransformationCell: CellComponent<DateDifferenceTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        const cellTransformation: Transformation<DateDifferenceTransformationDef> =
            computed(() => {
                return cell.parameters
                    .transformation as Transformation<DateDifferenceTransformationDef>;
            }).get();

        const doesFrameExist: boolean = computed(() => {
            return (
                !!targetCell && (targetCell.isExecuted || !!targetCell.output)
            );
        }).get();

        /**
         * A list of cells that are query imports,
         * Added here in case we want to show particular frames whether Grid, Py, R, etc
         * TO-DO: Do we want to reference other queries
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

        const helpText = cell.parameters.targetCell.id
            ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
            : 'A Python or R target frame variable must be defined in order to apply a transformation.';

        if (
            (!doesFrameExist && !cellTransformation.parameters.columnName) ||
            !targetCell.isExecuted
        ) {
            return (
                <TransformationCellInput
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
                </TransformationCellInput>
            );
        }

        return (
            <TransformationCellInput
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
                        {!doesFrameExist ? (
                            <em>{helpText}</em>
                        ) : (
                            'Compute the difference between dates and add the computed value as a new column'
                        )}
                    </Typography>
                    <Stack direction="row" spacing={2} width="100%">
                        <Stack direction="row" spacing={1} minWidth="40%">
                            <ToggleButtonGroup
                                size="small"
                                value={cellTransformation.parameters.startType}
                                disabled={
                                    cellTransformation.parameters.endType ===
                                    'custom'
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
                                                path: 'parameters.transformation.parameters.startType',
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
                                                path: 'parameters.transformation.parameters.startType',
                                                value: 'custom',
                                            },
                                        });
                                    }}
                                >
                                    <CalendarMonth />
                                </ToggleButton>
                            </ToggleButtonGroup>
                            {cellTransformation.parameters.startType ===
                            'column' ? (
                                <ColumnTransformationField
                                    disabled={!doesFrameExist}
                                    label="Start Date Column"
                                    cell={cell}
                                    selectedColumns={
                                        cellTransformation.parameters
                                            .startColumn
                                    }
                                    columnTypes={['DATE']}
                                    onChange={(newColumn: ColumnInfo) => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.transformation.parameters.startColumn',
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
                                    value={
                                        cellTransformation.parameters
                                            .startCustomDate
                                    }
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
                                                path: 'parameters.transformation.parameters.startCustomDate',
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
                                value={cellTransformation.parameters.endType}
                                disabled={
                                    cellTransformation.parameters.startType ===
                                    'custom'
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
                                                path: 'parameters.transformation.parameters.endType',
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
                                                path: 'parameters.transformation.parameters.endType',
                                                value: 'custom',
                                            },
                                        });
                                    }}
                                >
                                    <CalendarMonth />
                                </ToggleButton>
                            </ToggleButtonGroup>
                            {cellTransformation.parameters.endType ===
                            'column' ? (
                                <ColumnTransformationField
                                    disabled={!doesFrameExist}
                                    label="End Date Column"
                                    cell={cell}
                                    selectedColumns={
                                        cellTransformation.parameters.endColumn
                                    }
                                    columnTypes={['DATE']}
                                    onChange={(newColumn: ColumnInfo) => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.transformation.parameters.endColumn',
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
                                    value={
                                        cellTransformation.parameters
                                            .endCustomDate
                                    }
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
                                                path: 'parameters.transformation.parameters.endCustomDate',
                                                value: e.target.value,
                                            },
                                        });
                                    }}
                                />
                            )}
                        </Stack>
                        <Autocomplete
                            disableClearable
                            disabled={!doesFrameExist}
                            size="small"
                            fullWidth
                            value={cellTransformation.parameters.unit}
                            onChange={(_, newOperation: string) => {
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.transformation.parameters.unit',
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
                        value={cellTransformation.parameters.columnName}
                        fullWidth
                        onChange={(e) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.columnName',
                                    value: e.target.value,
                                },
                            });
                        }}
                    />
                </Stack>
            </TransformationCellInput>
        );
    });
