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

export type DefaultCellDefinitions =
    | CodeCellDef
    | QueryImportCellDef
    | UppercaseTransformationCellDef
    | UpdateRowTransformationCellDef
    | ColumnTypeTransformationCellDef;

export const DefaultCellTypes: CellTypeRegistry<DefaultCellDefinitions> = {
    [CodeCell.widget]: CodeCell,
    [QueryImportCell.widget]: QueryImportCell,
    [UppercaseTransformationCell.widget]: UppercaseTransformationCell,
    [UpdateRowTransformationCell.widget]: UpdateRowTransformationCell,
    [ColumnTypeTransformationCell.widget]: ColumnTypeTransformationCell,
};
