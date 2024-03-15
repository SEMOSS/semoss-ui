import { computed } from 'mobx';
import { CellComponent, CellState } from '@/stores';
import { QueryPreviewCellOutput } from '../QueryPreviewCellOutput';
import { TransformationCellDef } from './transformation.types';
import { QueryImportCellDef } from '../../query-import-cell';

export const TransformationCellOutput: CellComponent<TransformationCellDef> = (
    props,
) => {
    const { cell } = props;

    const targetCell: CellState<QueryImportCellDef> = computed(() => {
        return cell.query.cells[
            cell.parameters.targetCell.id
        ] as CellState<QueryImportCellDef>;
    }).get();

    switch (cell.parameters.transformation.key) {
        case 'uppercase':
        case 'update-row':
        case 'column-type':
        case 'date-difference':
        case 'timestamp':
        case 'join':
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
