import { CellDef } from '@/stores';

export type dataTypes = 'STRING' | 'NUMBER' | 'DATE';

export type ColumnInfoTwo = {
    type: string;
    value: string;
};

// -------

export type operation = '==' | '<' | '>' | '!=' | '<=' | '>=' | '?like';

export type comparator = '==' | '!=';

export type columnTypes = 'STRING' | 'NUMBER' | 'DATE';

export type dateUnit = 'day' | 'week' | 'month' | 'year';

export type dateType = 'column' | 'custom';

export type joinType = {
    name: string;
    code: string;
};

export type ColumnInfo = {
    name: string;
    dataType: string;
};

export type TransformationTypes =
    | 'uppercase-transformation'
    | 'column-type-transformation'
    | 'encode-column-transformation'
    | 'timestamp-transformation'
    | 'update-row-transformation'
    | 'cumulative-sum'
    | 'date-difference'
    | 'collapse'
    | 'join';

export interface TransformationDef<R extends string = string> {
    /** Unique transformation name */
    key: R;

    /** Parameters associated with the transformation */
    parameters: Record<string, unknown>;
}

export interface TransformationCellDef<W extends string = string>
    extends CellDef<W> {
    widget: W;
    parameters: Record<string, unknown>;
}

export interface TransformationMultiCellDef<W extends string = string>
    extends CellDef<W> {
    widget: W;
    parameters: Record<string, unknown>;
}

export interface TransformationTargetCell {
    id: string;
    frameVariableName: string;
}

export interface Transformation<
    D extends TransformationDef = TransformationDef,
> {
    key: D['key'];
    parameters: D['parameters'];
}
