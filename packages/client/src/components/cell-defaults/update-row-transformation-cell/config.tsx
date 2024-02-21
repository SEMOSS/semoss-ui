import { Cell, CellComponent } from '@/stores';
import {
    ColumnInfo,
    TransformationDef,
    TransformationCellTitle,
    TransformationCellDef,
    TransformationCellOutput,
    Transformation,
    TransformationTargetCell,
    operation,
} from '../shared';
import { UpdateRowTransformationCellInput } from './UpdateRowTransformationCellInput';
import { UpdateRowTransformationCellRunActionButton } from './UpdateRowTransformationCellRunActionButton';

export interface UpdateRowTransformationDef
    extends TransformationDef<'update-row'> {
    key: 'update-row';
    parameters: {
        compareColumn: ColumnInfo;
        compareOperation: operation;
        compareValue: string;
        targetColumn: ColumnInfo;
        targetValue: string;
    };
}

export interface UpdateRowTransformationCellDef
    extends TransformationCellDef<'update-row-transformation'> {
    widget: 'update-row-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<UpdateRowTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

// export the config for the block
export const UpdateRowTransformationCell: Cell<UpdateRowTransformationCellDef> =
    {
        widget: 'update-row-transformation',
        parameters: {
            transformation: {
                key: 'update-row',
                parameters: {
                    compareColumn: {
                        name: '',
                        dataType: '',
                    },
                    compareOperation: '==',
                    compareValue: '',
                    targetColumn: {
                        name: '',
                        dataType: '',
                    },
                    targetValue: '',
                },
            },
            targetCell: {
                id: '',
                frameVariableName: '',
            },
        },
        view: {
            title: TransformationCellTitle as CellComponent<UpdateRowTransformationCellDef>,
            input: UpdateRowTransformationCellInput,
            output: TransformationCellOutput as CellComponent<UpdateRowTransformationCellDef>,
            runActionButton: UpdateRowTransformationCellRunActionButton,
        },
        toPixel: ({ transformation, targetCell }) => {
            return `${targetCell.frameVariableName} | UpdateRowValues (${transformation.parameters.targetColumn}, ${transformation.parameters.targetValue}, Filter (${transformation.parameters.compareColumn} ${transformation.parameters.compareOperation} ${transformation.parameters.compareValue}))`;
        },
    };
