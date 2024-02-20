import {
    getFrameUpdateRowValuesPipeline,
    getFrameUppercasePipeline,
} from './clean-routine-pipeline-utils';
import {
    CleanRoutineDef,
    CleanRoutineTargetCell,
    CleanRoutineTypes,
    UpdateRowValuesCleanRoutineDef,
    UppercaseCleanRoutineDef,
    operation,
} from './clean.types';
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

export interface CleanRoutineConfig<
    D extends CleanRoutineDef = CleanRoutineDef,
> {
    routine: D['routine'];
    parameters: D['parameters'];
    toPixel: (
        /** Parameters associated with the routine */
        parameters: D['parameters'],
        targetCell: CleanRoutineTargetCell,
    ) => string;
}

export const CleanRoutines: Record<
    CleanRoutineTypes,
    {
        routine: CleanRoutineTypes;
        display: string;
        icon: React.FunctionComponent;
        config: CleanRoutineConfig;
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
        } as CleanRoutineConfig<UppercaseCleanRoutineDef>,
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
        } as CleanRoutineConfig<UpdateRowValuesCleanRoutineDef>,
    },
};
