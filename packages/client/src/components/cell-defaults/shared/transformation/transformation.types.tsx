import { CellDef } from '@/stores';

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
    | 'uppercase'
    | 'update-row'
    | 'column-type'
    | 'date-difference'
    | 'timestamp'
    | 'collapse'
    | 'cumulative-sum'
    | 'encode-column'
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
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation;

        /**
         * ID of the query cell that defines the frame we want to transform
         */
        targetCell: TransformationTargetCell;
    };
}

export interface TransformationMultiCellDef<W extends string = string>
    extends CellDef<W> {
    widget: W;
    parameters: {
        /**
         * Routine type
         */
        transformation: Transformation;

        /**
         * ID of the From query cell that defines the frame we want to transform
         */
        fromTargetCell: TransformationTargetCell;

        /**
         * ID of the To query cell that defines the frame we want to transform
         */
        toTargetCell: TransformationTargetCell;
    };
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
