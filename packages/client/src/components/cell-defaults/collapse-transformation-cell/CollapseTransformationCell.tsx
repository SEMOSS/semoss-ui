import { useMemo } from 'react';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, TextField, Typography } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

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

export interface CollapseTransformationDef
    extends TransformationDef<'collapse'> {
    key: 'collapse';
    parameters: {
        //** Column(s) to group */
        columns: ColumnInfo[];

        //** Value column */
        value: ColumnInfo;

        //** String separator */
        delimiter: string;

        //** Colum(s) to maintain in new table */
        maintainColumns?: ColumnInfo[];
    };
}

export interface CollapseTransformationCellDef
    extends TransformationCellDef<'collapse-transformation'> {
    widget: 'collapse-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<CollapseTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

export const CollapseTransformationCell: CellComponent<CollapseTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        const cellTransformation: Transformation<CollapseTransformationDef> =
            computed(() => {
                return cell.parameters
                    .transformation as Transformation<CollapseTransformationDef>;
            }).get();

        const doesFrameExist: boolean = computed(() => {
            return (
                !!targetCell && (targetCell.isExecuted || !!targetCell.output)
            );
        }).get();

        /**
         * A list of cells that are query imports,
         * Added here in case we want to show particular frames whether Grid, Py, R, etc
         * TODO: Do we want to reference other queries
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
            (!doesFrameExist &&
                !cellTransformation.parameters.columns.length) ||
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
                            'Aggregate data for a group based on the delimiter'
                        )}
                    </Typography>
                    <ColumnTransformationField
                        label="Group by Column(s)"
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={cellTransformation.parameters.columns}
                        multiple
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.columns',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField
                        label="Value Column"
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={cellTransformation.parameters.value}
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.value',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <TextField
                        label="String Separator"
                        disabled={!doesFrameExist}
                        variant="outlined"
                        value={cellTransformation.parameters.delimiter}
                        fullWidth
                        size="small"
                        onChange={(e) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.delimiter',
                                    value: e.target.value,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField
                        label="Other Column(s) to Maintain"
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={
                            cellTransformation.parameters.maintainColumns
                        }
                        multiple
                        onChange={(newColumn: ColumnInfo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.maintainColumns',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                </Stack>
            </TransformationCellInput>
        );
    });
