import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Stack } from '@semoss/ui';
import { CellComponent, ActionMessages } from '@/stores';
import { useBlocks } from '@/hooks';

import { ColumnInfoTwo, Transformations } from '../shared';

import {
    ColumnTransformationField2,
    TransformationCellInput2,
} from '../shared';

export interface UppercaseTransformationCellDef {
    widget: 'uppercase-transformation';
    parameters: {
        columns: ColumnInfoTwo[];
        frame: string;
    };
}

export const UppercaseTransformationCell: CellComponent<UppercaseTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        // /**
        //  * Cell that Transformation will be made to
        //  */
        // const targetCell: CellState<QueryImportCellDef> = computed(() => {
        //     return cell.query.cells[
        //         cell.parameters.targetCell.id
        //     ] as CellState<QueryImportCellDef>;
        // }).get();

        /**
         * Type of Transformation
         */
        const cellTransformation = computed(() => {
            return cell.widget;
        }).get();

        // /**
        //  * Determines if Target Cell is a frame and is executed
        //  */
        // const doesFrameExist: boolean = computed(() => {
        //     return (
        //         !!targetCell && (targetCell.isExecuted || !!targetCell.output)
        //     );
        // }).get();

        return (
            <TransformationCellInput2
                isExpanded={isExpanded}
                display={Transformations[cellTransformation].display}
                Icon={Transformations[cellTransformation].icon}
                cell={cell}
            >
                <Stack spacing={2}>
                    <ColumnTransformationField2
                        cell={cell}
                        selectedColumns={cell.parameters.columns ?? []}
                        multiple
                        columnTypes={['STRING']}
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
