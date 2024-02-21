import { CellTypeRegistry } from '@/stores';
import { CodeCell, CodeCellDef } from './code-cell';
import { QueryImportCell, QueryImportCellDef } from './query-import-cell';
import {
    TransformationCell,
    TransformationCellDef,
} from './clean-routine-cell';

export type DefaultCellDefinitions =
    | CodeCellDef
    | QueryImportCellDef
    | TransformationCellDef;

export const DefaultCellTypes: CellTypeRegistry<DefaultCellDefinitions> = {
    [CodeCell.widget]: CodeCell,
    [QueryImportCell.widget]: QueryImportCell,
    [TransformationCell.widget]: TransformationCell,
};
