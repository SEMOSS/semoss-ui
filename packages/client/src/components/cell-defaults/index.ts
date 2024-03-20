import { CellComponentRegistry } from '@/stores';
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

export type DefaultCellDefinitions =
    | CodeCellDef
    | QueryImportCellDef
    | UppercaseTransformationCellDef
    | UpdateRowTransformationCellDef
    | ColumnTypeTransformationCellDef
    | DateDifferenceTransformationCellDef
    | TimestampTransformationCellDef;

export const DefaultCells: CellComponentRegistry<DefaultCellDefinitions> = {
    [CodeCell.config.widget]: CodeCell,
    [QueryImportCell.config.widget]: QueryImportCell,
    [UppercaseTransformationCell.config.widget]: UppercaseTransformationCell,
    [UpdateRowTransformationCell.config.widget]: UpdateRowTransformationCell,
    [ColumnTypeTransformationCell.config.widget]: ColumnTypeTransformationCell,
    [DateDifferenceTransformationCell.config.widget]:
        DateDifferenceTransformationCell,
    [TimestampTransformationCell.config.widget]: TimestampTransformationCell,
} as const;
