import { CellRegistry } from '@/stores';

import { CodeCellConfig, CodeCellDef } from './code-cell';
import { QueryImportCellConfig, QueryImportCellDef } from './query-import-cell';
import { DataImportCellConfig, DataImportCellDef } from './data-import-cell';
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

import {
    CollapseTransformationCellConfig,
    CollapseTransformationCellDef,
} from './collapse-transformation-cell';

import {
    CumulativeSumTransformationCellConfig,
    CumulativeSumTransformationCellDef,
} from './cumulative-sum-transformation-cell';

import {
    EncodeColumnTransformationCellConfig,
    EncodeColumnTransformationCellDef,
} from './encode-column-transformation-cell';

import {
    JoinTransformationCellConfig,
    JoinTransformationCellDef,
} from './join-transformation-cell';

export type DefaultCellDefinitions =
    | CodeCellDef
    | QueryImportCellDef
    | DataImportCellDef
    | UppercaseTransformationCellDef
    | UpdateRowTransformationCellDef
    | ColumnTypeTransformationCellDef
    | DateDifferenceTransformationCellDef
    | TimestampTransformationCellDef
    | JoinTransformationCellDef
    | CumulativeSumTransformationCellDef
    | EncodeColumnTransformationCellDef
    | CollapseTransformationCellDef;

export const DefaultCells: CellRegistry<DefaultCellDefinitions> = {
    [CodeCellConfig.widget]: CodeCellConfig,
    [QueryImportCellConfig.widget]: QueryImportCellConfig,
    [DataImportCellConfig.widget]: DataImportCellConfig,
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
    [JoinTransformationCellConfig.widget]: JoinTransformationCellConfig,
    [CumulativeSumTransformationCellConfig.widget]:
        CumulativeSumTransformationCellConfig,
    [EncodeColumnTransformationCellConfig.widget]:
        EncodeColumnTransformationCellConfig,
    [CollapseTransformationCellConfig.widget]: CollapseTransformationCellConfig,
} as const;

const filteredTransformations: Partial<CellRegistry<DefaultCellDefinitions>> =
    {};

// Iterate through the data object and filter out the cell types that have 'transformation' key
Object.entries(DefaultCells).forEach(([key, value]) => {
    if (value.parameters && value.parameters.transformation) {
        filteredTransformations[key] = value;
    }
});

export const TransformationCells = filteredTransformations;
