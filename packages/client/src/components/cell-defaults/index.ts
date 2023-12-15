import { CellRegistry } from '@/stores';
import { CodeCell, CodeCellDef } from './code-cell';

export type DefaultCellDefinitions = CodeCellDef;

export const DefaultCells: CellRegistry<DefaultCellDefinitions> = {
    [CodeCell.widget]: CodeCell,
};
