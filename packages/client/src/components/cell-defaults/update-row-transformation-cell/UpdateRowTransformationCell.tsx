import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, TextField, Typography } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import {
    ColumnInfo,
    ColumnTransformationField,
    Transformation,
    TransformationCellInput,
    Transformations,
    operations,
    TransformationDef,
    TransformationCellDef,
    TransformationTargetCell,
    operation,
} from '../shared';
import { QueryImportCellDef } from '../query-import-cell';

export interface UpdateRowTransformationDef
    extends TransformationDef<'update-row'> {
    key: 'update-row';
    parameters: {
        compareColumn: ColumnInfo;
        compareOperation: operation;
        compareValue: string;
        targetColumn: ColumnInfo;
        targetValue: string;
    };
}

export interface UpdateRowTransformationCellDef
    extends TransformationCellDef<'update-row-transformation'> {
    widget: 'update-row-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<UpdateRowTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

export const UpdateRowTransformationCell: CellComponent<
    UpdateRowTransformationCellDef
> = (props) => {
    const { cell, isExpanded } = props;
    const { state } = useBlocks();

    const targetCell: CellState<QueryImportCellDef> = computed(() => {
        return cell.query.cells[
            cell.parameters.targetCell.id
        ] as CellState<QueryImportCellDef>;
    }).get();

    const cellTransformation: Transformation<UpdateRowTransformationDef> =
        computed(() => {
            return cell.parameters
                .transformation as Transformation<UpdateRowTransformationDef>;
        }).get();

    const doesFrameExist: boolean = computed(() => {
        return !!targetCell && (targetCell.isExecuted || !!targetCell.output);
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

    const helpText = cell.parameters.targetCell.id
        ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
        : 'A Python or R target frame variable must be defined in order to apply a transformation.';

    if (!doesFrameExist && !cellTransformation.parameters.compareColumn.name) {
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
                    <Autocomplete
                        disableClearable
                        disabled={!doesFrameExist}
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
                                    path: 'parameters.transformation.parameters.compareValue',
                                    value: e.target.value,
                                },
                            });
                        }}
                        disabled={!doesFrameExist}
                        variant="outlined"
                        label="Compare Value"
                        value={cellTransformation.parameters.compareValue}
                        fullWidth
                        size="small"
                        InputLabelProps={{
                            shrink: ['text', 'number'].includes(
                                getTextFieldType(
                                    cellTransformation.parameters.compareColumn
                                        .dataType,
                                ),
                            )
                                ? !!cellTransformation.parameters.compareValue
                                : true,
                        }}
                        type={getTextFieldType(
                            cellTransformation.parameters.compareColumn
                                .dataType,
                        )}
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
                    <TextField
                        onChange={(e) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.targetValue',
                                    value: e.target.value,
                                },
                            });
                        }}
                        disabled={!doesFrameExist}
                        variant="outlined"
                        label="Update Value"
                        value={cellTransformation.parameters.targetValue}
                        fullWidth
                        size="small"
                        InputLabelProps={{
                            shrink: ['text', 'number'].includes(
                                getTextFieldType(
                                    cellTransformation.parameters.targetColumn
                                        .dataType,
                                ),
                            )
                                ? !!cellTransformation.parameters.targetValue
                                : true,
                        }}
                        type={getTextFieldType(
                            cellTransformation.parameters.targetColumn.dataType,
                        )}
                    />
                </Stack>
            </Stack>
        </TransformationCellInput>
    );
};

UpdateRowTransformationCell.config = {
    name: 'Update Row',
    widget: 'update-row-transformation',
    parameters: {
        transformation: {
            key: 'update-row',
            parameters: {
                compareColumn: {
                    name: '',
                    dataType: '',
                },
                compareOperation: '==',
                compareValue: '',
                targetColumn: {
                    name: '',
                    dataType: '',
                },
                targetValue: '',
            },
        },
        targetCell: {
            id: '',
            frameVariableName: '',
        },
    },

    toPixel: ({ transformation, targetCell }) => {
        return `${targetCell.frameVariableName} | UpdateRowValues (${transformation.parameters.targetColumn}, ${transformation.parameters.targetValue}, Filter (${transformation.parameters.compareColumn} ${transformation.parameters.compareOperation} ${transformation.parameters.compareValue}))`;
    },
};
