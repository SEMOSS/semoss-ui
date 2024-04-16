import { useMemo } from 'react';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
import {
    ColumnInfoTwo,
    EncodeColumnCheckboxTransformationField,
    TransformationCellInput2,
    Transformations,
} from '../shared';

import { observer } from 'mobx-react-lite';

export interface EncodeColumnTransformationCellDef {
    widget: 'encode-column-transformation';
    parameters: {
        frame: string;
        columns: ColumnInfoTwo[];
    };
}

export const EncodeColumnTransformationCell: CellComponent<EncodeColumnTransformationCellDef> =
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
                    <EncodeColumnCheckboxTransformationField
                        cell={cell}
                        selectedColumns={cell.parameters.columns ?? []}
                        onChange={(newColumns: ColumnInfoTwo[]) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.columns',
                                    value: newColumns,
                                },
                            });
                        }}
                    />
                </Stack>
            </TransformationCellInput2>
        );
    });
