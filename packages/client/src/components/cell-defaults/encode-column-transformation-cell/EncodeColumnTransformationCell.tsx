import { useMemo } from 'react';
import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
import {
    Transformation,
    ColumnInfo,
    EncodeColumnCheckboxTransformationField,
    TransformationCellInput,
    Transformations,
    TransformationDef,
    TransformationCellDef,
    TransformationTargetCell,
} from '../shared';

import { QueryImportCellDef } from '../query-import-cell';
import { observer } from 'mobx-react-lite';

export interface EncodeColumnTransformationDef
    extends TransformationDef<'encode-column'> {
    key: 'encode-column';
    parameters: {
        columns: ColumnInfo[];
    };
}

export interface EncodeColumnTransformationCellDef
    extends TransformationCellDef<'encode-column-transformation'> {
    widget: 'encode-column-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<EncodeColumnTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

export const EncodeColumnTransformationCell: CellComponent<EncodeColumnTransformationCellDef> =
    observer((props) => {
        const { cell, isExpanded } = props;
        const { state } = useBlocks();

        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            return cell.query.cells[
                cell.parameters.targetCell.id
            ] as CellState<QueryImportCellDef>;
        }).get();

        const cellTransformation: Transformation<EncodeColumnTransformationDef> =
            computed(() => {
                return cell.parameters
                    .transformation as Transformation<EncodeColumnTransformationDef>;
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
                            'Obfuscate the values of a column'
                        )}
                    </Typography>
                    <EncodeColumnCheckboxTransformationField
                        disabled={!doesFrameExist}
                        cell={cell}
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
