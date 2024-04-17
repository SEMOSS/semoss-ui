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
        newColumn: ColumnInfoTwo;

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
                    <TextField
                        label="Column Name"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={cell.parameters.newColumn.value}
                        onChange={(e) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.newColumn',
                                    value: {
                                        type: 'NUMBER',
                                        value: e.target.value,
                                    },
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField2
                        selectedColumns={cell.parameters.valueColumn}
                        label="Aggregate Value"
                        cell={cell}
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
                        selectedColumns={cell.parameters.sortColumns}
                        label="Sort by Column(s)"
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
                        selectedColumns={cell.parameters.groupByColumns}
                        label="Group by Column(s)"
                        cell={cell}
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
