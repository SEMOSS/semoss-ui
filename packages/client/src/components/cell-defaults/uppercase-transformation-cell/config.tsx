import { Cell } from '@/stores';
import {
    ColumnInfo,
    TransformationDef,
    TransformationCellDef,
    Transformation,
    TransformationTargetCell,
} from '../shared';
import { UppercaseTransformationCellInput } from './UppercaseTransformationCellInput';

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

// export the config for the block
export const UppercaseTransformationCell: Cell<UppercaseTransformationCellDef> =
    {
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
        view: {
            input: UppercaseTransformationCellInput,
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
