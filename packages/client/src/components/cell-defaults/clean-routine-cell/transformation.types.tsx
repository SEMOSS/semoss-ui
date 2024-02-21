export type operation = '==' | '<' | '>' | '!=' | '<=' | '>=' | '?like';

export type ColumnInfo = {
    name: string;
    dataType: string;
};

export type TransformationTypes = 'uppercase' | 'update-row';

export interface TransformationDef<W extends string = string> {
    /** Unique routine name */
    routine: W;

    /** Parameters associated with the routine */
    parameters: Record<string, unknown>;
}

export interface TransformationTargetCell {
    id: string;
    frameVariableName: string;
}

export interface UppercaseTransformationDef
    extends TransformationDef<'uppercase'> {
    routine: 'uppercase';
    parameters: {
        columns: ColumnInfo[];
    };
}

export interface UpdateRowValuesTransformationDef
    extends TransformationDef<'update-row'> {
    routine: 'update-row';
    parameters: {
        compareColumn: ColumnInfo;
        compareOperation: operation;
        compareValue: string;
        targetColumn: ColumnInfo;
        targetValue: string;
    };
}

export interface Transformation<
    D extends TransformationDef = TransformationDef,
> {
    routine: D['routine'];
    parameters: D['parameters'];
}
