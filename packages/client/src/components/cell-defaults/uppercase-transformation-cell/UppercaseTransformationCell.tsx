import { useBlocks } from '@/hooks';
import { computed } from 'mobx';
import { CellComponent, ActionMessages, CellState } from '@/stores';
import { Stack, Typography } from '@semoss/ui';
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

export interface UppercaseTransformationDef
    extends TransformationDef<'uppercase'> {
    key: 'uppercase';
    parameters: {
        columns: ColumnInfo[];
    };
}

export interface UppercaseTransformationCellDef
    extends TransformationCellDef<'uppercase-transformation'> {
    widget: 'uppercase-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<UppercaseTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

export const UppercaseTransformationCell: CellComponent<
    UppercaseTransformationCellDef
> = (props) => {
    const { cell, isExpanded } = props;
    const { state } = useBlocks();

    const targetCell: CellState<QueryImportCellDef> = computed(() => {
        return cell.query.cells[
            cell.parameters.targetCell.id
        ] as CellState<QueryImportCellDef>;
    }).get();

    const cellTransformation: Transformation<UppercaseTransformationDef> =
        computed(() => {
            return cell.parameters
                .transformation as Transformation<UppercaseTransformationDef>;
        }).get();

    const doesFrameExist: boolean = computed(() => {
        return !!targetCell && (targetCell.isExecuted || !!targetCell.output);
    }).get();

    const helpText = cell.parameters.targetCell.id
        ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying a transformation.`
        : 'A Python or R target frame variable must be defined in order to apply a transformation.';

    if (!doesFrameExist && !cellTransformation.parameters.columns.length) {
        return (
            <TransformationCellInput
                isExpanded={isExpanded}
                display={Transformations[cellTransformation.key].display}
                Icon={Transformations[cellTransformation.key].icon}
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
};

UppercaseTransformationCell.config = {
    name: 'Uppercase',
    widget: 'uppercase-transformation',
    parameters: {
        transformation: {
            key: 'uppercase',
            parameters: {
                columns: [],
            },
        },
        targetCell: {
            id: '',
            frameVariableName: '',
        },
    },
    toPixel: ({ transformation, targetCell }) => {
        const columnNames = transformation.parameters.columns.map(
            (column) => column.name,
        );
        return `${
            targetCell.frameVariableName
        } | ToUpperCase ( columns = ${JSON.stringify(columnNames)} ) ;`;
    },
};
