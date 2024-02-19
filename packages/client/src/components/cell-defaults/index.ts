import { CellTypeRegistry } from '@/stores';
import { CodeCell, CodeCellDef } from './code-cell';
import { QueryImportCell, QueryImportCellDef } from './query-import-cell';
import { CleanRoutineCell, CleanRoutineCellDef } from './clean-routine-cell';

export type DefaultCellDefinitions =
    | CodeCellDef
    | QueryImportCellDef
    | CleanRoutineCellDef;

export const DefaultCellTypes: CellTypeRegistry<DefaultCellDefinitions> = {
    [CodeCell.widget]: CodeCell,
    [QueryImportCell.widget]: QueryImportCell,
    [CleanRoutineCell.widget]: CleanRoutineCell,
};
