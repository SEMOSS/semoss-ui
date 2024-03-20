import { CellRegistry } from '@/stores';

import { CodeCellConfig, CodeCellDef } from './code-cell';
import { QueryImportCellConfig, QueryImportCellDef } from './query-import-cell';
import {
    UppercaseTransformationCellConfig,
    UppercaseTransformationCellDef,
} from './uppercase-transformation-cell';
import {
    UpdateRowTransformationCellConfig,
    UpdateRowTransformationCellDef,
} from './update-row-transformation-cell';
import {
    ColumnTypeTransformationCellConfig,
    ColumnTypeTransformationCellDef,
} from './column-type-transformation-cell';
import {
    DateDifferenceTransformationCellConfig,
    DateDifferenceTransformationCellDef,
} from './date-difference-transformation-cell';
import {
    TimestampTransformationCellConfig,
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

export const DefaultCells: CellRegistry<DefaultCellDefinitions> = {
    [CodeCellConfig.widget]: CodeCellConfig,
    [QueryImportCellConfig.widget]: QueryImportCellConfig,
    [UppercaseTransformationCellConfig.widget]:
        UppercaseTransformationCellConfig,
    [UpdateRowTransformationCellConfig.widget]:
        UpdateRowTransformationCellConfig,
    [ColumnTypeTransformationCellConfig.widget]:
        ColumnTypeTransformationCellConfig,
    [DateDifferenceTransformationCellConfig.widget]:
        DateDifferenceTransformationCellConfig,
    [TimestampTransformationCellConfig.widget]:
        TimestampTransformationCellConfig,
} as const;
