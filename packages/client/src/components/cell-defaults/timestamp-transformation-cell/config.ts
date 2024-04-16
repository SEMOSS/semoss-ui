import { CellConfig } from '@/stores';
import {
    TimestampTransformationCell,
    TimestampTransformationCellDef,
} from './TimestampTransformationCell';

export const TimestampTransformationCellConfig: CellConfig<TimestampTransformationCellDef> =
    {
        name: 'Timestamp',
        widget: 'timestamp-transformation',
        view: TimestampTransformationCell,
        parameters: {
            frame: '',
            newCol: null,
            time: null,
        },
        toPixel: ({ frame, newCol, time }) => {
            return `${frame} | TimestampData(newCol=["${newCol.value}"],time=["${time.value}"]);`;
        },
    };
