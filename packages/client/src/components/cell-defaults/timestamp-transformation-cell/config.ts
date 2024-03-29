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
        toPixel: ({ transformation, targetCell }) => {
            return `${targetCell.frameVariableName} | TimestampData(newCol=["${transformation.parameters.columnName}"],time=["${transformation.parameters.includeTime}"]);`;
        },
    };
