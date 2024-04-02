import { CellConfig } from '@/stores';
import {
    DateDifferenceTransformationCellDef,
    DateDifferenceTransformationCell,
} from './DateDifferenceTransformationCell';

export const DateDifferenceTransformationCellConfig: CellConfig<DateDifferenceTransformationCellDef> =
    {
        name: 'Date Diference',
        widget: 'date-difference-transformation',
        view: DateDifferenceTransformationCell,
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
