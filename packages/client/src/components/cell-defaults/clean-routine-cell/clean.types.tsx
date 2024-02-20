export type operation = '==' | '<' | '>' | '!=' | '<=' | '>=' | '?like';

export type ColumnInfo = {
    name: string;
    dataType: string;
};

export type CleanRoutineTypes = 'uppercase' | 'update-row';

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
        columns: ColumnInfo[];
    };
}

export interface UpdateRowValuesCleanRoutineDef
    extends CleanRoutineDef<'update-row'> {
    routine: 'update-row';
    parameters: {
        compareColumn: ColumnInfo;
        compareOperation: operation;
        compareValue: string;
        targetColumn: ColumnInfo;
        targetValue: string;
    };
}

export interface CleanRoutine<D extends CleanRoutineDef = CleanRoutineDef> {
    routine: D['routine'];
    parameters: D['parameters'];
}
