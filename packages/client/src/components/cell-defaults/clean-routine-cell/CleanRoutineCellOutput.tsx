import { computed } from 'mobx';
import { CellComponent, CellState } from '@/stores';
import { CleanRoutineCellDef } from './config';
import { QueryPreviewCellOutput } from '../shared';
import { QueryImportCellDef } from '../query-import-cell';

export const CleanRoutineCellOutput: CellComponent<CleanRoutineCellDef> = (
    props,
) => {
    const { cell } = props;

    const targetCell: CellState<QueryImportCellDef> = computed(() => {
        return cell.query.cells[
            cell.parameters.targetCell.id
        ] as CellState<QueryImportCellDef>;
    }).get();

    switch (cell.parameters.cleanRoutine.routine) {
        case 'uppercase':
            return (
                <QueryPreviewCellOutput
                    cellOutput={cell.output}
                    frameVariableName={
                        cell.parameters.targetCell.frameVariableName
                    }
                    targetCellDatabaseId={targetCell.parameters.databaseId}
                    targetCellSelectQuery={targetCell.parameters.selectQuery}
                />
            );
        default:
            return <></>;
    }
};
