import { CellConfig } from '@/stores';
import { QueryImportCell, QueryImportCellDef } from './QueryImportCell';

export const QueryImportCellConfig: CellConfig<QueryImportCellDef> = {
    name: 'Import',
    widget: 'query-import',
    view: QueryImportCell,
    parameters: {
        databaseId: '',
        frameType: 'PY',
        frameVariableName: '',
        selectQuery: '',
    },
    toPixel: ({ databaseId, frameType, frameVariableName, selectQuery }) => {
        return `Database( database=["${databaseId}"] ) | Query("<encode>${selectQuery}</encode>") | Import(frame=[CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameVariableName}"])]);`;
    },
};
