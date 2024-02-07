import { CellTypeRegistry } from '@/stores';
import { CodeCell, CodeCellDef } from './code-cell';
import {
    QueryImportCell,
    QueryImportCellDef,
} from './query-import-cell/config';

export type DefaultCellDefinitions = CodeCellDef | QueryImportCellDef;

export const DefaultCellTypes: CellTypeRegistry<DefaultCellDefinitions> = {
    [CodeCell.widget]: CodeCell,
    [QueryImportCell.widget]: QueryImportCell,
};
