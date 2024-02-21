import { useBlocks } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
import { TransformationCellDef } from '../config';
import {
    ColumnTransformationField,
    OperationTransformationField,
    ValueTransformationField,
} from '../input-fields';
import { QueryImportCellDef } from '../../query-import-cell';
import {
    Transformation,
    ColumnInfo,
    UpdateRowValuesTransformationDef,
} from '../transformation.types';

export const UpdateRowTransformationCellInput: CellComponent<TransformationCellDef> =
    observer((props) => {
        const { cell } = props;
        const { state } = useBlocks();

        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        const cellTransformation: Transformation<UpdateRowValuesTransformationDef> =
            computed(() => {
                return cell.parameters
                    .transformation as Transformation<UpdateRowValuesTransformationDef>;
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
            !cellTransformation.parameters.compareColumn.name
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
                    <ColumnTransformationField
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={
                            cellTransformation.parameters.compareColumn ?? {
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
                                    path: 'parameters.transformation.parameters.compareColumn',
                                    value: newColumn,
                                },
                            });
                        }}
                        label="Compare Column"
                    />
                    <OperationTransformationField
                        disabled={!doesFrameExist}
                        selectedOperation={
                            cellTransformation.parameters.compareOperation
                        }
                        onChange={(newOperation: string) => {
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
                    />
                    <ValueTransformationField
                        disabled={!doesFrameExist}
                        value={cellTransformation.parameters.compareValue}
                        valueDatabaseType={
                            cellTransformation.parameters.compareColumn.dataType
                        }
                        label="Compare Value"
                        onChange={(newValue) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.compareValue',
                                    value: newValue,
                                },
                            });
                        }}
                    />
                </Stack>
                <Stack direction="row" flex={1} spacing={2}>
                    <ColumnTransformationField
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={
                            cellTransformation.parameters.targetColumn ?? {
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
                                    path: 'parameters.transformation.parameters.targetColumn',
                                    value: newColumn,
                                },
                            });
                        }}
                        label="Update Column"
                    />
                    <ValueTransformationField
                        disabled={!doesFrameExist}
                        value={cellTransformation.parameters.targetValue}
                        valueDatabaseType={
                            cellTransformation.parameters.targetColumn.dataType
                        }
                        label="Update Value"
                        onChange={(newValue) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.targetValue',
                                    value: newValue,
                                },
                            });
                        }}
                    />
                </Stack>
            </Stack>
        );
    });
