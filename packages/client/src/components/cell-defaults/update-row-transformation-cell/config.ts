import { CellConfig } from '@/stores';
import {
    UpdateRowTransformationCell,
    UpdateRowTransformationCellDef,
} from './UpdateRowTransformationCell';

export const UpdateRowTransformationCellConfig: CellConfig<UpdateRowTransformationCellDef> =
    {
        name: 'Update Row',
        widget: 'update-row-transformation',
        view: UpdateRowTransformationCell,
        parameters: {
            frame: '',
            compareColumn: {
                type: '',
                value: '',
            },
            compareOperation: '==',
            compareValue: '',
            targetColumn: {
                type: '',
                value: '',
            },
            targetValue: '',
        },

        toPixel: ({
            frame,
            compareColumn,
            compareOperation,
            compareValue,
            targetColumn,
            targetValue,
        }) => {
            return `${frame} | UpdateRowValues (${targetColumn.value}, ${targetValue}, Filter (${compareColumn.value} ${compareOperation} "${compareValue}")) ;`;
        },
    };
