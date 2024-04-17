import { useMemo } from 'react';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, TextField, Typography } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

import {
    ColumnInfoTwo,
    ColumnTransformationField2,
    TransformationCellInput2,
    Transformations,
} from '../shared';

export interface CollapseTransformationCellDef {
    widget: 'collapse-transformation';
    parameters: {
        frame: string;
        //** Column(s) to group */
        groupByColumn: ColumnInfoTwo[];

        //** Value column */
        value: ColumnInfoTwo;

        //** String separator */
        delimiter: string;

        //** Colum(s) to maintain in new table */
        maintainCols?: ColumnInfoTwo[];
    };
}

export const CollapseTransformationCell: CellComponent<CollapseTransformationCellDef> =
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
                    <ColumnTransformationField2
                        label="Group by Column(s)"
                        cell={cell}
                        selectedColumns={cell.parameters.groupByColumn ?? []}
                        multiple
                        onChange={(newColumn: ColumnInfoTwo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.groupByColumn',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField2
                        label="Value Column"
                        cell={cell}
                        selectedColumns={cell.parameters.value}
                        onChange={(newColumn: ColumnInfoTwo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.value',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                    <TextField
                        label="String Separator"
                        variant="outlined"
                        value={cell.parameters.delimiter}
                        fullWidth
                        size="small"
                        onChange={(e) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.delimiter',
                                    value: e.target.value,
                                },
                            });
                        }}
                    />
                    <ColumnTransformationField2
                        label="Other Column(s) to Maintain"
                        cell={cell}
                        selectedColumns={cell.parameters.maintainCols}
                        multiple
                        onChange={(newColumn: ColumnInfoTwo) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.maintainCols',
                                    value: newColumn,
                                },
                            });
                        }}
                    />
                </Stack>
            </TransformationCellInput2>
        );
    });
