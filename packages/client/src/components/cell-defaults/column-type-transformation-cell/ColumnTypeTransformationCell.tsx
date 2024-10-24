import { useMemo } from 'react';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, TextField, Typography } from '@semoss/ui';
import { Autocomplete } from '@mui/material';
import {
    Transformation,
    TransformationDef,
    TransformationCellDef,
    ColumnInfo,
    ColumnTransformationField,
    TransformationCellInput,
    transformationColumnTypes,
    Transformations,
    TransformationTargetCell,
    columnTypes,
} from '../shared';
import { QueryImportCellDef } from '../query-import-cell';
import { observer } from 'mobx-react-lite';

export interface ColumnTypeTransformationDef
    extends TransformationDef<'column-type'> {
    key: 'column-type';
    parameters: {
        column: ColumnInfo;
        columnType: columnTypes;
    };
}

export interface ColumnTypeTransformationCellDef
    extends TransformationCellDef<'column-type-transformation'> {
    widget: 'column-type-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<ColumnTypeTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

export const ColumnTypeTransformationCell: CellComponent<ColumnTypeTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        const cellTransformation: Transformation<ColumnTypeTransformationDef> =
            computed(() => {
                return cell.parameters
                    .transformation as Transformation<ColumnTypeTransformationDef>;
            }).get();

        const doesFrameExist: boolean = computed(() => {
            return (
                !!targetCell && (targetCell.isExecuted || !!targetCell.output)
            );
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

        const helpText = cell.parameters.targetCell.id
            ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
            : 'A Python or R target frame variable must be defined in order to apply a transformation.';

        if (
            (!doesFrameExist && !cellTransformation.parameters.column) ||
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
                            'Change the type of the selected column'
                        )}
                    </Typography>
                    <ColumnTransformationField
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={cellTransformation.parameters.column}
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.column',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <Autocomplete
                        disableClearable
                        disabled={!doesFrameExist}
                        size="small"
                        value={cellTransformation.parameters.columnType}
                        fullWidth
                        onChange={(_, newOperation: string) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.columnType',
                                    value: newOperation,
                                },
                            });
                        }}
                        options={transformationColumnTypes}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Operation"
                            />
                        )}
                    />
                </Stack>
            </TransformationCellInput>
        );
    });
