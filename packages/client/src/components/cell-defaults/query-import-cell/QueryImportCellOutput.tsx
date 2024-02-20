import { CellComponent } from '@/stores';
import { QueryImportCellDef } from './config';
import { QueryPreviewCellOutput } from '../shared';

export const QueryImportCellOutput: CellComponent<QueryImportCellDef> = (
    props,
) => {
    const { cell } = props;

    return (
        <QueryPreviewCellOutput
            cellOutput={cell.output}
            frameVariableName={cell.parameters.frameVariableName}
            targetCellDatabaseId={cell.parameters.databaseId}
            targetCellSelectQuery={cell.parameters.selectQuery}
        />
    );
};
