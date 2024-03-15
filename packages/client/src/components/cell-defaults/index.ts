import { CellTypeRegistry } from '@/stores';
import { CodeCell, CodeCellDef } from './code-cell';
import { QueryImportCell, QueryImportCellDef } from './query-import-cell';
import {
    UppercaseTransformationCell,
    UppercaseTransformationCellDef,
} from './uppercase-transformation-cell';
import {
    UpdateRowTransformationCell,
    UpdateRowTransformationCellDef,
} from './update-row-transformation-cell';
import {
    ColumnTypeTransformationCell,
    ColumnTypeTransformationCellDef,
} from './column-type-transformation-cell';
import {
    DateDifferenceTransformationCell,
    DateDifferenceTransformationCellDef,
} from './date-difference-transformation-cell';
import {
    TimestampTransformationCell,
    TimestampTransformationCellDef,
} from './timestamp-transformation-cell';
import {
    JoinTransformationCell,
    JoinTransformationCellDef,
} from './join-transformation-cell';

export type DefaultCellDefinitions =
    | CodeCellDef
    | QueryImportCellDef
    | UppercaseTransformationCellDef
    | UpdateRowTransformationCellDef
    | ColumnTypeTransformationCellDef
    | DateDifferenceTransformationCellDef
    | TimestampTransformationCellDef
    | JoinTransformationCellDef;

export const DefaultCellTypes: CellTypeRegistry<DefaultCellDefinitions> = {
    [CodeCell.widget]: CodeCell,
    [QueryImportCell.widget]: QueryImportCell,
    [UppercaseTransformationCell.widget]: UppercaseTransformationCell,
    [UpdateRowTransformationCell.widget]: UpdateRowTransformationCell,
    [ColumnTypeTransformationCell.widget]: ColumnTypeTransformationCell,
    [DateDifferenceTransformationCell.widget]: DateDifferenceTransformationCell,
    [TimestampTransformationCell.widget]: TimestampTransformationCell,
    [JoinTransformationCell.widget]: JoinTransformationCell,
};
