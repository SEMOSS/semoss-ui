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

        toPixel: ({ transformation, targetCell }) => {
            return `${targetCell.frameVariableName} | UpdateRowValues (${transformation.parameters.targetColumn}, ${transformation.parameters.targetValue}, Filter (${transformation.parameters.compareColumn} ${transformation.parameters.compareOperation} ${transformation.parameters.compareValue}))`;
        },
    };
