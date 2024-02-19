import { Cell, CellDef } from '@/stores';
import { CleanRoutineCellTitle } from './CleanRoutineCellTitle';
import { CleanRoutineCellInput } from './CleanRoutineCellInput';
import { CleanRoutineCellDetails } from './CleanRoutineCellDetails';
import { CleanRoutineCellOutput } from './CleanRoutineCellOutput';
import {
    CleanRoutine,
    CleanRoutineTargetCell,
    UppercaseCleanRoutineDef,
} from './clean.types';
import { CleanRoutines } from './clean.constants';

export interface CleanRoutineCellDef extends CellDef<'clean'> {
    widget: 'clean';
    parameters: {
        /**
         * Routine type
         */
        cleanRoutine: CleanRoutine;

        /**
         * ID of the query cell that defines the frame we want to clean
         */
        targetCell: CleanRoutineTargetCell;
    };
}

// export the config for the block
export const CleanRoutineCell: Cell<CleanRoutineCellDef> = {
    widget: 'clean',
    parameters: {
        cleanRoutine: {
            routine: 'uppercase',
            parameters: {
                columns: [],
            },
        } as CleanRoutine<UppercaseCleanRoutineDef>, // set a default routine
        targetCell: {
            id: '',
            frameVariableName: '',
        },
    },
    view: {
        title: CleanRoutineCellTitle,
        input: CleanRoutineCellInput,
        details: CleanRoutineCellDetails,
        output: CleanRoutineCellOutput,
    },
    toPixel: ({ cleanRoutine, targetCell }) => {
        if (!targetCell.id) {
            return '';
        }
        return CleanRoutines[cleanRoutine.routine].config.toPixel(
            cleanRoutine.parameters,
            targetCell,
        );
    },
};
