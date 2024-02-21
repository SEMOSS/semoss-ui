import {
    getFrameUpdateRowValuesPipeline,
    getFrameUppercasePipeline,
} from './transformation-pipeline-utils';
import {
    TransformationDef,
    TransformationTargetCell,
    TransformationTypes,
    UpdateRowValuesTransformationDef,
    UppercaseTransformationDef,
    operation,
} from './transformation.types';
import { FontDownload, TableRows } from '@mui/icons-material';

export const operations: operation[] = [
    '==',
    '<',
    '>',
    '!=',
    '<=',
    '>=',
    '?like',
];

export interface TransformationConfig<
    D extends TransformationDef = TransformationDef,
> {
    routine: D['routine'];
    parameters: D['parameters'];
    toPixel: (
        /** Parameters associated with the routine */
        parameters: D['parameters'],
        targetCell: TransformationTargetCell,
    ) => string;
}

export const Transformations: Record<
    TransformationTypes,
    {
        routine: TransformationTypes;
        display: string;
        icon: React.FunctionComponent;
        config: TransformationConfig;
    }
> = {
    uppercase: {
        routine: 'uppercase',
        display: 'Uppercase',
        icon: FontDownload,
        config: {
            routine: 'uppercase',
            parameters: {
                columns: [],
            },
            toPixel: (parameters, targetCell) => {
                return getFrameUppercasePipeline(
                    targetCell.frameVariableName,
                    parameters.columns.map((column) => column.name),
                );
            },
        } as TransformationConfig<UppercaseTransformationDef>,
    },
    'update-row': {
        routine: 'update-row',
        display: 'Update Row Values',
        icon: TableRows,
        config: {
            routine: 'update-row',
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
            toPixel: (parameters, targetCell) => {
                return getFrameUpdateRowValuesPipeline(
                    targetCell.frameVariableName,
                    parameters.compareColumn.name,
                    parameters.compareOperation,
                    ['INT', 'DOUBLE', 'DECIMAL'].includes(
                        parameters.compareColumn.dataType,
                    )
                        ? parameters.compareValue
                        : `"${parameters.compareValue}"`,
                    parameters.targetColumn.name,
                    ['INT', 'DOUBLE', 'DECIMAL'].includes(
                        parameters.targetColumn.dataType,
                    )
                        ? parameters.targetValue
                        : `"${parameters.targetValue}"`,
                );
            },
        } as TransformationConfig<UpdateRowValuesTransformationDef>,
    },
};
