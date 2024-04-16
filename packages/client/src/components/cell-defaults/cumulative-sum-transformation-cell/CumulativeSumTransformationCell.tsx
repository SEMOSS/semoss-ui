import { useMemo } from 'react';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, TextField, Typography } from '@semoss/ui';

import {
    Transformation,
    ColumnInfoTwo,
    ColumnTransformationField2,
    TransformationCellInput2,
    Transformations,
} from '../shared';
import { QueryImportCellDef } from '../query-import-cell';
import { observer } from 'mobx-react-lite';

export interface CumulativeSumTransformationCellDef {
    widget: 'cumulative-sum-transformation';
    parameters: {
        //** Frame name */
        frame: string;

        //** New column title*/
        newColumn: string;

        //** Value to aggregate */
        valueColumn: ColumnInfoTwo;

        //** Optional column(s) to sort by */
        sortColumns?: ColumnInfoTwo[];

        //** Optional column(s) to group by */
        groupByColumns?: ColumnInfoTwo[];
    };
}

export const CumulativeSumTransformationCell: CellComponent<CumulativeSumTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        // const targetCell: CellState<QueryImportCellDef> = computed(() => {
        //     return cell.query.cells[
        //         cell.parameters.targetCell.id
        //     ] as CellState<QueryImportCellDef>;
        // }).get();

        // const doesFrameExist: boolean = computed(() => {
        //     return (
        //         !!targetCell && (targetCell.isExecuted || !!targetCell.output)
        //     );
        // }).get();

        // const helpText = cell.parameters.targetCell.id
        //     ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
        //     : 'A Python or R target frame variable must be defined in order to apply a transformation.';

        /**
         * A list of cells that are query imports,
         * Added here in case we want to show particular frames whether Grid, Py, R, etc
         * TO-DO: Do we want to reference other queries
         */
        // const frames = useMemo(() => {
        //     const frameList = [];
        //     Object.values(cell.query.cells).forEach((cell) => {
        //         if (cell.widget === 'query-import') {
        //             frameList.push(cell);
        //         }
        //     });

        //     return frameList;
        // }, []);

        // if (
        //     (!doesFrameExist && !cellTransformation.parameters.newColumn) ||
        //     !targetCell.isExecuted
        // ) {
        //     return (
        //         <TransformationCellInput
        //             isExpanded={isExpanded}
        //             display={Transformations[cellTransformation.key].display}
        //             Icon={Transformations[cellTransformation.key].icon}
        //             frame={{
        //                 cell: cell,
        //                 options: frames,
        //             }}
        //         >
        //             <Stack width="100%" paddingY={0.75}>
        //                 <Typography variant="caption">
        //                     <em>{helpText}</em>
        //                 </Typography>
        //             </Stack>
        //         </TransformationCellInput>
        //     );
        // }

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
                    <Typography variant="caption">
                        {/* {!doesFrameExist ? (
                            <em>{helpText}</em>
                        ) : (
                            "Add a new column for the cumulative sum of another column's values"
                        )} */}
                    </Typography>
                    <TextField
                        // disabled={!doesFrameExist}
                        // value={cellTransformation.newColumn}
                        label="Column Name"
                        variant="outlined"
                        fullWidth
                        size="small"
                        onChange={(e) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: '.parameters.newColumn',
                                    value: e.target.value,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField2
                        // disabled={!doesFrameExist}
                        // selectedColumns={
                        //     cellTransformation.parameters.valueColumn
                        // }
                        label="Aggregate Value"
                        cell={cell}
                        selectedColumns={[]}
                        onChange={(newColumn: ColumnInfoTwo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.valueColumn',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField2
                        // disabled={!doesFrameExist}
                        // selectedColumns={
                        //     cellTransformation.parameters.sortColumns
                        // }
                        label="Sort by Column(s)"
                        selectedColumns={[]}
                        cell={cell}
                        multiple
                        onChange={(newColumn: ColumnInfoTwo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.sortColumns',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField2
                        // selectedColumns={
                        //     cellTransformation.parameters.groupByColumns
                        // }
                        label="Group by Column(s)"
                        cell={cell}
                        selectedColumns={[]}
                        multiple
                        onChange={(newColumn: ColumnInfoTwo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.groupByColumns',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                </Stack>
            </TransformationCellInput2>
        );
    });
