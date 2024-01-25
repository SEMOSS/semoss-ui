import { CellTypeRegistry } from '@/stores';
import { CodeCell, CodeCellDef } from './code-cell';

export type DefaultCellDefinitions = CodeCellDef;

export const DefaultCellTypes: CellTypeRegistry<DefaultCellDefinitions> = {
    [CodeCell.widget]: CodeCell,
};
