import { CellRegistry } from "../../store";

import { CodeCellConfig, CodeCellDef } from "./code-cell";
import { QueryImportCellConfig, QueryImportCellDef } from "./query-import-cell";
import { SendEmailCellConfig, SendEmailCellDef } from "./send-email-cell";
import { FilterDataCellConfig, FilterDataCellDef } from "./filter-data-cell";
import {
    UnFilterDataCellConfig,
    UnFilterDataCellDef,
} from "./unfilter-data-cell";
import {
    UppercaseTransformationCellConfig,
    UppercaseTransformationCellDef,
} from "./uppercase-transformation-cell";
import {
    UpdateRowTransformationCellConfig,
    UpdateRowTransformationCellDef,
} from "./update-row-transformation-cell";
import {
    ColumnTypeTransformationCellConfig,
    ColumnTypeTransformationCellDef,
} from "./column-type-transformation-cell";
import { DataImportCellConfig, DataImportCellDef } from "./data-import-cell";
import {
    DateDifferenceTransformationCellConfig,
    DateDifferenceTransformationCellDef,
} from "./date-difference-transformation-cell";
import {
    TimestampTransformationCellConfig,
    TimestampTransformationCellDef,
} from "./timestamp-transformation-cell";

import {
    CollapseTransformationCellConfig,
    CollapseTransformationCellDef,
} from "./collapse-transformation-cell";

import {
    CumulativeSumTransformationCellConfig,
    CumulativeSumTransformationCellDef,
} from "./cumulative-sum-transformation-cell";

import {
    EncodeColumnTransformationCellConfig,
    EncodeColumnTransformationCellDef,
} from "./encode-column-transformation-cell";

import {
    JoinTransformationCellConfig,
    JoinTransformationCellDef,
} from "./join-transformation-cell";

import { LLMCellDef, LLMCellConfig } from "./llm-cell";

import { TransformationCellDef } from "./shared";

export type DefaultCellDefinitions =
    | CodeCellDef
    | QueryImportCellDef
    | DataImportCellDef
    | FilterDataCellDef
    | UnFilterDataCellDef
    | TransformationCellDef
    | UppercaseTransformationCellDef
    | UpdateRowTransformationCellDef
    | LLMCellDef
    | ColumnTypeTransformationCellDef
    | DateDifferenceTransformationCellDef
    | TimestampTransformationCellDef
    | JoinTransformationCellDef
    | CumulativeSumTransformationCellDef
    | EncodeColumnTransformationCellDef
    | CollapseTransformationCellDef
    | SendEmailCellDef;

export const DefaultCells: CellRegistry<DefaultCellDefinitions> = {
    [CodeCellConfig.widget]: CodeCellConfig,
    [QueryImportCellConfig.widget]: QueryImportCellConfig,
    [FilterDataCellConfig.widget]: FilterDataCellConfig,
    [UnFilterDataCellConfig.widget]: UnFilterDataCellConfig,
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
    [LLMCellConfig.widget]: LLMCellConfig,
    [SendEmailCellConfig.widget]: SendEmailCellConfig,
} as const;

const filteredTransformations: Partial<CellRegistry<DefaultCellDefinitions>> =
    {};

const filteredOtherCells: Partial<CellRegistry<DefaultCellDefinitions>> = {};
// Iterate through the data object and filter out the cell types that have 'transformation' key
Object.entries(DefaultCells).forEach(([key, value]) => {
    const val = value;

    if (val.parameters && val.parameters.transformation) {
        filteredTransformations[key] = value;
    }
});

Object.entries(DefaultCells).forEach(([key, value]) => {
    const val = value;

    if (val.parameters && val.parameters.others) {
        filteredTransformations[key] = value;
    }
});

export const TransformationCells = filteredTransformations;

export const OtherCells = filteredOtherCells;
