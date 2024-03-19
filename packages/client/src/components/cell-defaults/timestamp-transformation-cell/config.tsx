import { Cell, CellComponent } from '@/stores';
import {
    TransformationDef,
    TransformationCellDef,
    Transformation,
    TransformationTargetCell,
    TransformationCellRunActionButton,
} from '../shared';
import { TimestampTransformationCellInput } from './TimestampTransformationCellInput';

export interface TimestampTransformationDef
    extends TransformationDef<'timestamp'> {
    key: 'timestamp';
    parameters: {
        columnName: string;
        includeTime: boolean;
    };
}

export interface TimestampTransformationCellDef
    extends TransformationCellDef<'timestamp-transformation'> {
    widget: 'timestamp-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<TimestampTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

// export the config for the block
export const TimestampTransformationCell: Cell<TimestampTransformationCellDef> =
    {
        name: 'Timestamp',
        widget: 'timestamp-transformation',
        parameters: {
            transformation: {
                key: 'timestamp',
                parameters: {
                    columnName: '',
                    includeTime: false,
                },
            },
            targetCell: {
                id: '',
                frameVariableName: '',
            },
        },
        view: {
            input: TimestampTransformationCellInput,
        },
        toPixel: ({ transformation, targetCell }) => {
            return `${targetCell.frameVariableName} | TimestampData(newCol=["${transformation.parameters.columnName}"],time=["${transformation.parameters.includeTime}"]);`;
        },
    };
