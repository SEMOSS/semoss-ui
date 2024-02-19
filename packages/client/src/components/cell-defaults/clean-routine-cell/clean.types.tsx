export type CleanRoutineTypes = 'uppercase';

export interface CleanRoutineDef<W extends string = string> {
    /** Unique routine name */
    routine: W;

    /** Parameters associated with the routine */
    parameters: Record<string, unknown>;
}

export interface CleanRoutineTargetCell {
    id: string;
    frameVariableName: string;
}

export interface UppercaseCleanRoutineDef extends CleanRoutineDef<'uppercase'> {
    routine: 'uppercase';
    parameters: {
        columns: string[];
    };
}

export interface CleanRoutine<D extends CleanRoutineDef = CleanRoutineDef> {
    routine: D['routine'];
    parameters: D['parameters'];
}
