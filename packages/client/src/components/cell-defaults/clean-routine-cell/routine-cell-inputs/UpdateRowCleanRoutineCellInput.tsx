import { useBlocks } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
import { CleanRoutineCellDef } from '../config';
import {
    ColumnCleanRoutineField,
    OperationCleanRoutineField,
    ValueCleanRoutineField,
} from '../input-fields';
import { QueryImportCellDef } from '../../query-import-cell';
import {
    CleanRoutine,
    ColumnInfo,
    UpdateRowValuesCleanRoutineDef,
} from '../clean.types';

export const UpdateRowCleanRoutineCellInput: CellComponent<CleanRoutineCellDef> =
    observer((props) => {
        const { cell } = props;
        const { state } = useBlocks();

        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        const cellCleanRoutine: CleanRoutine<UpdateRowValuesCleanRoutineDef> =
            computed(() => {
                return cell.parameters
                    .cleanRoutine as CleanRoutine<UpdateRowValuesCleanRoutineDef>;
            }).get();

        const doesFrameExist: boolean = computed(() => {
            return (
                !!targetCell && (targetCell.isExecuted || !!targetCell.output)
            );
        }).get();

        const helpText = cell.parameters.targetCell.id
            ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
            : 'A target frame variable must be defined in order to apply a transformation.';

        if (
            !doesFrameExist &&
            !cellCleanRoutine.parameters.compareColumn.name
        ) {
            return (
                <Stack width="100%" paddingY={0.75}>
                    <Typography variant="caption">
                        <em>{helpText}</em>
                    </Typography>
                </Stack>
            );
        }

        return (
            <Stack spacing={2}>
                <Typography variant="caption">
                    {!doesFrameExist ? (
                        <em>{helpText}</em>
                    ) : (
                        'Replace values of a column by defining a conditional statement'
                    )}
                </Typography>
                <Stack direction="row" flex={1} spacing={2}>
                    <ColumnCleanRoutineField
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={
                            cellCleanRoutine.parameters.compareColumn ?? {
                                name: '',
                                dataType: '',
                            }
                        }
                        insightId={state.insightId}
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.cleanRoutine.parameters.compareColumn',
                                    value: newColumn,
                                },
                            });
                        }}
                        label="Compare Column"
                    />
                    <OperationCleanRoutineField
                        disabled={!doesFrameExist}
                        selectedOperation={
                            cellCleanRoutine.parameters.compareOperation
                        }
                        onChange={(newOperation: string) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.cleanRoutine.parameters.compareOperation',
                                    value: newOperation,
                                },
                            });
                        }}
                    />
                    <ValueCleanRoutineField
                        disabled={!doesFrameExist}
                        value={cellCleanRoutine.parameters.compareValue}
                        valueDatabaseType={
                            cellCleanRoutine.parameters.compareColumn.dataType
                        }
                        label="Compare Value"
                        onChange={(newValue) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.cleanRoutine.parameters.compareValue',
                                    value: newValue,
                                },
                            });
                        }}
                    />
                </Stack>
                <Stack direction="row" flex={1} spacing={2}>
                    <ColumnCleanRoutineField
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={
                            cellCleanRoutine.parameters.targetColumn ?? {
                                name: '',
                                dataType: '',
                            }
                        }
                        insightId={state.insightId}
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.cleanRoutine.parameters.targetColumn',
                                    value: newColumn,
                                },
                            });
                        }}
                        label="Update Column"
                    />
                    <ValueCleanRoutineField
                        disabled={!doesFrameExist}
                        value={cellCleanRoutine.parameters.targetValue}
                        valueDatabaseType={
                            cellCleanRoutine.parameters.targetColumn.dataType
                        }
                        label="Update Value"
                        onChange={(newValue) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.cleanRoutine.parameters.targetValue',
                                    value: newValue,
                                },
                            });
                        }}
                    />
                </Stack>
            </Stack>
        );
    });
