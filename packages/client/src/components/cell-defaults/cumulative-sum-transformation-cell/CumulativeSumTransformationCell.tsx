import { useMemo } from 'react';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, TextField, Typography } from '@semoss/ui';

import {
    Transformation,
    ColumnInfo,
    ColumnTransformationField,
    TransformationCellInput,
    Transformations,
    TransformationDef,
    TransformationCellDef,
    TransformationTargetCell,
} from '../shared';
import { QueryImportCellDef } from '../query-import-cell';
import { observer } from 'mobx-react-lite';

export interface CumulativeSumTransformationDef
    extends TransformationDef<'cumulative-sum'> {
    key: 'cumulative-sum';
    parameters: {
        //** New column title*/
        newColumn: string;

        //** Value to aggregate */
        valueColumn: ColumnInfo;

        //** Optional column(s) to sort by */
        sortColumns?: ColumnInfo[];

        //** Optional column(s) to group by */
        groupByColumns?: ColumnInfo[];
    };
}

export interface CumulativeSumTransformationCellDef
    extends TransformationCellDef<'cumulative-sum-transformation'> {
    widget: 'cumulative-sum-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<CumulativeSumTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

export const CumulativeSumTransformationCell: CellComponent<CumulativeSumTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        const cellTransformation: Transformation<CumulativeSumTransformationDef> =
            computed(() => {
                return cell.parameters
                    .transformation as Transformation<CumulativeSumTransformationDef>;
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
            (!doesFrameExist && !cellTransformation.parameters.newColumn) ||
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
                            "Add a new column for the cumulative sum of another column's values"
                        )}
                    </Typography>
                    <TextField
                        label="Column Name"
                        disabled={!doesFrameExist}
                        variant="outlined"
                        value={cellTransformation.parameters.newColumn}
                        fullWidth
                        size="small"
                        onChange={(e) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.newColumn',
                                    value: e.target.value,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField
                        label="Aggregate Value"
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={
                            cellTransformation.parameters.valueColumn
                        }
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.valueColumn',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField
                        label="Sort by Column(s)"
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={
                            cellTransformation.parameters.sortColumns
                        }
                        multiple
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.sortColumns',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField
                        label="Group by Column(s)"
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={
                            cellTransformation.parameters.groupByColumns
                        }
                        multiple
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.groupByColumns',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                </Stack>
            </TransformationCellInput>
        );
    });
