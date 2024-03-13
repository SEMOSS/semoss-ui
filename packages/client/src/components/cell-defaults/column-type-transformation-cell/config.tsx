import { Cell, CellComponent } from '@/stores';
import {
    ColumnInfo,
    TransformationDef,
    TransformationCellTitle,
    TransformationCellDef,
    TransformationCellOutput,
    Transformation,
    TransformationTargetCell,
    TransformationCellRunActionButton,
    columnTypes,
} from '../shared';
import { ColumnTypeTransformationCellInput } from './ColumnTypeTransformationCellInput';

export interface ColumnTypeTransformationDef
    extends TransformationDef<'column-type'> {
    key: 'column-type';
    parameters: {
        column: ColumnInfo;
        columnType: columnTypes;
    };
}

export interface ColumnTypeTransformationCellDef
    extends TransformationCellDef<'column-type-transformation'> {
    widget: 'column-type-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<ColumnTypeTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

// export the config for the block
export const ColumnTypeTransformationCell: Cell<ColumnTypeTransformationCellDef> =
    {
        widget: 'column-type-transformation',
        parameters: {
            transformation: {
                key: 'column-type',
                parameters: {
                    column: null,
                    columnType: null,
                },
            },
            targetCell: {
                id: '',
                frameVariableName: '',
            },
        },
        view: {
            title: TransformationCellTitle as CellComponent<ColumnTypeTransformationCellDef>,
            input: ColumnTypeTransformationCellInput,
            output: TransformationCellOutput as CellComponent<ColumnTypeTransformationCellDef>,
            runActionButton:
                TransformationCellRunActionButton as CellComponent<ColumnTypeTransformationCellDef>,
        },
        toPixel: ({ transformation, targetCell }) => {
            return `${targetCell.frameVariableName} | ChangeColumnType( column=[${transformation.parameters.column?.name}], dataType=["${transformation.parameters.columnType}"]);`;
        },
    };
