import { useMemo } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Stack, Typography } from '@semoss/ui';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { useBlocks } from '@/hooks';

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

// export interface UppercaseTransformationDef
//     extends TransformationDef<'uppercase'> {
//     key: 'uppercase';
//     parameters: {
//         columns: ColumnInfo[];
//     };
// }

export interface UppercaseTransformationCellDef
    extends TransformationCellDef<'uppercase-transformation'> {
    widget: 'uppercase-transformation';
    parameters: {
        columns: ColumnInfo[];
        frame: string;
    };
}

export const UppercaseTransformationCell: CellComponent<UppercaseTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        /**
         * Cell that Transformation will be made to
         */
        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        /**
         * Type of Transformation
         */
        const cellTransformation: Transformation<UppercaseTransformationDef> =
            computed(() => {
                return cell.parameters
                    .transformation as Transformation<UppercaseTransformationDef>;
            }).get();

        /**
         * Determines if Target Cell is a frame and is executed
         */
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
                            'Change the values of the selected columns to uppercase'
                        )}
                    </Typography>
                    <ColumnTransformationField
                        disabled={!doesFrameExist}
                        cell={cell}
                        selectedColumns={
                            cellTransformation.parameters.columns ?? []
                        }
                        multiple
                        columnTypes={['STRING']}
                        onChange={(newColumns: ColumnInfo[]) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.transformation.parameters.columns',
                                    value: newColumns,
                                },
                            });
                        }}
                    />
                </Stack>
            </TransformationCellInput>
        );
    });
