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
            frame: '',

            startType: 'column',
            startCustomDate: '',
            startColumn: null,
            endType: 'column',
            endCustomDate: '',
            endColumn: null,
            unit: 'day',
            columnName: '',
        },
        toPixel: ({
            frame,
            startType,
            startCustomDate,
            startColumn,
            endType,
            endCustomDate,
            endColumn,
            unit,
            columnName,
        }) => {
            const startCol =
                startType === 'column' ? startColumn?.value : endColumn?.value;
            const endCol =
                endType === 'column' ? endColumn?.value : startColumn?.value;
            const inputUse =
                startType === 'column' && endType === 'column'
                    ? 'none'
                    : startType === 'custom'
                    ? 'start'
                    : 'end';
            const inputDate =
                startType === 'column' && endType === 'column'
                    ? 'null'
                    : startType === 'custom'
                    ? startCustomDate
                    : endCustomDate;
            const un = unit;
            const name = columnName;
            return `${frame} | DateDifference( start_column = ["${startCol}"], end_column = ["${endCol}"], input_use = ["${inputUse}"], input_date = ["${inputDate}"], unit = ["${un}"], newCol = ["${name}"] );`;
        },
    };
