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
    dateUnit,
    dateType,
} from '../shared';
import { DateDifferenceTransformationCellInput } from './DateDifferenceTransformationCellInput';

export interface DateDifferenceTransformationDef
    extends TransformationDef<'date-difference'> {
    key: 'date-difference';
    parameters: {
        startType: dateType;
        startCustomDate: string;
        startColumn: ColumnInfo;
        endType: 'column' | 'custom';
        endCustomDate: string;
        endColumn: ColumnInfo;
        unit: dateUnit;
        columnName: string;
    };
}

export interface DateDifferenceTransformationCellDef
    extends TransformationCellDef<'date-difference-transformation'> {
    widget: 'date-difference-transformation';
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation<DateDifferenceTransformationDef>;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

// export the config for the block
export const DateDifferenceTransformationCell: Cell<DateDifferenceTransformationCellDef> =
    {
        widget: 'date-difference-transformation',
        parameters: {
            transformation: {
                key: 'date-difference',
                parameters: {
                    startType: 'column',
                    startCustomDate: '',
                    startColumn: null,
                    endType: 'column',
                    endCustomDate: '',
                    endColumn: null,
                    unit: 'day',
                    columnName: '',
                },
            },
            targetCell: {
                id: '',
                frameVariableName: '',
            },
        },
        view: {
            title: TransformationCellTitle as CellComponent<DateDifferenceTransformationCellDef>,
            input: DateDifferenceTransformationCellInput,
            output: TransformationCellOutput as CellComponent<DateDifferenceTransformationCellDef>,
            runActionButton:
                TransformationCellRunActionButton as CellComponent<DateDifferenceTransformationCellDef>,
        },
        toPixel: ({ transformation, targetCell }) => {
            const startColumn =
                transformation.parameters.startType === 'column'
                    ? transformation.parameters.startColumn?.name
                    : transformation.parameters.endColumn?.name;
            const endColumn =
                transformation.parameters.endType === 'column'
                    ? transformation.parameters.endColumn?.name
                    : transformation.parameters.startColumn?.name;
            const inputUse =
                transformation.parameters.startType === 'column' &&
                transformation.parameters.endType === 'column'
                    ? 'none'
                    : transformation.parameters.startType === 'custom'
                    ? 'start'
                    : 'end';
            const inputDate =
                transformation.parameters.startType === 'column' &&
                transformation.parameters.endType === 'column'
                    ? 'null'
                    : transformation.parameters.startType === 'custom'
                    ? transformation.parameters.startCustomDate
                    : transformation.parameters.endCustomDate;
            const unit = transformation.parameters.unit;
            const name = transformation.parameters.columnName;
            return `${targetCell.frameVariableName} | DateDifference( start_column = ["${startColumn}"], end_column = ["${endColumn}"], input_use = ["${inputUse}"], input_date = ["${inputDate}"], unit = ["${unit}"], newCol = ["${name}"] );`;
        },
    };
