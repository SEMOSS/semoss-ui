import { CellConfig } from '@/stores';
import { DataImportCell, DataImportCellDef } from './DataImportCell';

export const DataImportCellConfig: CellConfig<DataImportCellDef> = {
    name: 'Data Import',
    widget: 'data-import',
    view: DataImportCell,
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
