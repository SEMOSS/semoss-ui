import { getFrameUppercasePipeline } from './clean-routine-pipeline-utils';
import {
    CleanRoutineDef,
    CleanRoutineTargetCell,
    CleanRoutineTypes,
    UppercaseCleanRoutineDef,
} from './clean.types';

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
        config: CleanRoutineConfig;
    }
> = {
    uppercase: {
        routine: 'uppercase',
        display: 'Uppercase',
        config: {
            routine: 'uppercase',
            parameters: {
                columns: [],
            },
            toPixel: (parameters, targetCell) => {
                return getFrameUppercasePipeline(
                    targetCell.frameVariableName,
                    parameters.columns,
                );
            },
        } as CleanRoutineConfig<UppercaseCleanRoutineDef>,
    },
};
